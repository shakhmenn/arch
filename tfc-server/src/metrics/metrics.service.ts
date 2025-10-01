import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMetricValueDto,
  CreateBusinessContextDto,
} from './dto/create-metric.dto';
import {
  UpdateMetricValueDto,
  UpdateBusinessContextDto,
} from './dto/update-metric.dto';
import { MetricCategory, MetricPeriodType, TaskStatus, TaskPriority, Role } from '@prisma/client';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  // === METRIC DEFINITIONS ===
  async getMetricDefinitions() {
    return this.prisma.metricDefinition.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async getMetricDefinitionsByCategory(category: MetricCategory) {
    return this.prisma.metricDefinition.findMany({
      where: { category, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  // === METRIC VALUES ===
  async createMetricValue(
    userId: number,
    createMetricValueDto: CreateMetricValueDto,
  ) {
    return this.prisma.metricValue.create({
      data: {
        ...createMetricValueDto,
        periodDate: new Date(createMetricValueDto.periodDate),
        userId,
      },
      include: {
        metricDefinition: true,
        user: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async getMetricValues(
    userId: number,
    filters?: {
      category?: MetricCategory;
      periodType?: MetricPeriodType;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const where: any = { userId };

    if (filters?.category) {
      where.metricDefinition = { category: filters.category };
    }

    if (filters?.periodType) {
      where.periodType = filters.periodType;
    }

    if (filters?.startDate || filters?.endDate) {
      where.periodDate = {};
      if (filters.startDate) {
        where.periodDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.periodDate.lte = new Date(filters.endDate);
      }
    }

    return this.prisma.metricValue.findMany({
      where,
      include: {
        metricDefinition: true,
      },
      orderBy: { periodDate: 'desc' },
    });
  }

  async getMetricValue(id: number, userId: number) {
    const metricValue = await this.prisma.metricValue.findFirst({
      where: { id, userId },
      include: {
        metricDefinition: true,
        history: {
          orderBy: { changedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!metricValue) {
      throw new NotFoundException('Metric value not found');
    }

    return metricValue;
  }

  async updateMetricValue(
    id: number,
    userId: number,
    updateDto: UpdateMetricValueDto,
  ) {
    const existingMetric = await this.prisma.metricValue.findFirst({
      where: { id, userId },
    });

    if (!existingMetric) {
      throw new NotFoundException('Metric value not found');
    }

    const updateData: any = { ...updateDto };
    delete updateData.changeType;
    delete updateData.changeReason;
    delete updateData.effectiveDate;

    if (updateDto.periodDate) {
      updateData.periodDate = new Date(updateDto.periodDate);
    }

    // Для UPDATE - используем effectiveDate если указана
    if (updateDto.changeType === 'UPDATE' && updateDto.effectiveDate) {
      updateData.periodDate = new Date(updateDto.effectiveDate);
    }

    // Для CORRECTION - просто обновляем запись без истории
    if (updateDto.changeType === 'CORRECTION') {
      return this.prisma.metricValue.update({
        where: { id },
        data: updateData,
        include: {
          metricDefinition: true,
          history: {
            orderBy: { changedAt: 'desc' },
            take: 5,
          },
        },
      });
    }

    // Для UPDATE - создаем запись в истории изменений
    const historyData = {
      userId,
      metricValueId: id,
      oldValue: existingMetric.value,
      newValue: updateDto.value,
      oldTarget: existingMetric.targetValue,
      newTarget: updateDto.targetValue,
      changeType: updateDto.changeType,
      changeReason: updateDto.changeReason,
    };

    // Обновляем метрику и создаем историю в транзакции
    return this.prisma.$transaction(async (tx) => {
      // Создаем запись в истории
      await tx.metricHistory.create({ data: historyData });

      // Обновляем метрику
      return tx.metricValue.update({
        where: { id },
        data: updateData,
        include: {
          metricDefinition: true,
          history: {
            orderBy: { changedAt: 'desc' },
            take: 5,
          },
        },
      });
    });
  }

  async deleteMetricValue(id: number, userId: number) {
    const metricValue = await this.prisma.metricValue.findFirst({
      where: { id, userId },
    });

    if (!metricValue) {
      throw new NotFoundException('Metric value not found');
    }

    return this.prisma.metricValue.delete({
      where: { id },
    });
  }

  // === BUSINESS CONTEXT ===
  async createBusinessContext(
    userId: number,
    createDto: CreateBusinessContextDto,
  ) {
    return this.prisma.businessContext.create({
      data: {
        ...createDto,
        dataRelevanceDate: new Date(createDto.dataRelevanceDate),
        userId,
      },
    });
  }

  async getBusinessContext(userId: number) {
    return this.prisma.businessContext.findUnique({
      where: { userId },
    });
  }

  async updateBusinessContext(
    userId: number,
    updateDto: UpdateBusinessContextDto,
  ) {
    const updateData: any = { ...updateDto };
    if (updateDto.dataRelevanceDate) {
      updateData.dataRelevanceDate = new Date(updateDto.dataRelevanceDate);
    }

    return this.prisma.businessContext.upsert({
      where: { userId },
      update: updateData,
      create: {
        ...updateData,
        userId,
      },
    });
  }

  // === TASK METRICS ===
  async getTaskMetrics(userId: number, teamId?: number, projectId?: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        teams: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Определяем фильтры для задач в зависимости от роли и параметров
    let taskFilters: any = {};

    if (user.role === Role.ADMIN) {
      // Администраторы видят все задачи
      if (teamId) taskFilters.teamId = teamId;
      if (projectId) taskFilters.projectId = projectId;
    } else if (user.role === Role.TEAM_LEADER) {
      // Лидеры команд видят задачи своих команд
      const leaderTeams = user.teams
        .map(ut => ut.teamId);
      
      if (teamId && leaderTeams.includes(teamId)) {
        taskFilters.teamId = teamId;
      } else {
        taskFilters.OR = [
          { teamId: { in: leaderTeams } },
          { creatorId: userId },
          { assigneeId: userId },
        ];
      }
      
      if (projectId) taskFilters.projectId = projectId;
    } else {
      // Обычные пользователи видят только свои задачи и задачи своих команд
      const userTeams = user.teams.map(ut => ut.teamId);
      taskFilters.OR = [
        { creatorId: userId },
        { assigneeId: userId },
        { teamId: { in: userTeams } },
      ];
      
      if (teamId && userTeams.includes(teamId)) {
        taskFilters = { teamId };
      }
      if (projectId) taskFilters.projectId = projectId;
    }

    const [tasks, completedTasks, overdueTasks] = await Promise.all([
      this.prisma.task.findMany({
        where: taskFilters,
        include: {
          subtasks: true,
          dependencies: true,
          dependents: true,
          _count: {
            select: {
              subtasks: true,
              dependencies: true,
              dependents: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.task.findMany({
        where: {
          ...taskFilters,
          status: TaskStatus.DONE,
          completedAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
      }),
      this.prisma.task.findMany({
        where: {
          ...taskFilters,
          status: { not: TaskStatus.DONE },
          dueDate: {
            lt: new Date(),
          },
        },
      }),
    ]);

    // Базовые метрики
    const totalTasks = tasks.length;
    const completedTasksCount = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const blockedTasks = tasks.filter(t => t.status === TaskStatus.CANCELLED).length;
    const reviewTasks = tasks.filter(t => t.status === TaskStatus.IN_REVIEW).length;
    
    // Метрики по приоритетам
    const highPriorityTasks = tasks.filter(t => t.priority === TaskPriority.HIGH).length;
    const mediumPriorityTasks = tasks.filter(t => t.priority === TaskPriority.MEDIUM).length;
    const lowPriorityTasks = tasks.filter(t => t.priority === TaskPriority.LOW).length;
    
    // Метрики по иерархии
    const rootTasks = tasks.filter(t => !t.parentTaskId).length;
    const subtasksCount = tasks.filter(t => t.parentTaskId).length;
    const tasksWithSubtasks = tasks.filter(t => t._count.subtasks > 0).length;
    
    // Метрики по зависимостям
    const tasksWithDependencies = tasks.filter(t => t._count.dependencies > 0).length;
    const tasksWithDependents = tasks.filter(t => t._count.dependents > 0).length;
    
    // Временные метрики
    const overdueTasksCount = overdueTasks.length;
    const completedThisMonth = completedTasks.length;
    
    // Средние значения
    const avgEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0) / totalTasks || 0;
    const avgActualHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0) / totalTasks || 0;
    
    // Процентные показатели
    const completionRate = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0;
    const overdueRate = totalTasks > 0 ? (overdueTasksCount / totalTasks) * 100 : 0;
    const blockedRate = totalTasks > 0 ? (blockedTasks / totalTasks) * 100 : 0;
    
    return {
      totalTasks,
      completedTasksCount,
      inProgressTasks,
      blockedTasks,
      reviewTasks,
      highPriorityTasks,
      mediumPriorityTasks,
      lowPriorityTasks,
      rootTasks,
      subtasksCount,
      tasksWithSubtasks,
      tasksWithDependencies,
      tasksWithDependents,
      overdueTasksCount,
      completedThisMonth,
      avgEstimatedHours: Math.round(avgEstimatedHours * 100) / 100,
      avgActualHours: Math.round(avgActualHours * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      overdueRate: Math.round(overdueRate * 100) / 100,
      blockedRate: Math.round(blockedRate * 100) / 100,
    };
  }

  async getTeamTaskMetrics(teamId: number, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        teams: {
          where: { teamId },
          include: { team: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверяем доступ к команде
    const teamMembership = user.teams.find(ut => ut.teamId === teamId);
    const hasAccess = user.role === Role.ADMIN || 
                     teamMembership || 
                     user.role === Role.TEAM_LEADER;

    if (!hasAccess) {
      throw new NotFoundException('Нет доступа к метрикам этой команды');
    }

    const teamTasks = await this.prisma.task.findMany({
      where: { teamId },
      include: {
        assignee: {
          select: { id: true, name: true },
        },
        creator: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            subtasks: true,
            dependencies: true,
            comments: true,
          },
        },
      },
    });

    // Метрики по участникам команды
    const memberMetrics = teamTasks.reduce((acc, task) => {
      if (task.assigneeId) {
        if (!acc[task.assigneeId]) {
          acc[task.assigneeId] = {
            userId: task.assigneeId,
            userName: task.assignee?.name || 'Unknown',
            totalTasks: 0,
            completedTasks: 0,
            inProgressTasks: 0,
            overdueTasksCount: 0,
            avgEstimatedHours: 0,
            avgActualHours: 0,
          };
        }
        
        acc[task.assigneeId].totalTasks++;
        if (task.status === TaskStatus.DONE) {
          acc[task.assigneeId].completedTasks++;
        }
        if (task.status === TaskStatus.IN_PROGRESS) {
          acc[task.assigneeId].inProgressTasks++;
        }
        if (task.dueDate && task.dueDate < new Date() && task.status !== TaskStatus.DONE) {
          acc[task.assigneeId].overdueTasksCount++;
        }
        
        acc[task.assigneeId].avgEstimatedHours += task.estimatedHours || 0;
        acc[task.assigneeId].avgActualHours += task.actualHours || 0;
      }
      return acc;
    }, {} as Record<number, any>);

    // Вычисляем средние значения
    Object.values(memberMetrics).forEach((member: any) => {
      if (member.totalTasks > 0) {
        member.avgEstimatedHours = Math.round((member.avgEstimatedHours / member.totalTasks) * 100) / 100;
        member.avgActualHours = Math.round((member.avgActualHours / member.totalTasks) * 100) / 100;
        member.completionRate = Math.round((member.completedTasks / member.totalTasks) * 100 * 100) / 100;
      }
    });

    return {
      teamId,
      totalTasks: teamTasks.length,
      memberMetrics: Object.values(memberMetrics),
      tasksByStatus: {
        TODO: teamTasks.filter(t => t.status === TaskStatus.TODO).length,
        IN_PROGRESS: teamTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
        IN_REVIEW: teamTasks.filter(t => t.status === TaskStatus.IN_REVIEW).length,
        DONE: teamTasks.filter(t => t.status === TaskStatus.DONE).length,
        CANCELLED: teamTasks.filter(t => t.status === TaskStatus.CANCELLED).length,
      },
      tasksByPriority: {
        HIGH: teamTasks.filter(t => t.priority === TaskPriority.HIGH).length,
        MEDIUM: teamTasks.filter(t => t.priority === TaskPriority.MEDIUM).length,
        LOW: teamTasks.filter(t => t.priority === TaskPriority.LOW).length,
      },
    };
  }

  async getProjectTaskMetrics(projectId: number, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверяем доступ к задачам проекта через команды
    const userTeams = await this.prisma.userTeam.findMany({
      where: { userId },
      include: { team: true },
    });

    const hasAccess = user.role === Role.ADMIN || userTeams.length > 0;

    if (!hasAccess) {
      throw new NotFoundException('Нет доступа к метрикам этого проекта');
    }

    return this.getTaskMetrics(userId, undefined, projectId);
  }

  // === DASHBOARD & ANALYTICS ===
  async getDashboardData(userId: number) {
    const [metricValues, businessContext, recentHistory, taskMetrics] = await Promise.all([
      this.prisma.metricValue.findMany({
        where: { userId },
        include: { metricDefinition: true },
        orderBy: { periodDate: 'desc' },
        take: 50,
      }),
      this.prisma.businessContext.findUnique({
        where: { userId },
      }),
      this.prisma.metricHistory.findMany({
        where: { userId },
        include: {
          metricValue: {
            include: { metricDefinition: true },
          },
        },
        orderBy: { changedAt: 'desc' },
        take: 10,
      }),
      this.getTaskMetrics(userId),
    ]);

    // Группируем метрики по категориям
    const metricsByCategory = metricValues.reduce(
      (acc, metric) => {
        const category = metric.metricDefinition.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(metric);
        return acc;
      },
      {} as Record<MetricCategory, any[]>,
    );

    // Анализ план vs факт по категориям
    const categoryAnalysis = Object.entries(metricsByCategory).map(
      ([category, metrics]) => {
        const totalPlanned = metrics.reduce(
          (sum, m) => sum + (m.targetValue || 0),
          0,
        );
        const totalActual = metrics.reduce((sum, m) => sum + (m.value || 0), 0);

        // Расчет variance с учетом направления метрик в категории
        let variance = 0;
        if (totalPlanned > 0) {
          const baseVariance =
            ((totalActual - totalPlanned) / totalPlanned) * 100;
          // Для категорий используем базовый расчет, так как в одной категории могут быть метрики с разными направлениями
          variance = baseVariance;
        }

        return {
          category,
          totalPlanned,
          totalActual,
          variance,
          metricsCount: metrics.length,
        };
      },
    );

    // Последние метрики для быстрого обзора
    const recentMetrics = metricValues.slice(0, 10).map((metric) => {
      let variance: number | null = null;
      if (metric.targetValue && metric.value) {
        const baseVariance =
          ((Number(metric.value) - Number(metric.targetValue)) /
            Number(metric.targetValue)) *
          100;
        // Инвертируем variance для метрик где "ниже лучше"
        variance =
          metric.metricDefinition.direction === 'LOWER_IS_BETTER'
            ? -baseVariance
            : baseVariance;
      }

      return {
        id: metric.id,
        name: metric.metricDefinition.name,
        category: metric.metricDefinition.category,
        value: metric.value,
        targetValue: metric.targetValue,
        unit: metric.metricDefinition.unit,
        direction: metric.metricDefinition.direction,
        periodDate: metric.periodDate,
        variance,
      };
    });

    return {
      businessContext,
      metricsByCategory,
      categoryAnalysis,
      recentMetrics,
      taskMetrics,
      recentHistory: recentHistory.map((h) => ({
        id: h.id,
        metricName: h.metricValue.metricDefinition.name,
        oldValue: h.oldValue,
        newValue: h.newValue,
        changeType: h.changeType,
        changeReason: h.changeReason,
        changedAt: h.changedAt,
      })),
    };
  }
}
