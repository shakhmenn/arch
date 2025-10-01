import { Task, BulkUpdateTasksRequest, TaskStatus, TaskPriority } from '@/entities/task';
import { TasksRepository } from '../api/tasks-repository';

/**
 * Use case для массовых операций с задачами
 * Поддерживает обновление, удаление и изменение статуса нескольких задач
 */
export class BulkUpdateTasksUseCase {
  constructor(private tasksRepository: TasksRepository) {}

  /**
   * Массовое обновление задач
   */
  async execute(request: BulkUpdateTasksRequest, userId: number): Promise<{
    updated: Task[];
    failed: { taskId: number; error: string }[];
  }> {
    // Валидация запроса
    this.validateBulkRequest(request);

    // Получение задач для обновления
    const tasks = await this.tasksRepository.getByIds(request.taskIds);
    
    // Проверка существования всех задач
    const existingTaskIds = tasks.map(t => t.id);
    const missingTaskIds = request.taskIds.filter(id => !existingTaskIds.includes(id));
    
    if (missingTaskIds.length > 0) {
      throw new Error(`Задачи не найдены: ${missingTaskIds.join(', ')}`);
    }

    // Проверка прав доступа
    const accessErrors = this.validateBulkAccess(tasks, userId);
    if (accessErrors.length > 0) {
      throw new Error(`Недостаточно прав для редактирования задач: ${accessErrors.join(', ')}`);
    }

    const updated: Task[] = [];
    const failed: { taskId: number; error: string }[] = [];

    // Обработка каждой задачи
    for (const task of tasks) {
      try {
        const updatedTask = await this.updateSingleTask(task, request.updates, userId);
        updated.push(updatedTask);
      } catch (error) {
        failed.push({
          taskId: task.id,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    }

    // Логирование массовой операции
    await this.logBulkOperation(request, updated, failed, userId);

    return { updated, failed };
  }

  /**
   * Массовое изменение статуса
   */
  async bulkChangeStatus(
    taskIds: number[],
    newStatus: TaskStatus,
    userId: number
  ): Promise<{ updated: Task[]; failed: { taskId: number; error: string }[] }> {
    return this.execute({
      taskIds,
      updates: { status: newStatus }
    }, userId);
  }

  /**
   * Массовое назначение исполнителя
   */
  async bulkAssign(
    taskIds: number[],
    assigneeId: number,
    userId: number
  ): Promise<{ updated: Task[]; failed: { taskId: number; error: string }[] }> {
    return this.execute({
      taskIds,
      updates: { assigneeId }
    }, userId);
  }

  /**
   * Массовое изменение приоритета
   */
  async bulkChangePriority(
    taskIds: number[],
    priority: TaskPriority,
    userId: number
  ): Promise<{ updated: Task[]; failed: { taskId: number; error: string }[] }> {
    return this.execute({
      taskIds,
      updates: { priority }
    }, userId);
  }

  /**
   * Массовое добавление тегов
   */
  async bulkAddTags(
    taskIds: number[],
    tags: string[],
    userId: number
  ): Promise<{ updated: Task[]; failed: { taskId: number; error: string }[] }> {
    const tasks = await this.tasksRepository.getByIds(taskIds);
    const updated: Task[] = [];
    const failed: { taskId: number; error: string }[] = [];

    for (const task of tasks) {
      try {
        const existingTags = task.tags || [];
        const newTags = [...new Set([...existingTags, ...tags])];
        
        const updatedTask = await this.updateSingleTask(task, { tags: newTags }, userId);
        updated.push(updatedTask);
      } catch (error) {
        failed.push({
          taskId: task.id,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    }

    return { updated, failed };
  }

  /**
   * Массовое удаление задач
   */
  async bulkDelete(
    taskIds: number[],
    userId: number
  ): Promise<{ deleted: number[]; failed: { taskId: number; error: string }[] }> {
    // Получение задач для удаления
    const tasks = await this.tasksRepository.getByIds(taskIds);
    
    // Проверка прав доступа
    const accessErrors = this.validateBulkDeleteAccess(tasks, userId);
    if (accessErrors.length > 0) {
      throw new Error(`Недостаточно прав для удаления задач: ${accessErrors.join(', ')}`);
    }

    const deleted: number[] = [];
    const failed: { taskId: number; error: string }[] = [];

    for (const task of tasks) {
      try {
        await this.tasksRepository.delete(task.id);
        deleted.push(task.id);
        
        // Логирование удаления
        await this.tasksRepository.addActivity(task.id, {
          action: 'TASK_DELETED',
          description: `Задача "${task.title}" удалена`,
          userId,
          taskId: task.id,
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        failed.push({
          taskId: task.id,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    }

    return { deleted, failed };
  }

  private validateBulkRequest(request: BulkUpdateTasksRequest): void {
    if (!request.taskIds || request.taskIds.length === 0) {
      throw new Error('Список задач для обновления не может быть пустым');
    }

    if (request.taskIds.length > 100) {
      throw new Error('Нельзя обновить более 100 задач за один раз');
    }

    if (!request.updates || Object.keys(request.updates).length === 0) {
      throw new Error('Необходимо указать поля для обновления');
    }

    // Валидация уникальности ID
    const uniqueIds = new Set(request.taskIds);
    if (uniqueIds.size !== request.taskIds.length) {
      throw new Error('Список содержит дублирующиеся ID задач');
    }
  }

  private validateBulkAccess(tasks: Task[], userId: number): number[] {
    const accessErrors: number[] = [];

    for (const task of tasks) {
      const canEdit = task.createdById === userId || 
                     task.assigneeId === userId ||
                     task.project?.ownerId === userId;
      
      if (!canEdit) {
        accessErrors.push(task.id);
      }
    }

    return accessErrors;
  }

  private validateBulkDeleteAccess(tasks: Task[], userId: number): number[] {
    const accessErrors: number[] = [];

    for (const task of tasks) {
      // Для удаления требуются более строгие права
      const canDelete = task.createdById === userId || task.project?.ownerId === userId;
      
      if (!canDelete) {
        accessErrors.push(task.id);
      }
    }

    return accessErrors;
  }

  private async updateSingleTask(
    task: Task,
    updates: Partial<Task>,
    userId: number
  ): Promise<Task> {
    // Подготовка данных для обновления
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Обработка изменения статуса
    if (updates.status && updates.status !== task.status) {
      updateData.completedAt = updates.status === TaskStatus.DONE 
        ? new Date().toISOString() 
        : undefined;
      
      if (updates.status === TaskStatus.DONE) {
        updateData.progress = 100;
      } else if (updates.status === TaskStatus.TODO) {
        updateData.progress = 0;
      }
    }

    // Обновление задачи
    const updatedTask = await this.tasksRepository.update(task.id, updateData);

    // Логирование изменений
    await this.logTaskUpdate(task, updatedTask, userId, true);

    return updatedTask;
  }

  private async logBulkOperation(
    request: BulkUpdateTasksRequest,
    updated: Task[],
    failed: { taskId: number; error: string }[],
    userId: number
  ): Promise<void> {
    const totalTasks = request.taskIds.length;
    const successCount = updated.length;
    const failedCount = failed.length;

    const description = `Массовая операция: обновлено ${successCount} из ${totalTasks} задач`;
    
    // Логируем общую информацию о массовой операции
    // Это можно сохранить в отдельную таблицу операций или в общий лог
    console.log({
      action: 'BULK_UPDATE',
      description,
      userId,
      metadata: {
        totalTasks,
        successCount,
        failedCount,
        updates: request.updates,
        failed: failed.length > 0 ? failed : undefined
      },
      createdAt: new Date().toISOString()
    });
  }

  private async logTaskUpdate(
    oldTask: Task,
    newTask: Task,
    userId: number,
    isBulkOperation: boolean = false
  ): Promise<void> {
    const changes: string[] = [];

    if (oldTask.status !== newTask.status) {
      changes.push(`статус: ${oldTask.status} → ${newTask.status}`);
    }

    if (oldTask.priority !== newTask.priority) {
      changes.push(`приоритет: ${oldTask.priority} → ${newTask.priority}`);
    }

    if (oldTask.assigneeId !== newTask.assigneeId) {
      const oldAssignee = oldTask.assigneeId || 'не назначен';
      const newAssignee = newTask.assigneeId || 'не назначен';
      changes.push(`исполнитель: ${oldAssignee} → ${newAssignee}`);
    }

    if (changes.length > 0) {
      const description = isBulkOperation 
        ? `Массовое обновление: ${changes.join(', ')}`
        : `Обновлено: ${changes.join(', ')}`;

      await this.tasksRepository.addActivity(newTask.id, {
        action: 'TASK_UPDATED',
        description,
        userId,
        taskId: newTask.id,
        metadata: {
          isBulkOperation,
          changes: { old: oldTask, new: newTask }
        },
        createdAt: new Date().toISOString()
      });
    }
  }
}