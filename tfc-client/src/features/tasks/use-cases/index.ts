// Use Cases для работы с задачами
export { CreateTaskUseCase } from './create-task';
export { UpdateTaskUseCase } from './update-task';
export { GetTasksUseCase } from './get-tasks';
export { BulkUpdateTasksUseCase } from './bulk-update-tasks';

// Репозиторий
export { TasksRepository, HttpTasksRepository, tasksRepository } from '../api/tasks-repository';

// Фабрика для создания use-cases с внедрением зависимостей
import { CreateTaskUseCase } from './create-task';
import { UpdateTaskUseCase } from './update-task';
import { GetTasksUseCase } from './get-tasks';
import { BulkUpdateTasksUseCase } from './bulk-update-tasks';
import { tasksRepository } from '../api/tasks-repository';

/**
 * Фабрика use-cases с настроенными зависимостями
 */
export class TaskUseCasesFactory {
  private static instance: TaskUseCasesFactory;
  
  private constructor() {}
  
  static getInstance(): TaskUseCasesFactory {
    if (!TaskUseCasesFactory.instance) {
      TaskUseCasesFactory.instance = new TaskUseCasesFactory();
    }
    return TaskUseCasesFactory.instance;
  }

  createTaskUseCase(): CreateTaskUseCase {
    return new CreateTaskUseCase(tasksRepository);
  }

  updateTaskUseCase(): UpdateTaskUseCase {
    return new UpdateTaskUseCase(tasksRepository);
  }

  getTasksUseCase(): GetTasksUseCase {
    return new GetTasksUseCase(tasksRepository);
  }

  bulkUpdateTasksUseCase(): BulkUpdateTasksUseCase {
    return new BulkUpdateTasksUseCase(tasksRepository);
  }
}

// Экспорт готовых экземпляров use-cases
const factory = TaskUseCasesFactory.getInstance();

export const createTaskUseCase = factory.createTaskUseCase();
export const updateTaskUseCase = factory.updateTaskUseCase();
export const getTasksUseCase = factory.getTasksUseCase();
export const bulkUpdateTasksUseCase = factory.bulkUpdateTasksUseCase();