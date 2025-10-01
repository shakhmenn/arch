import { useMutation, useQuery, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { tasksApi, apiClient } from './api-client';
import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  GetTasksRequest,
  GetTasksResponse,
  BulkUpdateTasksRequest,
  TaskFilters,
  TaskActivity,
  TaskAttachment,
  User,
  Project,
  Team
} from '@/entities/task';

// Query Keys Factory
export const queryKeys = {
  // Tasks
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: GetTasksRequest) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
    activities: (taskId: string) => [...queryKeys.tasks.detail(taskId), 'activities'] as const,
    attachments: (taskId: string) => [...queryKeys.tasks.detail(taskId), 'attachments'] as const,
    statistics: (filters?: TaskFilters) => [...queryKeys.tasks.all, 'statistics', filters] as const,
    search: (query: string) => [...queryKeys.tasks.all, 'search', query] as const,
  },
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },
  // Teams
  teams: {
    all: ['teams'] as const,
    lists: () => [...queryKeys.teams.all, 'list'] as const,
    details: () => [...queryKeys.teams.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.teams.details(), id] as const,
  },
} as const;

// Tasks Queries
export function useTasksQuery(
  request: GetTasksRequest = {},
  options?: Omit<UseQueryOptions<GetTasksResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.tasks.list(request),
    queryFn: () => tasksApi.getTasks(request),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export function useTaskQuery(
  id: string,
  options?: Omit<UseQueryOptions<Task>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => tasksApi.getTask(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

export function useTaskActivitiesQuery(
  taskId: string,
  options?: Omit<UseQueryOptions<TaskActivity[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.tasks.activities(taskId),
    queryFn: () => tasksApi.getActivities(taskId),
    enabled: !!taskId,
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useTaskAttachmentsQuery(
  taskId: string,
  options?: Omit<UseQueryOptions<TaskAttachment[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.tasks.attachments(taskId),
    queryFn: () => tasksApi.getAttachments(taskId),
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useTaskStatisticsQuery(
  filters?: TaskFilters,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.tasks.statistics(filters),
    queryFn: () => tasksApi.getStatistics(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

export function useTaskSearchQuery(
  query: string,
  limit?: number,
  options?: Omit<UseQueryOptions<Task[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.tasks.search(query),
    queryFn: () => tasksApi.search(query, limit),
    enabled: query.length >= 2, // Only search with 2+ characters
    staleTime: 30 * 1000,
    ...options,
  });
}

// Users Queries
export function useUsersQuery(
  options?: Omit<UseQueryOptions<User[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.users.lists(),
    queryFn: () => apiClient.getUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useUserQuery(
  id: string,
  options?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => apiClient.getUser(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// Projects Queries
export function useProjectsQuery(
  options?: Omit<UseQueryOptions<Project[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.projects.lists(),
    queryFn: () => apiClient.getProjects(),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useProjectQuery(
  id: string,
  options?: Omit<UseQueryOptions<Project>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => apiClient.getProject(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// Teams Queries
export function useTeamsQuery(
  options?: Omit<UseQueryOptions<Team[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.teams.lists(),
    queryFn: () => apiClient.getTeams(),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useTeamQuery(
  id: string,
  options?: Omit<UseQueryOptions<Team>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.teams.detail(id),
    queryFn: () => apiClient.getTeam(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// Task Mutations
export function useCreateTaskMutation(
  options?: UseMutationOptions<Task, Error, CreateTaskRequest>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tasksApi.createTask,
    onSuccess: (newTask) => {
      // Invalidate and refetch tasks lists
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      
      // Add the new task to the cache
      queryClient.setQueryData(queryKeys.tasks.detail(newTask.id.toString()), newTask);
      
      // Update statistics
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.statistics() });
    },
    ...options,
  });
}

export function useUpdateTaskMutation(
  options?: UseMutationOptions<Task, Error, { id: string; data: UpdateTaskRequest }, { previousTask: Task | undefined }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => tasksApi.updateTask(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.detail(id) });
      
      // Snapshot the previous value
      const previousTask = queryClient.getQueryData<Task>(queryKeys.tasks.detail(id));
      
      // Optimistically update the cache
      if (previousTask) {
        queryClient.setQueryData<Task>(queryKeys.tasks.detail(id), {
          ...previousTask,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }
      
      return { previousTask };
     },
      onError: (_, { id }, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(queryKeys.tasks.detail(id), context.previousTask);
      }
    },
    onSuccess: (updatedTask) => {
      // Update the cache with server response
      queryClient.setQueryData(queryKeys.tasks.detail(updatedTask.id.toString()), updatedTask);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.statistics() });
    },
    ...options,
  });
}

export function useDeleteTaskMutation(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tasksApi.deleteTask,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(deletedId) });
      
      // Invalidate lists and statistics
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.statistics() });
    },
    ...options,
  });
}

export function useBulkUpdateTasksMutation(
  options?: UseMutationOptions<Task[], Error, BulkUpdateTasksRequest>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tasksApi.bulkUpdate,
    onSuccess: (updatedTasks) => {
      // Update individual task caches
      updatedTasks.forEach(task => {
        queryClient.setQueryData(queryKeys.tasks.detail(task.id.toString()), task);
      });
      
      // Invalidate lists and statistics
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.statistics() });
    },
    ...options,
  });
}

export function useBulkDeleteTasksMutation(
  options?: UseMutationOptions<void, Error, string[]>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tasksApi.bulkDelete,
    onSuccess: (_, deletedIds) => {
      // Remove from cache
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(id) });
      });
      
      // Invalidate lists and statistics
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.statistics() });
    },
    ...options,
  });
}

// Task Activity Mutations
export function useAddTaskActivityMutation(
  options?: UseMutationOptions<TaskActivity, Error, { taskId: string; activity: Omit<TaskActivity, 'id' | 'createdAt'> }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, activity }) => tasksApi.addActivity(taskId, activity),
    onSuccess: (_, { taskId }) => {
      // Invalidate activities for this task
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.activities(taskId) });
    },
    ...options,
  });
}

// Task Attachment Mutations
export function useUploadTaskAttachmentMutation(
  options?: UseMutationOptions<TaskAttachment, Error, { taskId: string; file: File }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, file }) => tasksApi.uploadAttachment(taskId, file),
    onSuccess: (_, { taskId }) => {
      // Invalidate attachments for this task
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.attachments(taskId) });
    },
    ...options,
  });
}

export function useDeleteTaskAttachmentMutation(
  options?: UseMutationOptions<void, Error, { taskId: string; attachmentId: string }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, attachmentId }) => tasksApi.deleteAttachment(taskId, attachmentId),
    onSuccess: (_, { taskId }) => {
      // Invalidate attachments for this task
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.attachments(taskId) });
    },
    ...options,
  });
}

// Utility hooks for common patterns
export function useInvalidateTaskQueries() {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() }),
    invalidateTask: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) }),
    invalidateStatistics: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.statistics() }),
  };
}

export function usePrefetchTask() {
  const queryClient = useQueryClient();
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.tasks.detail(id),
      queryFn: () => tasksApi.getTask(id),
      staleTime: 60 * 1000,
    });
  };
}