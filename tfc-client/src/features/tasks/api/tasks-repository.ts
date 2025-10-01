import { apiClient, tasksApi } from '@/shared/api/api-client';
import { wsClient } from '@/shared/api/websocket-client';
import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  GetTasksRequest,
  GetTasksResponse,
  BulkUpdateTasksRequest,
  TaskFilters,
  TaskSortOptions,
  TaskActivity,
  TaskAttachment,
  User
} from '@/entities/task';

/**
 * Интерфейс репозитория для работы с задачами
 * Абстракция над API для использования в use-cases
 */
export interface TasksRepository {
  // Основные CRUD операции
  create(data: CreateTaskRequest): Promise<Task>;
  getById(id: number): Promise<Task | null>;
  getByIds(ids: number[]): Promise<Task[]>;
  update(id: number, data: Partial<UpdateTaskRequest>): Promise<Task>;
  delete(id: number): Promise<void>;

  // Получение списков с фильтрацией
  getTasks(request: {
    filters: TaskFilters;
    sort: TaskSortOptions;
    page: number;
    limit: number;
    minimal?: boolean; // Для оптимизации виртуализации
  }): Promise<GetTasksResponse>;

  // Поиск
  searchTasks(filters: TaskFilters & { search: string }, limit: number): Promise<{
    tasks: Task[];
    total: number;
  }>;

  // Работа с активностью
  addActivity(taskId: number, activity: Omit<TaskActivity, 'id'>): Promise<TaskActivity>;
  getActivities(taskId: number, limit?: number): Promise<TaskActivity[]>;

  // Массовые операции
  bulkUpdate(taskIds: number[], updates: Partial<UpdateTaskRequest>): Promise<Task[]>;
  bulkDelete(taskIds: number[]): Promise<void>;

  // Статистика и аналитика
  getTaskStats(filters?: TaskFilters): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
    completedThisWeek: number;
  }>;

  // Подписка на изменения (для real-time обновлений)
  subscribeToUpdates(callback: (event: {
    type: 'created' | 'updated' | 'deleted';
    task: Task;
    userId: number;
  }) => void): () => void; // Возвращает функцию отписки
}

/**
 * Реализация репозитория через HTTP API
 */
export class HttpTasksRepository implements TasksRepository {
  private baseUrl: string;
  private subscribers: Set<(event: any) => void> = new Set();
  private wsConnection: WebSocket | null = null;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.initWebSocketConnection();
  }

  async create(data: CreateTaskRequest): Promise<Task> {
    const response = await fetch(`${this.baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Ошибка создания задачи: ${response.statusText}`);
    }

    return response.json();
  }

  async getById(id: number): Promise<Task | null> {
    const response = await fetch(`${this.baseUrl}/tasks/${id}`);
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Ошибка получения задачи: ${response.statusText}`);
    }

    return response.json();
  }

  async getByIds(ids: number[]): Promise<Task[]> {
    const response = await fetch(`${this.baseUrl}/tasks/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения задач: ${response.statusText}`);
    }

    return response.json();
  }

  async update(id: number, data: Partial<UpdateTaskRequest>): Promise<Task> {
    const response = await fetch(`${this.baseUrl}/tasks/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Ошибка обновления задачи: ${response.statusText}`);
    }

    return response.json();
  }

  async delete(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/tasks/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Ошибка удаления задачи: ${response.statusText}`);
    }
  }

  async getTasks(request: {
    filters: TaskFilters;
    sort: TaskSortOptions;
    page: number;
    limit: number;
    minimal?: boolean; // Для оптимизации виртуализации
  }): Promise<GetTasksResponse> {
    return tasksApi.getTasks(request);
  }

  async searchTasks(filters: TaskFilters & { search: string }, limit: number): Promise<{
    tasks: Task[];
    total: number;
  }> {
    const params = new URLSearchParams();
    params.append('q', filters.search);
    params.append('limit', limit.toString());
    
    // Добавляем дополнительные фильтры
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== 'search' && value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(`${key}[]`, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await fetch(`${this.baseUrl}/tasks/search?${params}`);
    
    if (!response.ok) {
      throw new Error(`Ошибка поиска задач: ${response.statusText}`);
    }

    return response.json();
  }

  async addActivity(taskId: number, activity: Omit<TaskActivity, 'id'>): Promise<TaskActivity> {
    const response = await fetch(`${this.baseUrl}/tasks/${taskId}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activity),
    });

    if (!response.ok) {
      throw new Error(`Ошибка добавления активности: ${response.statusText}`);
    }

    return response.json();
  }

  async getActivities(taskId: number, limit: number = 50): Promise<TaskActivity[]> {
    const response = await fetch(`${this.baseUrl}/tasks/${taskId}/activities?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Ошибка получения активности: ${response.statusText}`);
    }

    return response.json();
  }

  async bulkUpdate(taskIds: number[], updates: Partial<UpdateTaskRequest>): Promise<Task[]> {
    const response = await fetch(`${this.baseUrl}/tasks/bulk-update`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskIds, updates }),
    });

    if (!response.ok) {
      throw new Error(`Ошибка массового обновления: ${response.statusText}`);
    }

    return response.json();
  }

  async bulkDelete(taskIds: number[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/tasks/bulk-delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskIds }),
    });

    if (!response.ok) {
      throw new Error(`Ошибка массового удаления: ${response.statusText}`);
    }
  }

  async getTaskStats(filters?: TaskFilters): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
    completedThisWeek: number;
  }> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(`${key}[]`, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await fetch(`${this.baseUrl}/tasks/stats?${params}`);
    
    if (!response.ok) {
      throw new Error(`Ошибка получения статистики: ${response.statusText}`);
    }

    return response.json();
  }

  subscribeToUpdates(callback: (event: any) => void): () => void {
    this.subscribers.add(callback);
    
    // Возвращаем функцию отписки
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private initWebSocketConnection(): void {
    try {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/tasks`;
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.subscribers.forEach(callback => callback(data));
        } catch (error) {
          console.error('Ошибка обработки WebSocket сообщения:', error);
        }
      };

      this.wsConnection.onclose = () => {
        // Переподключение через 5 секунд
        setTimeout(() => this.initWebSocketConnection(), 5000);
      };

      this.wsConnection.onerror = (error) => {
        console.error('WebSocket ошибка:', error);
      };
    } catch (error) {
      console.error('Ошибка инициализации WebSocket:', error);
    }
  }

  // Очистка ресурсов
  dispose(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.subscribers.clear();
  }
}

// Экспорт singleton экземпляра
export const tasksRepository = new HttpTasksRepository();