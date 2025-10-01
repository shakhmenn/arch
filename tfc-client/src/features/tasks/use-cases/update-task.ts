import { Task, UpdateTaskRequest, TaskStatus } from '@/entities/task';
import { TasksRepository } from '../api/tasks-repository';

/**
 * Use case для обновления задачи
 * Поддерживает оптимистичные обновления и валидацию изменений
 */
export class UpdateTaskUseCase {
  constructor(private tasksRepository: TasksRepository) {}

  async execute(taskId: number, request: UpdateTaskRequest, userId: number): Promise<Task> {
    // Получение текущей задачи
    const currentTask = await this.tasksRepository.getById(taskId);
    if (!currentTask) {
      throw new Error('Задача не найдена');
    }

    // Проверка прав доступа
    this.validateUpdatePermissions(currentTask, userId);

    // Валидация изменений
    this.validateUpdateRequest(request, currentTask);

    // Подготовка данных для обновления
    const updateData = {
      ...request,
      updatedAt: new Date().toISOString()
    };

    // Обработка изменения статуса
    if (request.status && request.status !== currentTask.status) {
      updateData.completedAt = request.status === TaskStatus.DONE 
        ? new Date().toISOString() 
        : undefined;
      
      // Автоматическое обновление прогресса при изменении статуса
      if (request.status === TaskStatus.DONE) {
        updateData.progress = 100;
      } else if (request.status === TaskStatus.TODO) {
        updateData.progress = 0;
      }
    }

    // Обновление задачи
    const updatedTask = await this.tasksRepository.update(taskId, updateData);

    // Логирование изменений
    await this.logTaskChanges(currentTask, updatedTask, userId);

    return updatedTask;
  }

  /**
   * Оптимистичное обновление для UI
   */
  optimisticUpdate(currentTask: Task, updates: UpdateTaskRequest): Task {
    return {
      ...currentTask,
      ...updates,
      updatedAt: new Date().toISOString()
    };
  }

  private validateUpdatePermissions(task: Task, userId: number): void {
    // Проверяем, может ли пользователь редактировать задачу
    const canEdit = task.createdById === userId || 
                   task.assigneeId === userId ||
                   task.project?.ownerId === userId;
    
    if (!canEdit) {
      throw new Error('Недостаточно прав для редактирования задачи');
    }
  }

  private validateUpdateRequest(request: UpdateTaskRequest, currentTask: Task): void {
    if (request.title !== undefined) {
      if (!request.title?.trim()) {
        throw new Error('Название задачи не может быть пустым');
      }
      if (request.title.length > 255) {
        throw new Error('Название задачи не может превышать 255 символов');
      }
    }

    if (request.description !== undefined && request.description.length > 5000) {
      throw new Error('Описание задачи не может превышать 5000 символов');
    }

    if (request.progress !== undefined) {
      if (request.progress < 0 || request.progress > 100) {
        throw new Error('Прогресс должен быть от 0 до 100');
      }
    }

    if (request.estimatedHours !== undefined) {
      if (request.estimatedHours < 0 || request.estimatedHours > 1000) {
        throw new Error('Оценка времени должна быть от 0 до 1000 часов');
      }
    }

    if (request.actualHours !== undefined) {
      if (request.actualHours < 0 || request.actualHours > 1000) {
        throw new Error('Фактическое время должно быть от 0 до 1000 часов');
      }
    }

    if (request.dueDate !== undefined && request.dueDate) {
      const dueDate = new Date(request.dueDate);
      if (isNaN(dueDate.getTime())) {
        throw new Error('Некорректная дата выполнения');
      }
    }

    // Валидация изменения статуса
    if (request.status && !this.isValidStatusTransition(currentTask.status, request.status)) {
      throw new Error(`Невозможно изменить статус с ${currentTask.status} на ${request.status}`);
    }
  }

  private isValidStatusTransition(from: TaskStatus, to: TaskStatus): boolean {
    // Определяем допустимые переходы между статусами
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.TODO, TaskStatus.IN_REVIEW, TaskStatus.DONE, TaskStatus.CANCELLED],
      [TaskStatus.IN_REVIEW]: [TaskStatus.IN_PROGRESS, TaskStatus.DONE, TaskStatus.CANCELLED],
      [TaskStatus.DONE]: [TaskStatus.IN_PROGRESS], // Можно вернуть в работу
      [TaskStatus.CANCELLED]: [TaskStatus.TODO] // Можно восстановить
    };

    return validTransitions[from]?.includes(to) || false;
  }

  private async logTaskChanges(oldTask: Task, newTask: Task, userId: number): Promise<void> {
    const changes: string[] = [];

    if (oldTask.title !== newTask.title) {
      changes.push(`Название изменено с "${oldTask.title}" на "${newTask.title}"`);
    }

    if (oldTask.status !== newTask.status) {
      changes.push(`Статус изменен с "${oldTask.status}" на "${newTask.status}"`);
    }

    if (oldTask.priority !== newTask.priority) {
      changes.push(`Приоритет изменен с "${oldTask.priority}" на "${newTask.priority}"`);
    }

    if (oldTask.assigneeId !== newTask.assigneeId) {
      const oldAssignee = oldTask.assigneeId ? `ID: ${oldTask.assigneeId}` : 'не назначен';
      const newAssignee = newTask.assigneeId ? `ID: ${newTask.assigneeId}` : 'не назначен';
      changes.push(`Исполнитель изменен с "${oldAssignee}" на "${newAssignee}"`);
    }

    if (oldTask.progress !== newTask.progress) {
      changes.push(`Прогресс изменен с ${oldTask.progress}% на ${newTask.progress}%`);
    }

    if (changes.length > 0) {
      await this.tasksRepository.addActivity(newTask.id, {
        action: 'TASK_UPDATED',
        description: changes.join('; '),
        userId,
        taskId: newTask.id,
        metadata: {
          changes: {
            old: oldTask,
            new: newTask
          }
        },
        createdAt: new Date().toISOString()
      });
    }
  }
}