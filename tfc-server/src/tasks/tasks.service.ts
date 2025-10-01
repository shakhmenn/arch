import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dtos/create-task.dto';
import { UpdateTaskDto } from './dtos/update-task.dto';
import { FilterTasksDto } from './dtos/filter-tasks.dto';
import { UpdateStatusDto } from './dtos/update-status.dto';
import { BulkUpdateStatusDto, BulkAssignDto, BulkDeleteDto, AddDependencyDto } from './dtos/bulk-operations.dto';
import { Role, User, TaskStatus, TaskPriority, AttachmentType } from '@prisma/client';
import { getAttachmentType } from '../common/config/multer.config';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTaskDto, user: User) {
    // проверка прав: если командная - пользователь должен быть в активной команде
    if (dto.type === 'TEAM' && dto.assigneeId) {
      const inTeam = await this.prisma.userTeam.findFirst({
        where: {
          userId: user.id,
          teamId: dto.assigneeId,
          isActive: true,
        },
      });
      if (!inTeam && user.role !== Role.ADMIN) {
        throw new ForbiddenException(
          'Нельзя создать командную задачу для чужой команды',
        );
      }
    }

    // Обработка тегов
    const tagConnections = dto.tags ? await this.processTags(dto.tags) : [];

    // создаём задачу
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        priority: dto.priority || TaskPriority.MEDIUM,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        estimatedHours: dto.estimatedHours,
        creatorId: user.id,
        assigneeId: dto.assigneeId,
        parentTaskId: dto.parentTaskId,
        teamId: dto.type === 'TEAM' ? dto.assigneeId : null,
        tags: {
          create: tagConnections,
        },
      },
      include: {
        tags: { include: { tag: true } },
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    // Создаём запись активности
    await this.createActivity(task.id, user.id, 'created', null, null, `Задача "${task.title}" создана`);

    // Обработка зависимостей
    if (dto.dependsOn && dto.dependsOn.length > 0) {
      await this.createDependencies(task.id, dto.dependsOn);
    }

    return task;
  }

  async findAll(user: User) {
    // личные задачи
    const personal = this.prisma.task.findMany({
      where: { type: 'PERSONAL', creatorId: user.id },
    });

    // командные: где пользователь активный участник или администратор
    const team =
      user.role === 'ADMIN'
        ? this.prisma.task.findMany({ where: { type: 'TEAM' } })
        : this.prisma.task.findMany({
            where: {
              type: 'TEAM',
              team: { members: { some: { userId: user.id, isActive: true } } },
            },
          });

    return Promise.all([personal, team]).then(([a, b]) => [...a, ...b]);
  }

  async updateStatus(id: number, dto: UpdateStatusDto, user: User) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Задача не найдена');

    // проверка прав: создатель, исполнитель или администратор
    if (
      task.creatorId !== user.id &&
      task.assigneeId !== user.id &&
      user.role !== Role.ADMIN
    ) {
      throw new ForbiddenException('Нет прав менять статус этой задачи');
    }

    return this.prisma.task.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async update(id: number, dto: UpdateTaskDto, user: User) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Задача не найдена');

    // проверка прав
    if (
      task.creatorId !== user.id &&
      task.assigneeId !== user.id &&
      user.role !== Role.ADMIN
    ) {
      throw new ForbiddenException('Нет прав редактировать эту задачу');
    }

    const updateData: any = {};
    const changes: string[] = [];

    // Отслеживаем изменения для активности
    if (dto.title && dto.title !== task.title) {
      updateData.title = dto.title;
      changes.push(`название изменено с "${task.title}" на "${dto.title}"`);
    }
    if (dto.description !== undefined && dto.description !== task.description) {
      updateData.description = dto.description;
      changes.push('описание обновлено');
    }
    if (dto.priority && dto.priority !== task.priority) {
      updateData.priority = dto.priority;
      changes.push(`приоритет изменён на ${dto.priority}`);
    }
    if (dto.startDate !== undefined) {
      updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
      changes.push('дата начала обновлена');
    }
    if (dto.dueDate !== undefined) {
      updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
      changes.push('срок выполнения обновлён');
    }
    if (dto.progress !== undefined && dto.progress !== task.progress) {
      updateData.progress = dto.progress;
      changes.push(`прогресс обновлён до ${dto.progress}%`);
    }
    if (dto.estimatedHours !== undefined && dto.estimatedHours !== task.estimatedHours) {
      updateData.estimatedHours = dto.estimatedHours;
      changes.push('оценка времени обновлена');
    }
    if (dto.actualHours !== undefined && dto.actualHours !== task.actualHours) {
      updateData.actualHours = dto.actualHours;
      changes.push('фактическое время обновлено');
    }
    if (dto.assigneeId !== undefined && dto.assigneeId !== task.assigneeId) {
      updateData.assigneeId = dto.assigneeId;
      changes.push('исполнитель изменён');
    }

    // Обновляем теги если переданы
    if (dto.tags) {
      // Удаляем старые связи с тегами
      await this.prisma.taskTag.deleteMany({ where: { taskId: id } });
      // Создаём новые
      const tagConnections = await this.processTags(dto.tags);
      updateData.tags = { create: tagConnections };
      changes.push('теги обновлены');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        tags: { include: { tag: true } },
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    // Создаём запись активности если были изменения
    if (changes.length > 0) {
      await this.createActivity(
        id,
        user.id,
        'updated',
        null,
        null,
        `Задача обновлена: ${changes.join(', ')}`
      );
    }

    return updatedTask;
  }

  async findAllWithFilters(user: User, filters: FilterTasksDto = {}) {
    const where: any = {};

    // Базовые права доступа
    if (user.role === Role.ADMIN) {
      // Администратор видит все задачи
    } else {
      where.OR = [
        { type: 'PERSONAL', creatorId: user.id },
        {
          type: 'TEAM',
          team: { members: { some: { userId: user.id, isActive: true } } },
        },
      ];
    }

    // Применяем фильтры
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }
    if (filters.creatorId) {
      where.creatorId = filters.creatorId;
    }
    if (filters.teamId) {
      where.teamId = filters.teamId;
    }
    if (filters.parentTaskId !== undefined) {
      where.parentTaskId = filters.parentTaskId;
    }
    if (filters.hasSubtasks !== undefined) {
      if (filters.hasSubtasks) {
        where.subtasks = { some: {} };
      } else {
        where.subtasks = { none: {} };
      }
    }
    if (filters.hasDependencies !== undefined) {
      if (filters.hasDependencies) {
        where.dependencies = { some: {} };
      } else {
        where.dependencies = { none: {} };
      }
    }
    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) {
        where.dueDate.gte = new Date(filters.dueDateFrom);
      }
      if (filters.dueDateTo) {
        where.dueDate.lte = new Date(filters.dueDateTo);
      }
    }
    if (filters.createdFrom || filters.createdTo) {
      where.createdAt = {};
      if (filters.createdFrom) {
        where.createdAt.gte = new Date(filters.createdFrom);
      }
      if (filters.createdTo) {
        where.createdAt.lte = new Date(filters.createdTo);
      }
    }
    if (filters.updatedFrom || filters.updatedTo) {
      where.updatedAt = {};
      if (filters.updatedFrom) {
        where.updatedAt.gte = new Date(filters.updatedFrom);
      }
      if (filters.updatedTo) {
        where.updatedAt.lte = new Date(filters.updatedTo);
      }
    }
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: filters.tags },
          },
        },
      };
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Пагинация
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Сортировка
    const orderBy: any = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          tags: { include: { tag: true } },
          creator: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
          attachments: true,
          dependencies: {
            include: {
              blockingTask: { select: { id: true, title: true, status: true } },
            },
          },
          dependents: {
            include: {
              dependentTask: { select: { id: true, title: true, status: true } },
            },
          },
          _count: {
            select: {
              subtasks: true,
              dependencies: true,
              dependents: true,
            },
          },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async processTags(tagNames: string[]) {
    const tagConnections: { tagId: number }[] = [];
    
    for (const tagName of tagNames) {
      // Найти или создать тег
      let tag = await this.prisma.tag.findUnique({
        where: { name: tagName },
      });
      
      if (!tag) {
        tag = await this.prisma.tag.create({
          data: { name: tagName },
        });
      }
      
      tagConnections.push({ tagId: tag.id });
    }
    
    return tagConnections;
  }

  private async createDependencies(taskId: number, dependsOnIds: number[]) {
    const dependencies = dependsOnIds.map(blockingTaskId => ({
      dependentTaskId: taskId,
      blockingTaskId,
    }));
    
    await this.prisma.taskDependency.createMany({
      data: dependencies,
    });
  }

  private async createActivity(
    taskId: number,
    userId: number,
    action: string,
    oldValue: string | null,
    newValue: string | null,
    description: string
  ) {
    await this.prisma.taskActivity.create({
      data: {
        taskId,
        userId,
        action,
        oldValue,
        newValue,
        description,
      },
    });
  }

  async findOne(id: number, user: User) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        attachments: {
          include: {
            uploader: { select: { id: true, name: true } },
          },
        },
        dependencies: {
          include: {
            blockingTask: { select: { id: true, title: true, status: true } },
          },
        },
        dependents: {
          include: {
            dependentTask: { select: { id: true, title: true, status: true } },
          },
        },
        activities: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!task) throw new NotFoundException('Задача не найдена');

    // Проверка прав доступа
    if (user.role !== Role.ADMIN) {
      const hasAccess = 
        task.creatorId === user.id ||
        task.assigneeId === user.id ||
        (task.type === 'TEAM' && task.teamId && await this.prisma.userTeam.findFirst({
          where: {
            userId: user.id,
            teamId: task.teamId,
            isActive: true,
          },
        }));

      if (!hasAccess) {
        throw new ForbiddenException('Нет доступа к этой задаче');
      }
    }

    return task;
  }

  async delete(id: number, user: User) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Задача не найдена');

    // Проверка прав: только создатель или администратор
    if (task.creatorId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Нет прав удалить эту задачу');
    }

    // Удаляем файлы с диска
    const attachments = await this.prisma.taskAttachment.findMany({
      where: { taskId: id },
    });

    for (const attachment of attachments) {
      try {
        await unlink(join(process.cwd(), 'uploads', 'tasks', attachment.filename));
      } catch (error) {
        console.warn(`Не удалось удалить файл ${attachment.filename}:`, error);
      }
    }

    // Удаляем задачу (каскадное удаление удалит связанные записи)
    await this.prisma.task.delete({ where: { id } });

    return { message: 'Задача успешно удалена' };
  }

  async uploadAttachment(taskId: number, file: Express.Multer.File, user: User) {
    // Проверяем существование задачи и права доступа
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Задача не найдена');

    // Проверка прав
    if (
      task.creatorId !== user.id &&
      task.assigneeId !== user.id &&
      user.role !== Role.ADMIN
    ) {
      throw new ForbiddenException('Нет прав добавлять файлы к этой задаче');
    }

    // Создаем запись о вложении
    const attachment = await this.prisma.taskAttachment.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/tasks/${file.filename}`,
        type: getAttachmentType(file.mimetype),
        taskId,
        uploadedBy: user.id,
      },
      include: {
        uploader: { select: { id: true, name: true } },
      },
    });

    // Создаем запись активности
    await this.createActivity(
      taskId,
      user.id,
      'attachment_added',
      null,
      file.originalname,
      `Добавлен файл "${file.originalname}"`
    );

    return attachment;
  }

  async uploadMultipleAttachments(taskId: number, files: Express.Multer.File[], user: User) {
    // Проверяем существование задачи и права доступа
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Задача не найдена');

    // Проверка прав
    if (
      task.creatorId !== user.id &&
      task.assigneeId !== user.id &&
      user.role !== Role.ADMIN
    ) {
      throw new ForbiddenException('Нет прав добавлять файлы к этой задаче');
    }

    const attachments: any[] = [];
    const fileNames: string[] = [];

    for (const file of files) {
      const attachment = await this.prisma.taskAttachment.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: `/uploads/tasks/${file.filename}`,
          type: getAttachmentType(file.mimetype),
          taskId,
          uploadedBy: user.id,
        },
        include: {
          uploader: { select: { id: true, name: true } },
        },
      });
      
      attachments.push(attachment);
      fileNames.push(file.originalname);
    }

    // Создаем запись активности
    await this.createActivity(
      taskId,
      user.id,
      'attachments_added',
      null,
      fileNames.join(', '),
      `Добавлено файлов: ${fileNames.length} (${fileNames.join(', ')})`
    );

    return attachments;
  }

  async deleteAttachment(taskId: number, attachmentId: number, user: User) {
    // Проверяем существование задачи
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Задача не найдена');

    // Проверяем существование вложения
    const attachment = await this.prisma.taskAttachment.findUnique({
      where: { id: attachmentId },
    });
    if (!attachment || attachment.taskId !== taskId) {
      throw new NotFoundException('Вложение не найдено');
    }

    // Проверка прав: создатель задачи, загрузивший файл или администратор
    if (
      task.creatorId !== user.id &&
      attachment.uploadedBy !== user.id &&
      user.role !== Role.ADMIN
    ) {
      throw new ForbiddenException('Нет прав удалить это вложение');
    }

    // Удаляем файл с диска
    try {
      await unlink(join(process.cwd(), 'uploads', 'tasks', attachment.filename));
    } catch (error) {
      console.warn(`Не удалось удалить файл ${attachment.filename}:`, error);
    }

    // Удаляем запись из БД
    await this.prisma.taskAttachment.delete({ where: { id: attachmentId } });

    // Создаем запись активности
    await this.createActivity(
      taskId,
      user.id,
      'attachment_deleted',
      attachment.originalName,
      null,
      `Удален файл "${attachment.originalName}"`
    );

    return { message: 'Вложение успешно удалено' };
  }

  async getActivity(taskId: number, user: User) {
    // Проверяем существование задачи и права доступа
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Задача не найдена');

    // Проверка прав доступа
    if (user.role !== Role.ADMIN) {
      const hasAccess = 
        task.creatorId === user.id ||
        task.assigneeId === user.id ||
        (task.type === 'TEAM' && task.teamId && await this.prisma.userTeam.findFirst({
          where: {
            userId: user.id,
            teamId: task.teamId,
            isActive: true,
          },
        }));

      if (!hasAccess) {
        throw new ForbiddenException('Нет доступа к истории этой задачи');
      }
    }

    return this.prisma.taskActivity.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Новые методы согласно технической архитектуре

  async bulkUpdateStatus(taskIds: number[], status: TaskStatus, user: any) {
    // Проверяем права доступа для каждой задачи
    const tasks = await this.prisma.task.findMany({
      where: { id: { in: taskIds } },
      include: { creator: true, assignee: true, team: { include: { members: true } } }
    });

    for (const task of tasks) {
      const hasAccess = user.role === Role.ADMIN || 
                       task.creatorId === user.id || 
                       task.assigneeId === user.id ||
                       (task.team && task.team.members.some(member => member.userId === user.id));
      
      if (!hasAccess) {
        throw new ForbiddenException(`No access to task ${task.id}`);
      }
    }

    // Обновляем статус всех задач
    const updatedTasks = await this.prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: { status, updatedAt: new Date() }
    });

    // Создаем записи активности для каждой задачи
    const activities = taskIds.map(taskId => ({
      taskId,
      userId: user.id,
      action: 'STATUS_CHANGED',
      details: `Status changed to ${status}`,
      createdAt: new Date()
    }));

    await this.prisma.taskActivity.createMany({ data: activities });

    return { updated: updatedTasks.count };
  }

  async bulkAssign(taskIds: number[], assigneeId: number, user: any) {
    // Проверяем права доступа (только ADMIN и TEAM_LEADER)
    if (user.role !== Role.ADMIN && user.role !== Role.TEAM_LEADER) {
      throw new ForbiddenException('Insufficient permissions for bulk assign');
    }

    // Проверяем существование assignee
    const assignee = await this.prisma.user.findUnique({ where: { id: assigneeId } });
    if (!assignee) {
      throw new NotFoundException('Assignee not found');
    }

    // Обновляем назначение всех задач
    const updatedTasks = await this.prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: { assigneeId, updatedAt: new Date() }
    });

    // Создаем записи активности
    const activities = taskIds.map(taskId => ({
      taskId,
      userId: user.id,
      action: 'ASSIGNED',
      details: `Assigned to ${assignee.name}`,
      createdAt: new Date()
    }));

    await this.prisma.taskActivity.createMany({ data: activities });

    return { updated: updatedTasks.count };
  }

  async bulkDelete(taskIds: number[], user: any) {
    // Проверяем права доступа (только ADMIN и TEAM_LEADER)
    if (user.role !== Role.ADMIN && user.role !== Role.TEAM_LEADER) {
      throw new ForbiddenException('Insufficient permissions for bulk delete');
    }

    // Получаем задачи с вложенными файлами
    const tasks = await this.prisma.task.findMany({
      where: { id: { in: taskIds } },
      include: { attachments: true }
    });

    // Удаляем файлы
    for (const task of tasks) {
      for (const attachment of task.attachments) {
        try {
          await unlink(join(process.cwd(), 'uploads', 'tasks', attachment.filename));
        } catch (error) {
          console.error(`Failed to delete file ${attachment.filename}:`, error);
        }
      }
    }

    // Удаляем задачи (каскадное удаление через Prisma)
    const deletedTasks = await this.prisma.task.deleteMany({
      where: { id: { in: taskIds } }
    });

    return { deleted: deletedTasks.count };
  }

  async getSubtasks(parentTaskId: number, user: any) {
    // Проверяем доступ к родительской задаче
    const parentTask = await this.findOne(parentTaskId, user);
    
    return this.prisma.task.findMany({
      where: { parentTaskId },
      include: {
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
        _count: {
          select: {
            subtasks: true,
            dependencies: true,
            dependents: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getDependencies(taskId: number, user: any) {
    // Проверяем доступ к задаче
    await this.findOne(taskId, user);
    
    const dependencies = await this.prisma.taskDependency.findMany({
      where: { dependentTaskId: taskId },
      include: {
        blockingTask: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true
          }
        }
      }
    });

    return dependencies.map(dep => dep.blockingTask);
  }

  async addDependency(taskId: number, blockingTaskId: number, user: any) {
    // Проверяем доступ к обеим задачам
    await this.findOne(taskId, user);
    await this.findOne(blockingTaskId, user);

    // Проверяем, что задача не зависит сама от себя
    if (taskId === blockingTaskId) {
      throw new BadRequestException('Task cannot depend on itself');
    }

    // Проверяем, что зависимость не существует
    const existingDependency = await this.prisma.taskDependency.findFirst({
      where: {
        dependentTaskId: taskId,
        blockingTaskId: blockingTaskId
      }
    });

    if (existingDependency) {
      throw new BadRequestException('Dependency already exists');
    }

    // Создаем зависимость
    const dependency = await this.prisma.taskDependency.create({
      data: { dependentTaskId: taskId, blockingTaskId },
      include: {
        blockingTask: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true
          }
        }
      }
    });

    // Создаем запись активности
    await this.createActivity(taskId, user.id, 'DEPENDENCY_ADDED', null, null,
      `Added dependency on task: ${dependency.blockingTask.title}`);

    return dependency.blockingTask;
  }

  async removeDependency(taskId: number, blockingTaskId: number, user: any) {
    // Проверяем доступ к задаче
    await this.findOne(taskId, user);

    // Находим зависимость
    const dependency = await this.prisma.taskDependency.findFirst({
      where: {
        dependentTaskId: taskId,
        blockingTaskId: blockingTaskId
      },
      include: {
        blockingTask: { select: { title: true } }
      }
    });

    if (!dependency) {
      throw new NotFoundException('Dependency not found');
    }

    // Удаляем зависимость
    await this.prisma.taskDependency.delete({
      where: { id: dependency.id }
    });

    // Создаем запись активности
    await this.createActivity(taskId, user.id, 'DEPENDENCY_REMOVED', null, null,
      `Removed dependency on task: ${dependency.blockingTask.title}`);

    return { success: true };
  }
}
