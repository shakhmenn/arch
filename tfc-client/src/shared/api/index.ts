// Core API client
export { ApiClient, apiClient, tasksApi } from './api-client';
export type { ApiResponse, PaginatedResponse, ApiError } from './api-client';

// React Query hooks
export {
  // Query hooks
  useTasksQuery,
  useTaskQuery,
  useTaskActivitiesQuery,
  useTaskAttachmentsQuery,
  useTaskStatisticsQuery,
  useTaskSearchQuery,
  useUsersQuery,
  useUserQuery,
  useProjectsQuery,
  useProjectQuery,
  useTeamsQuery,
  useTeamQuery,
  
  // Mutation hooks
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useBulkUpdateTasksMutation,
  useBulkDeleteTasksMutation,
  useAddTaskActivityMutation,
  useUploadTaskAttachmentMutation,
  useDeleteTaskAttachmentMutation,
  
  // Utility hooks
  useInvalidateTaskQueries,
  usePrefetchTask,
  
  // Query keys
  queryKeys
} from './query-hooks';

// WebSocket client
export {
  WebSocketClient,
  WebSocketState,
  wsClient,
  useWebSocket,
  useWebSocketState,
  useWebSocketEvent,
  useTaskRealTimeUpdates
} from './websocket-client';

// Legacy HTTP client (for backward compatibility)
export { http, setToken, extractToken } from './http';
export type { HttpMethod, HttpOptions, AnyJson } from './http';

// Base API configuration
export { API_URL, getToken, setToken as setAuthToken } from './base-api';