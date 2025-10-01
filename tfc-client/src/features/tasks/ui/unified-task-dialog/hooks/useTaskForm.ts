import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskPriority } from '@/entities/task/model/types';
import type { TaskType } from '@/entities/task/model/types';
import { TaskFormData, DialogMode, TaskFormConfig } from '../types';
import { useTaskValidation } from './useTaskValidation';
import { useTaskMutation } from './useTaskMutation';

interface UseTaskFormProps {
  mode: DialogMode;
  parentTaskId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const getDefaultValues = (mode: DialogMode): TaskFormData => ({
  title: '',
  description: '',
  priority: TaskPriority.MEDIUM,
  ...(mode === 'task' && { type: 'PERSONAL' as TaskType }),
});

const getFormConfig = (mode: DialogMode): TaskFormConfig => ({
  mode,
  showTypeField: mode === 'task',
  showProjectField: mode === 'task',
  showTeamField: mode === 'task',
  showAssigneeField: mode === 'subtask', // Исполнитель только для подзадач
  showDueDateField: true, // Срок выполнения для всех
  showEstimatedHoursField: true,
});

export const useTaskForm = ({ mode, parentTaskId, onSuccess, onCancel }: UseTaskFormProps) => {
  const { schema } = useTaskValidation(mode);
  const mutation = useTaskMutation({ mode, parentTaskId, onSuccess });
  
  const form = useForm<TaskFormData>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(mode),
    mode: 'onChange',
  });

  const config = getFormConfig(mode);

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await mutation.mutateAsync(data);
      form.reset();
    } catch (error) {
      // Ошибка уже обработана в mutation
      console.error('Form submission error:', error);
    }
  });

  const handleCancel = () => {
    form.reset();
    onCancel?.();
  };

  const isLoading = mutation.isLoading;
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  return {
    form,
    config,
    handleSubmit,
    handleCancel,
    isLoading,
    hasErrors,
    mutation,
  };
};