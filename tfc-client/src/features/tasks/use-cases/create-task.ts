import { Task, CreateTaskRequest, TaskStatus, TaskPriority } from '@/entities/task';
import { TasksRepository } from '../api/tasks-repository';

/**
 * Use case для создания новой задачи
 * Реализует бизнес-логику создания задачи с валидацией
 */
export class CreateTaskUseCase {
  constructor(private tasksRepository: TasksRepository) {}

  async execute(request: CreateTaskRequest): Promise<Task> {
    // Валидация входных данных
    this.validateCreateTaskRequest(request);

    // Подготовка данных для создания
    const taskData = {
      ...request,
      status: TaskStatus.TODO,
      tags: request.tags || [],
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Создание задачи через репозиторий
    const task = await this.tasksRepository.create(taskData);

    // Логирование активности
    await this.tasksRepository.addActivity(task.id, {
      action: 'TASK_CREATED',
      description: `Задача "${task.title}" создана`,
      userId: task.createdById,
      taskId: task.id,
      createdAt: new Date().toISOString()
    });

    return task;
  }

  private validateCreateTaskRequest(request: CreateTaskRequest): void {
    if (!request.title?.trim()) {
      throw new Error('Название задачи обязательно для заполнения');
    }

    if (request.title.length > 255) {
      throw new Error('Название задачи не может превышать 255 символов');
    }

    if (request.description && request.description.length > 5000) {
      throw new Error('Описание задачи не может превышать 5000 символов');
    }

    if (request.estimatedHours && (request.estimatedHours < 0 || request.estimatedHours > 1000)) {
      throw new Error('Оценка времени должна быть от 0 до 1000 часов');
    }

    if (request.dueDate) {
      const dueDate = new Date(request.dueDate);
      const now = new Date();
      if (dueDate < now) {
        throw new Error('Дата выполнения не может быть в прошлом');
      }
    }

    // Валидация приоритета
    if (!Object.values(TaskPriority).includes(request.priority)) {
      throw new Error('Некорректный приоритет задачи');
    }
  }
}