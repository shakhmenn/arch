import { apiClient } from '@/shared/api';
import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  GetTasksRequest,
  GetTasksResponse,
  TaskFilters,
  BulkUpdateTasksRequest,
  CreateTaskDependencyRequest,
  TaskDependencyResponse,
  CreateSubtaskRequest,
  TaskHierarchy,
  TaskSearchRequest,
  SubtaskSummary
} from '../model/types';

export class TaskApi {
  // Basic CRUD operations
  static async getTasks(params?: GetTasksRequest): Promise<GetTasksResponse> {
    const response = await apiClient.get('/tasks', { params });
    return response.data;
  }

  static async getTask(id: number): Promise<Task> {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  }

  static async createTask(data: CreateTaskRequest): Promise<Task> {
    const response = await apiClient.post('/tasks', data);
    return response.data;
  }

  static async updateTask(id: number, data: UpdateTaskRequest): Promise<Task> {
    const response = await apiClient.patch(`/tasks/${id}`, data);
    return response.data;
  }

  static async deleteTask(id: number): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  }

  // Bulk operations
  static async bulkUpdateTasks(data: BulkUpdateTasksRequest): Promise<Task[]> {
    const response = await apiClient.patch('/tasks/bulk', data);
    return response.data;
  }

  static async bulkDeleteTasks(taskIds: number[]): Promise<void> {
    await apiClient.delete('/tasks/bulk', { data: { taskIds } });
  }

  // Subtask operations
  static async getSubtasks(parentTaskId: number): Promise<Task[]> {
    const response = await apiClient.get(`/tasks/${parentTaskId}/subtasks`);
    return response.data;
  }

  static async createSubtask(data: CreateSubtaskRequest): Promise<Task> {
    const response = await apiClient.post(`/tasks/${data.parentTaskId}/subtasks`, data);
    return response.data;
  }

  static async getSubtaskSummary(parentTaskId: number): Promise<SubtaskSummary> {
    const response = await apiClient.get(`/tasks/${parentTaskId}/subtasks/summary`);
    return response.data;
  }

  // Task hierarchy
  static async getTaskHierarchy(taskId: number): Promise<TaskHierarchy> {
    const response = await apiClient.get(`/tasks/${taskId}/hierarchy`);
    return response.data;
  }

  static async getRootTasks(filters?: TaskFilters): Promise<Task[]> {
    const response = await apiClient.get('/tasks/root', { params: filters });
    return response.data;
  }

  // Dependencies
  static async getTaskDependencies(taskId: number): Promise<TaskDependencyResponse[]> {
    const response = await apiClient.get(`/tasks/${taskId}/dependencies`);
    return response.data;
  }

  static async getTaskDependents(taskId: number): Promise<TaskDependencyResponse[]> {
    const response = await apiClient.get(`/tasks/${taskId}/dependents`);
    return response.data;
  }

  static async createTaskDependency(data: CreateTaskDependencyRequest): Promise<TaskDependencyResponse> {
    const response = await apiClient.post('/tasks/dependencies', data);
    return response.data;
  }

  static async deleteTaskDependency(dependencyId: number): Promise<void> {
    await apiClient.delete(`/tasks/dependencies/${dependencyId}`);
  }

  // Advanced search and filtering
  static async searchTasks(params: TaskSearchRequest): Promise<GetTasksResponse> {
    const response = await apiClient.post('/tasks/search', params);
    return response.data;
  }

  // Team and project specific
  static async getTeamTasks(teamId: number, filters?: TaskFilters): Promise<Task[]> {
    const response = await apiClient.get(`/teams/${teamId}/tasks`, { params: filters });
    return response.data;
  }

  static async getProjectTasks(projectId: number, filters?: TaskFilters): Promise<Task[]> {
    const response = await apiClient.get(`/projects/${projectId}/tasks`, { params: filters });
    return response.data;
  }

  static async getUserTasks(userId: number, filters?: TaskFilters): Promise<Task[]> {
    const response = await apiClient.get(`/users/${userId}/tasks`, { params: filters });
    return response.data;
  }

  // Task status operations
  static async changeTaskStatus(taskId: number, status: string): Promise<Task> {
    const response = await apiClient.patch(`/tasks/${taskId}/status`, { status });
    return response.data;
  }

  static async completeTask(taskId: number): Promise<Task> {
    const response = await apiClient.patch(`/tasks/${taskId}/complete`);
    return response.data;
  }

  static async reopenTask(taskId: number): Promise<Task> {
    const response = await apiClient.patch(`/tasks/${taskId}/reopen`);
    return response.data;
  }

  // Task assignment
  static async assignTask(taskId: number, assigneeId: number): Promise<Task> {
    const response = await apiClient.patch(`/tasks/${taskId}/assign`, { assigneeId });
    return response.data;
  }

  static async unassignTask(taskId: number): Promise<Task> {
    const response = await apiClient.patch(`/tasks/${taskId}/unassign`);
    return response.data;
  }
}