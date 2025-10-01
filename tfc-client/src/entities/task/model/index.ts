// Импорт типов для использования в утилитах
import { Task, TaskStatus, TaskPriority } from './types';

// Экспорт всех типов и интерфейсов доменной модели задач
export * from './types';

// Утилиты для работы с задачами
export const TaskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'В ожидании',
  [TaskStatus.TODO]: 'К выполнению',
  [TaskStatus.IN_PROGRESS]: 'В работе',
  [TaskStatus.IN_REVIEW]: 'На проверке',
  [TaskStatus.DONE]: 'Выполнено',
  [TaskStatus.CANCELLED]: 'Отменено'
};

export const TaskPriorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'Низкий',
  [TaskPriority.MEDIUM]: 'Средний',
  [TaskPriority.HIGH]: 'Высокий',
  [TaskPriority.URGENT]: 'Срочный'
};

export const TaskPriorityColors: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'text-blue-600 bg-blue-50',
  [TaskPriority.MEDIUM]: 'text-yellow-600 bg-yellow-50',
  [TaskPriority.HIGH]: 'text-orange-600 bg-orange-50',
  [TaskPriority.URGENT]: 'text-red-600 bg-red-50'
};

export const TaskStatusColors: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'text-gray-500 bg-gray-100',
  [TaskStatus.TODO]: 'text-gray-600 bg-gray-50',
  [TaskStatus.IN_PROGRESS]: 'text-blue-600 bg-blue-50',
  [TaskStatus.IN_REVIEW]: 'text-purple-600 bg-purple-50',
  [TaskStatus.DONE]: 'text-green-600 bg-green-50',
  [TaskStatus.CANCELLED]: 'text-red-600 bg-red-50'
};

// Утилитарные функции
export const getTaskProgress = (task: Task): number => {
  if (task.status === TaskStatus.DONE) return 100;
  if (task.status === TaskStatus.CANCELLED) return 0;
  return task.progress || 0;
};

export const isTaskOverdue = (task: Task): boolean => {
  if (!task.dueDate || task.status === TaskStatus.DONE) return false;
  return new Date(task.dueDate) < new Date();
};

export const getTaskStatusIcon = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.PENDING:
      return 'clock';
    case TaskStatus.TODO:
      return 'circle';
    case TaskStatus.IN_PROGRESS:
      return 'play-circle';
    case TaskStatus.IN_REVIEW:
      return 'eye';
    case TaskStatus.DONE:
      return 'check-circle';
    case TaskStatus.CANCELLED:
      return 'x-circle';
    default:
      return 'circle';
  }
};

export const getPriorityIcon = (priority: TaskPriority): string => {
  switch (priority) {
    case TaskPriority.LOW:
      return 'arrow-down';
    case TaskPriority.MEDIUM:
      return 'minus';
    case TaskPriority.HIGH:
      return 'arrow-up';
    case TaskPriority.URGENT:
      return 'alert-triangle';
    default:
      return 'minus';
  }
};
