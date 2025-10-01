import { z } from 'zod';
import { TaskPriority } from '@/entities/task/model/types';
import type { TaskType } from '@/entities/task/model/types';
import { DialogMode } from '../types';

// Базовая схема для всех задач
const baseTaskSchema = z.object({
  title: z.string().min(1, 'Название задачи обязательно').max(255, 'Название слишком длинное'),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority),
});

// Схема для создания задачи
const taskSchema = baseTaskSchema.extend({
  type: z.union([z.literal('PERSONAL'), z.literal('TEAM')]),
  assigneeId: z.number().optional(),
  projectId: z.number().optional(),
  teamId: z.number().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
});

// Схема для создания подзадачи
const subtaskSchema = baseTaskSchema.extend({
  assigneeId: z.number().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
});

export const useTaskValidation = (mode: DialogMode) => {
  const schema = mode === 'task' ? taskSchema : subtaskSchema;
  
  return {
    schema,
    validate: (data: unknown) => {
      try {
        return { success: true, data: schema.parse(data) };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return { success: false, errors: error.errors };
        }
        return { success: false, errors: [{ message: 'Неизвестная ошибка валидации' }] };
      }
    }
  };
};

export type TaskFormSchema = z.infer<typeof taskSchema>;
export type SubtaskFormSchema = z.infer<typeof subtaskSchema>;