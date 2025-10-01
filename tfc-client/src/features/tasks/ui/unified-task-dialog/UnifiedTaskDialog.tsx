import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { FormProvider } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { UnifiedTaskDialogProps } from './types';
import { useTaskForm } from './hooks';
import { TaskFormFields } from './components';

export const UnifiedTaskDialog = ({
  open,
  onOpenChange,
  mode,
  parentTaskId,
  onSuccess,
}: UnifiedTaskDialogProps) => {
  const {
    form,
    config,
    handleSubmit: originalHandleSubmit,
    handleCancel,
    isLoading,
    hasErrors,
    mutation,
  } = useTaskForm({
    mode,
    parentTaskId,
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    },
    onCancel: () => {
      onOpenChange(false);
    },
  });

  const handleSubmit = async (data) => {
    console.log('🚀 UnifiedTaskDialog - handleSubmit called with data:', data);
    try {
      console.log('📤 UnifiedTaskDialog - Calling mutation.mutateAsync...');
      const result = await mutation.mutateAsync(data);
      console.log('✅ UnifiedTaskDialog - Mutation successful:', result);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('❌ UnifiedTaskDialog - Failed to create task:', error);
    }
  };

  // Сброс формы при закрытии диалога
  useEffect(() => {
    if (!open) {
      form.reset();
      mutation.reset();
    }
  }, [open, form.reset, mutation.reset]);

  const getDialogTitle = () => {
    switch (mode) {
      case 'task':
        return 'Создать задачу';
      case 'subtask':
        return 'Создать подзадачу';
      default:
        return 'Создать задачу';
    }
  };

  const getDialogDescription = () => {
    switch (mode) {
      case 'task':
        return 'Заполните информацию для создания новой задачи';
      case 'subtask':
        return 'Заполните информацию для создания новой подзадачи';
      default:
        return 'Заполните информацию для создания новой задачи';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form id="task-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <TaskFormFields
              control={form.control}
              config={config}
              isLoading={isLoading}
            />

            {/* Отображение ошибок мутации */}
            {mutation.isError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : 'Произошла ошибка при создании задачи'}
                </div>
              </div>
            )}
          </form>
        </FormProvider>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            form="task-form"
            disabled={isLoading || hasErrors}
          >
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {mode === 'task' ? 'Создать задачу' : 'Создать подзадачу'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};