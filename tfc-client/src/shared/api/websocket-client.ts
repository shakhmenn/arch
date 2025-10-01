import React, { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  TaskCreatedEvent,
  TaskUpdatedEvent,
  TaskDeletedEvent
} from '@/entities/task';
import { queryKeys } from './query-hooks';

// WebSocket event types are handled directly in the message handlers

// WebSocket connection states
export enum WebSocketState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  RECONNECTING = 'reconnecting'
}

// WebSocket client configuration
interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  protocols?: string[];
}

// WebSocket client class
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private stateListeners: Set<(state: WebSocketState) => void> = new Set();
  private currentState: WebSocketState = WebSocketState.DISCONNECTED;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      protocols: [],
      ...config
    };
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.setState(WebSocketState.CONNECTING);

    try {
      this.ws = new WebSocket(this.config.url, this.config.protocols);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.setState(WebSocketState.ERROR);
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.clearTimers();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.setState(WebSocketState.DISCONNECTED);
  }

  send(type: string, data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', { type, data });
    }
  }

  subscribe(eventType: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  onStateChange(callback: (state: WebSocketState) => void): () => void {
    this.stateListeners.add(callback);
    // Call immediately with current state
    callback(this.currentState);
    
    return () => {
      this.stateListeners.delete(callback);
    };
  }

  getState(): WebSocketState {
    return this.currentState;
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.setState(WebSocketState.CONNECTED);
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.setState(WebSocketState.DISCONNECTED);
      this.clearTimers();
      
      // Reconnect unless it was a clean close
      if (event.code !== 1000) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.setState(WebSocketState.ERROR);
    };
  }

  private handleMessage(message: { type: string; data: any }): void {
    const { type, data } = message;
    
    // Handle heartbeat
    if (type === 'pong') {
      return;
    }

    // Notify listeners
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket event callback:', error);
        }
      });
    }
  }

  private setState(state: WebSocketState): void {
    if (this.currentState !== state) {
      this.currentState = state;
      this.stateListeners.forEach(callback => {
        try {
          callback(state);
        } catch (error) {
          console.error('Error in state change callback:', error);
        }
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.setState(WebSocketState.RECONNECTING);
    this.reconnectAttempts++;
    
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping', {});
      }
    }, this.config.heartbeatInterval);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

// Create singleton WebSocket client
const getWebSocketUrl = (): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws`;
};

export const wsClient = new WebSocketClient({
  url: getWebSocketUrl(),
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000
});

// React hooks for WebSocket integration
export function useWebSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocketClient>(wsClient);

  useEffect(() => {
    const ws = wsRef.current;
    
    // Connect on mount
    ws.connect();

    // Set up task event handlers
    const unsubscribeCreated = ws.subscribe('task:created', (data: TaskCreatedEvent['payload']) => {
      // Add new task to cache
      queryClient.setQueryData(queryKeys.tasks.detail(data.task.id.toString()), data.task);
      
      // Invalidate lists to show new task
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.statistics() });
    });

    const unsubscribeUpdated = ws.subscribe('task:updated', (data: TaskUpdatedEvent['payload']) => {
      // Invalidate task details and lists
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(data.taskId.toString()) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.statistics() });
    });

    const unsubscribeDeleted = ws.subscribe('task:deleted', (data: TaskDeletedEvent['payload']) => {
      // Remove task from cache
      queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(data.taskId.toString()) });
      
      // Invalidate lists and statistics
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.statistics() });
    });

    // Cleanup on unmount
    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      ws.disconnect();
    };
  }, [queryClient]);

  return {
    client: wsRef.current,
    send: wsRef.current.send.bind(wsRef.current),
    subscribe: wsRef.current.subscribe.bind(wsRef.current),
    getState: wsRef.current.getState.bind(wsRef.current)
  };
}

export function useWebSocketState() {
  const [state, setState] = React.useState<WebSocketState>(wsClient.getState());

  useEffect(() => {
    return wsClient.onStateChange(setState);
  }, []);

  return state;
}

// Hook for subscribing to specific WebSocket events
export function useWebSocketEvent<T = any>(
  eventType: string,
  callback: (data: T) => void,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return wsClient.subscribe(eventType, (data: T) => {
      callbackRef.current(data);
    });
  }, [eventType, ...deps]);
}

// Hook for real-time task updates
export function useTaskRealTimeUpdates(taskId?: string) {
  const queryClient = useQueryClient();

  useWebSocketEvent<TaskUpdatedEvent['payload']>(
    'task:updated',
    useCallback((data) => {
      if (!taskId || data.taskId.toString() === taskId) {
        // Invalidate specific task cache
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(data.taskId.toString()) });
      }
    }, [queryClient, taskId])
  );

  useWebSocketEvent<TaskDeletedEvent['payload']>(
    'task:deleted',
    useCallback((data) => {
      if (!taskId || data.taskId.toString() === taskId) {
        queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(data.taskId.toString()) });
      }
    }, [queryClient, taskId])
  );
}