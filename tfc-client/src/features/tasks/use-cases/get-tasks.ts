import { Task, TaskFilters, TaskSortOptions, GetTasksResponse } from '@/entities/task';
import { TasksRepository } from '../api/tasks-repository';

/**
 * Use case для получения списка задач
 * Поддерживает фильтрацию, сортировку и пагинацию
 */
export class GetTasksUseCase {
  constructor(private tasksRepository: TasksRepository) {}

  async execute(
    filters: TaskFilters = {},
    sort: TaskSortOptions = { field: 'createdAt', direction: 'desc' },
    page: number = 1,
    limit: number = 50
  ): Promise<GetTasksResponse> {
    // Валидация параметров
    this.validateParameters(filters, sort, page, limit);

    // Нормализация фильтров
    const normalizedFilters = this.normalizeFilters(filters);

    // Получение задач с учетом фильтров и сортировки
    const result = await this.tasksRepository.getTasks({
      filters: normalizedFilters,
      sort,
      page,
      limit
    });

    // Обогащение данных
    const enrichedTasks = await this.enrichTasksData(result.tasks);

    return {
      tasks: enrichedTasks,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
      hasNext: page * limit < result.total,
      hasPrev: page > 1
    };
  }

  /**
   * Получение задач для виртуализированной таблицы
   * Оптимизировано для быстрой загрузки больших списков
   */
  async getTasksForVirtualTable(
    startIndex: number,
    endIndex: number,
    filters: TaskFilters = {},
    sort: TaskSortOptions = { field: 'createdAt', direction: 'desc' }
  ): Promise<{ tasks: Task[]; total: number }> {
    const limit = endIndex - startIndex + 1;
    const page = Math.floor(startIndex / limit) + 1;

    const result = await this.tasksRepository.getTasks({
      filters: this.normalizeFilters(filters),
      sort,
      page,
      limit,
      minimal: true // Получаем минимальный набор полей для производительности
    });

    return {
      tasks: result.tasks,
      total: result.total
    };
  }

  /**
   * Поиск задач по тексту
   */
  async searchTasks(
    query: string,
    filters: TaskFilters = {},
    limit: number = 20
  ): Promise<Task[]> {
    if (!query.trim()) {
      return [];
    }

    // Валидация поискового запроса
    if (query.length < 2) {
      throw new Error('Поисковый запрос должен содержать минимум 2 символа');
    }

    if (query.length > 100) {
      throw new Error('Поисковый запрос не может превышать 100 символов');
    }

    const searchFilters = {
      ...this.normalizeFilters(filters),
      search: query.trim()
    };

    const result = await this.tasksRepository.searchTasks(searchFilters, limit);
    return result.tasks;
  }

  /**
   * Получение задач пользователя (назначенные или созданные)
   */
  async getUserTasks(
    userId: number,
    includeCreated: boolean = true,
    includeAssigned: boolean = true,
    filters: TaskFilters = {}
  ): Promise<Task[]> {
    const userFilters: TaskFilters = {
      ...this.normalizeFilters(filters)
    };

    if (includeCreated && includeAssigned) {
      userFilters.userRelation = 'all';
      userFilters.userId = userId;
    } else if (includeCreated) {
      userFilters.createdById = userId;
    } else if (includeAssigned) {
      userFilters.assigneeId = userId;
    } else {
      return [];
    }

    const result = await this.tasksRepository.getTasks({
      filters: userFilters,
      sort: { field: 'updatedAt', direction: 'desc' },
      page: 1,
      limit: 1000 // Для пользовательских задач лимит больше
    });

    return result.tasks;
  }

  private validateParameters(
    filters: TaskFilters,
    sort: TaskSortOptions,
    page: number,
    limit: number
  ): void {
    if (page < 1) {
      throw new Error('Номер страницы должен быть больше 0');
    }

    if (limit < 1 || limit > 100) {
      throw new Error('Лимит должен быть от 1 до 100');
    }

    const validSortFields = [
      'id', 'title', 'status', 'priority', 'createdAt', 
      'updatedAt', 'dueDate', 'progress', 'assigneeId'
    ];

    if (!validSortFields.includes(sort.field)) {
      throw new Error(`Недопустимое поле для сортировки: ${sort.field}`);
    }

    if (!['asc', 'desc'].includes(sort.direction)) {
      throw new Error('Направление сортировки должно быть "asc" или "desc"');
    }
  }

  private normalizeFilters(filters: TaskFilters): TaskFilters {
    const normalized: TaskFilters = { ...filters };

    // Нормализация массивов
    if (normalized.statuses && normalized.statuses.length === 0) {
      delete normalized.statuses;
    }

    if (normalized.priorities && normalized.priorities.length === 0) {
      delete normalized.priorities;
    }

    if (normalized.tags && normalized.tags.length === 0) {
      delete normalized.tags;
    }

    if (normalized.projectIds && normalized.projectIds.length === 0) {
      delete normalized.projectIds;
    }

    // Нормализация дат
    if (normalized.dueDateFrom) {
      normalized.dueDateFrom = new Date(normalized.dueDateFrom).toISOString();
    }

    if (normalized.dueDateTo) {
      normalized.dueDateTo = new Date(normalized.dueDateTo).toISOString();
    }

    if (normalized.createdAfter) {
      normalized.createdAfter = new Date(normalized.createdAfter).toISOString();
    }

    if (normalized.createdBefore) {
      normalized.createdBefore = new Date(normalized.createdBefore).toISOString();
    }

    return normalized;
  }

  private async enrichTasksData(tasks: Task[]): Promise<Task[]> {
    // Здесь можно добавить логику обогащения данных:
    // - Загрузка связанных пользователей
    // - Подсчет комментариев
    // - Загрузка превью вложений
    // - Вычисление дополнительных метрик

    return tasks.map(task => ({
      ...task,
      // Добавляем вычисляемые поля
      isOverdue: task.dueDate ? new Date(task.dueDate) < new Date() && task.status !== 'DONE' : false,
      timeSpent: task.actualHours || 0,
      timeRemaining: task.estimatedHours ? Math.max(0, task.estimatedHours - (task.actualHours || 0)) : undefined
    }));
  }
}