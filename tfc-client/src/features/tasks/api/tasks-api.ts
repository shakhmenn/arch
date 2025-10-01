import { http } from '@shared/api/http';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  SubtaskSummary,
  TaskDetails, 
  TaskAttachment,
  ChangeTaskStatusPayload,
  CreateTaskPayload
} from '@entities/task/model/types';

const TASKS_QUERY_KEY = ['tasks'] as const;

export const useTasksQuery = (params?: GetTasksRequest) => {
  console.log('🔍 useTasksQuery called with params:', params);
  
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, params],
    queryFn: async () => {
      console.log('🚀 useTasksQuery - Making HTTP request to /tasks with params:', params);
      try {
        const result = await http<GetTasksResponse>('/tasks', { 
          method: 'GET',
          params
        });
        console.log('✅ useTasksQuery - HTTP request successful:', {
          result,
          resultType: typeof result,
          hasData: !!result,
          hasTasks: result && 'tasks' in result,
          tasksLength: result && result.tasks ? result.tasks.length : 'N/A'
        });
        return result;
      } catch (error) {
        console.error('❌ useTasksQuery - HTTP request failed:', error);
        throw error;
      }
    },
  });
};

// Hook for getting root tasks (tasks without parent)
export const useRootTasksQuery = (filters?: TaskFilters) => {
  return useQuery({
    queryKey: ['root-tasks', filters],
    queryFn: async () => {
      return await http<Task[]>('/tasks/root', { 
        method: 'GET',
        params: filters
      });
    },
  });
};

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTaskRequest) => {
      return await http<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['root-tasks'] });
    },
  });
};

// Hook for updating task
export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: number; data: UpdateTaskRequest }) => {
      return await http<Task>(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['root-tasks'] });
    },
  });
};

// Hook for bulk operations
export const useBulkUpdateTasksMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BulkUpdateTasksRequest) => {
      return await http<Task[]>('/tasks/bulk', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['root-tasks'] });
    },
  });
};

export const useBulkDeleteTasksMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskIds: number[]) => {
      return await http('/tasks/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ taskIds }),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['root-tasks'] });
    },
  });
};

export const useExportTasksMutation = () => {
  return useMutation({
    mutationFn: async (params: { format: 'csv' | 'xlsx'; filters?: TaskFilters }) => {
      const response = await fetch('/api/tasks/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error('Failed to export tasks');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks.${params.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return blob;
    },
  });
};

export const useImportTasksMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/tasks/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to import tasks: ${response.status} ${errorText}`);
      }
      
      return await response.json() as { imported: number; errors: string[] };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['root-tasks'] });
    },
  });
};

export const useChangeTaskStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ChangeTaskStatusPayload & { taskId: number }) => {
      return await http<Task>(`/tasks/${String(payload.taskId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: payload.status }),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

// Получение деталей задачи с историей активности
export const useTaskDetailsQuery = (taskId: number) => {
  return useQuery({
    queryKey: ['task-details', taskId],
    queryFn: async () => {
      return await http<TaskDetails>(`/tasks/${String(taskId)}/details`, { method: 'GET' });
    },
  });
};

// Загрузка одного файла
export const useUploadAttachmentMutation = (taskId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/tasks/${String(taskId)}/attachments`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload file: ${response.status} ${errorText}`);
      }
      
      return await response.json() as TaskAttachment;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['task-details', taskId] });
    },
  });
};

// Загрузка нескольких файлов
export const useUploadMultipleAttachmentsMutation = (taskId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch(`/api/tasks/${String(taskId)}/attachments/multiple`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload files: ${response.status} ${errorText}`);
      }
      
      return await response.json() as TaskAttachment[];
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['task-details', taskId] });
    },
  });
};

// Удаление файла
export const useDeleteAttachmentMutation = (taskId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attachmentId: number) => {
      return await http(`/tasks/${String(taskId)}/attachments/${String(attachmentId)}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['task-details', taskId] });
    },
  });
};

// Получение истории активности задачи
export const useTaskActivityQuery = (taskId: number) => {
  return useQuery({
    queryKey: ['task-activity', taskId],
    queryFn: async () => {
      return await http<TaskDetails['activity']>(`/tasks/${String(taskId)}/activity`, { method: 'GET' });
    },
  });
};

// Удаление задачи
export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: number) => {
      return await http(`/tasks/${String(taskId)}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['root-tasks'] });
    },
  });
};

// Subtask hooks
export const useSubtasksQuery = (parentTaskId: number) => {
  return useQuery({
    queryKey: ['subtasks', parentTaskId],
    queryFn: async () => {
      return await http<Task[]>(`/tasks/${parentTaskId}/subtasks`, { method: 'GET' });
    },
  });
};

export const useCreateSubtaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSubtaskRequest) => {
      return await http<Task>(`/tasks/${payload.parentTaskId}/subtasks`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['subtasks', variables.parentTaskId] });
      void queryClient.invalidateQueries({ queryKey: ['task-details', variables.parentTaskId] });
    },
  });
};

export const useSubtaskSummaryQuery = (parentTaskId: number) => {
  return useQuery({
    queryKey: ['subtask-summary', parentTaskId],
    queryFn: async () => {
      return await http<SubtaskSummary>(`/tasks/${parentTaskId}/subtasks/summary`, { method: 'GET' });
    },
  });
};

// Task hierarchy hooks
export const useTaskHierarchyQuery = (taskId: number) => {
  return useQuery({
    queryKey: ['task-hierarchy', taskId],
    queryFn: async () => {
      return await http<TaskHierarchy>(`/tasks/${taskId}/hierarchy`, { method: 'GET' });
    },
  });
};

// Task dependencies hooks
export const useTaskDependenciesQuery = (taskId: number) => {
  return useQuery({
    queryKey: ['task-dependencies', taskId],
    queryFn: async () => {
      return await http<TaskDependencyResponse[]>(`/tasks/${taskId}/dependencies`, { method: 'GET' });
    },
  });
};

export const useTaskDependentsQuery = (taskId: number) => {
  return useQuery({
    queryKey: ['task-dependents', taskId],
    queryFn: async () => {
      return await http<TaskDependencyResponse[]>(`/tasks/${taskId}/dependents`, { method: 'GET' });
    },
  });
};

export const useCreateTaskDependencyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTaskDependencyRequest) => {
      return await http<TaskDependencyResponse>('/tasks/dependencies', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['task-dependencies', variables.dependentTaskId] });
      void queryClient.invalidateQueries({ queryKey: ['task-dependents', variables.blockingTaskId] });
    },
  });
};

export const useDeleteTaskDependencyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dependencyId: number) => {
      return await http(`/tasks/dependencies/${dependencyId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['task-dependencies'] });
      void queryClient.invalidateQueries({ queryKey: ['task-dependents'] });
    },
  });
};

// Advanced search hook
export const useTaskSearchMutation = () => {
  return useMutation({
    mutationFn: async (params: TaskSearchRequest) => {
      return await http<GetTasksResponse>('/tasks/search', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  });
};

// Team and project specific hooks
export const useTeamTasksQuery = (teamId: number, filters?: TaskFilters) => {
  return useQuery({
    queryKey: ['team-tasks', teamId, filters],
    queryFn: async () => {
      return await http<Task[]>(`/teams/${teamId}/tasks`, { 
        method: 'GET',
        params: filters
      });
    },
  });
};

export const useUserTasksQuery = (userId: number, filters?: TaskFilters) => {
  return useQuery({
    queryKey: ['user-tasks', userId, filters],
    queryFn: async () => {
      return await http<Task[]>(`/users/${userId}/tasks`, { 
        method: 'GET',
        params: filters
      });
    },
  });
};

// Task assignment hooks
export const useAssignTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, assigneeId }: { taskId: number; assigneeId: number }) => {
      return await http<Task>(`/tasks/${taskId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ assigneeId }),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useUnassignTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: number) => {
      return await http<Task>(`/tasks/${taskId}/unassign`, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

// Task completion hooks
export const useCompleteTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: number) => {
      return await http<Task>(`/tasks/${taskId}/complete`, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useReopenTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: number) => {
      return await http<Task>(`/tasks/${taskId}/reopen`, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

// Legacy support - keeping for backward compatibility
export const useCreateTaskLegacyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTaskPayload) => {
      return await http<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};
