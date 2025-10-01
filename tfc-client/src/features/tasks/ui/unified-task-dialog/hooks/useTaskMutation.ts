import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCreateTaskMutation, useCreateSubtaskMutation } from '@/features/tasks/api/tasks-api';
import { TaskFormData, DialogMode } from '../types';
import { CreateTaskRequest, CreateSubtaskRequest } from '@/entities/task/model/types';

interface UseTaskMutationProps {
  mode: DialogMode;
  parentTaskId?: number;
  onSuccess?: () => void;
}

export const useTaskMutation = ({ mode, parentTaskId, onSuccess }: UseTaskMutationProps) => {
  const createTaskMutation = useCreateTaskMutation();
  const createSubtaskMutation = useCreateSubtaskMutation();

  const transformTaskData = (data: TaskFormData): CreateTaskRequest => ({
    title: data.title,
    description: data.description,
    priority: data.priority,
    type: data.type!,
    assigneeId: data.assigneeId,
    projectId: data.projectId,
    teamId: data.teamId,
    dueDate: data.dueDate,
    estimatedHours: data.estimatedHours,
  });

  const transformSubtaskData = (data: TaskFormData): CreateSubtaskRequest => ({
    parentTaskId: parentTaskId!,
    title: data.title,
    description: data.description,
    priority: data.priority,
    assigneeId: data.assigneeId,
    dueDate: data.dueDate,
    estimatedHours: data.estimatedHours,
  });

  const mutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      console.log('🔄 useTaskMutation - Starting mutation with data:', data);
      console.log('🔄 useTaskMutation - Mode:', mode, 'ParentTaskId:', parentTaskId);
      
      const transformedData = mode === 'task' 
        ? transformTaskData(data)
        : transformSubtaskData(data);
      
      console.log('🔄 useTaskMutation - Transformed data:', transformedData);
      
      const result = mode === 'task'
        ? await createTaskMutation.mutateAsync(transformedData as CreateTaskRequest)
        : await createSubtaskMutation.mutateAsync(transformedData as CreateSubtaskRequest);
      
      console.log('✅ useTaskMutation - API call successful:', result);
      return result;
    },
    onSuccess: (result) => {
      console.log('✅ useTaskMutation - onSuccess called with result:', result);
      onSuccess?.();
    },
    onError: (error) => {
      console.error('❌ useTaskMutation - Task mutation error:', error);
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
};