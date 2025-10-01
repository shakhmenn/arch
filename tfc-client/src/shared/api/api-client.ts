import { http } from './http';
import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  GetTasksRequest,
  GetTasksResponse,
  BulkUpdateTasksRequest,
  TaskFilters,
  User,
  Project,
  Team,
  TaskActivity,
  TaskAttachment
} from '@/entities/task';

// Base API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Pagination response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters?: Record<string, any>;
  sorting?: Record<string, 'asc' | 'desc'>;
}

// Error response
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// API Client class
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  // Generic request method with full typing
  private async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: any;
      params?: Record<string, any>;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, params, headers = {} } = options;
    
    // Build URL with query parameters
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    try {
      return await http<T>(url, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
    } catch (error) {
      // Enhanced error handling
      if (error instanceof Error) {
        throw new Error(`API Error: ${error.message}`);
      }
      throw error;
    }
  }

  // Tasks API
  async getTasks(request: GetTasksRequest = {}): Promise<GetTasksResponse> {
    const { filters, sort, page, limit } = request;
    
    const params: Record<string, any> = {};
    
    // Add pagination
    if (page !== undefined) {
      params.page = page;
    }
    if (limit !== undefined) {
      params.limit = limit;
    }
    
    // Add search from filters
    if (filters?.search) {
      params.search = filters.search;
    }
    
    // Add filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[`filter_${key}`] = value;
        }
      });
    }
    
    // Add sorting
    if (sort) {
      params.sort_field = sort.field;
      params.sort_direction = sort.direction;
    }

    return this.request<GetTasksResponse>('/tasks', { params });
  }

  async getTask(id: string): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`);
  }

  async createTask(data: CreateTaskRequest): Promise<Task> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: data
    });
  }

  async updateTask(id: string, data: UpdateTaskRequest): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: data
    });
  }

  async deleteTask(id: string): Promise<void> {
    return this.request<void>(`/tasks/${id}`, {
      method: 'DELETE'
    });
  }

  async bulkUpdateTasks(data: BulkUpdateTasksRequest): Promise<Task[]> {
    return this.request<Task[]>('/tasks/bulk', {
      method: 'PATCH',
      body: data
    });
  }

  async bulkDeleteTasks(taskIds: string[]): Promise<void> {
    return this.request<void>('/tasks/bulk', {
      method: 'DELETE',
      body: { taskIds }
    });
  }

  // Task Activities
  async getTaskActivities(taskId: string): Promise<TaskActivity[]> {
    return this.request<TaskActivity[]>(`/tasks/${taskId}/activities`);
  }

  async addTaskActivity(taskId: string, activity: Omit<TaskActivity, 'id' | 'createdAt'>): Promise<TaskActivity> {
    return this.request<TaskActivity>(`/tasks/${taskId}/activities`, {
      method: 'POST',
      body: activity
    });
  }

  // Task Attachments
  async getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    return this.request<TaskAttachment[]>(`/tasks/${taskId}/attachments`);
  }

  async uploadTaskAttachment(taskId: string, file: File): Promise<TaskAttachment> {
    const formData = new FormData();
    formData.append('file', file);

    // Use fetch directly for file uploads
    const response = await fetch(`${this.baseUrl}/tasks/${taskId}/attachments`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      }
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteTaskAttachment(taskId: string, attachmentId: string): Promise<void> {
    return this.request<void>(`/tasks/${taskId}/attachments/${attachmentId}`, {
      method: 'DELETE'
    });
  }

  // Users API
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  // Projects API
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  // Teams API
  async getTeams(): Promise<Team[]> {
    return this.request<Team[]>('/teams');
  }

  async getTeam(id: string): Promise<Team> {
    return this.request<Team>(`/teams/${id}`);
  }

  // Statistics and Analytics
  async getTaskStatistics(filters?: TaskFilters): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byAssignee: Record<string, number>;
    completionRate: number;
    averageCompletionTime: number;
  }> {
    const params: Record<string, any> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[`filter_${key}`] = value;
        }
      });
    }

    return this.request('/tasks/statistics', { params });
  }

  // Search and Suggestions
  async searchTasks(query: string, limit: number = 10): Promise<Task[]> {
    return this.request<Task[]>('/tasks/search', {
      params: { q: query, limit }
    });
  }

  async getTaskSuggestions(partial: Partial<CreateTaskRequest>): Promise<{
    suggestedAssignees: User[];
    suggestedTags: string[];
    estimatedHours: number;
  }> {
    return this.request('/tasks/suggestions', {
      method: 'POST',
      body: partial
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export convenience methods
export const tasksApi = {
  getTasks: (request?: GetTasksRequest) => apiClient.getTasks(request),
  getTask: (id: string) => apiClient.getTask(id),
  createTask: (data: CreateTaskRequest) => apiClient.createTask(data),
  updateTask: (id: string, data: UpdateTaskRequest) => apiClient.updateTask(id, data),
  deleteTask: (id: string) => apiClient.deleteTask(id),
  bulkUpdate: (data: BulkUpdateTasksRequest) => apiClient.bulkUpdateTasks(data),
  bulkDelete: (taskIds: string[]) => apiClient.bulkDeleteTasks(taskIds),
  getActivities: (taskId: string) => apiClient.getTaskActivities(taskId),
  addActivity: (taskId: string, activity: Omit<TaskActivity, 'id' | 'createdAt'>) => 
    apiClient.addTaskActivity(taskId, activity),
  getAttachments: (taskId: string) => apiClient.getTaskAttachments(taskId),
  uploadAttachment: (taskId: string, file: File) => apiClient.uploadTaskAttachment(taskId, file),
  deleteAttachment: (taskId: string, attachmentId: string) => 
    apiClient.deleteTaskAttachment(taskId, attachmentId),
  getStatistics: (filters?: TaskFilters) => apiClient.getTaskStatistics(filters),
  search: (query: string, limit?: number) => apiClient.searchTasks(query, limit),
  getSuggestions: (partial: Partial<CreateTaskRequest>) => apiClient.getTaskSuggestions(partial)
};