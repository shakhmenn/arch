import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { Role, User } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  // Создать комментарий
  async create(dto: CreateCommentDto, user: User) {
    // проверяем, что задача существует
    const task = await this.prisma.task.findUnique({
      where: { id: dto.taskId },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },

        creator: true,
        assignee: true,
      },
    });
    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }

    // проверяем права доступа с учетом новых ролей
    const canComment = await this.canAccessTask(task, user);
    if (!canComment) {
      throw new ForbiddenException('Нет доступа к комментированию этой задачи');
    }

    // создаем комментарий
    return this.prisma.comment.create({
      data: {
        taskId: dto.taskId,
        authorId: user.id,
        body: dto.body,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  // получить комментарии задачи
  async findByTask(taskId: number, user: User) {
    // проверяем доступ к задаче
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },

        creator: true,
        assignee: true,
      },
    });
    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }

    const canView = await this.canAccessTask(task, user);
    if (!canView) {
      throw new ForbiddenException('Нет доступа к этой задаче');
    }

    return this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { 
          select: { 
            id: true, 
            name: true
          } 
        },
      },
    });
  }

  // Проверка доступа к задаче с учетом новой архитектуры
  private async canAccessTask(task: any, user: User): Promise<boolean> {
    // Администраторы имеют полный доступ
    if (user.role === Role.ADMIN) {
      return true;
    }

    // Создатель задачи
    if (task.creatorId === user.id) {
      return true;
    }

    // Исполнитель задачи
    if (task.assigneeId === user.id) {
      return true;
    }

    // Участник команды задачи
    if (task.teamId) {
      const isTeamMember = task.team?.members?.some(
        (member: any) => member.userId === user.id
      );
      if (isTeamMember) {
        return true;
      }
    }

    // Участник команды проекта - убираем эту проверку так как нет project include

    // Лидеры команд имеют доступ к задачам своих команд
    if (user.role === Role.TEAM_LEADER) {
      // Проверяем, является ли пользователь лидером команды задачи
      if (task.teamId) {
        const teamLeadership = await this.prisma.userTeam.findFirst({
          where: {
            userId: user.id,
            teamId: task.teamId,
          },
        });
        if (teamLeadership) {
          return true;
        }
      }

      // Проверка лидерства команды проекта убрана так как нет project include
    }

    return false;
  }

  // Удалить комментарий
  async delete(commentId: number, user: User) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: true,
        task: {
          include: {
            team: {
              include: {
                members: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            creator: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    // Проверяем права: автор комментария, администратор или лидер команды
    const canDelete =
      comment.authorId === user.id ||
      user.role === Role.ADMIN ||
      (user.role === Role.TEAM_LEADER &&
        comment.task.teamId &&
        !!(await this.prisma.userTeam.findFirst({
          where: {
            userId: user.id,
            teamId: comment.task.teamId,
          },
        })));

    if (!canDelete) {
      throw new ForbiddenException('Нет прав для удаления этого комментария');
    }

    return this.prisma.comment.delete({
      where: { id: commentId },
    });
  }

  // Обновить комментарий
  async update(commentId: number, body: string, user: User) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    // Только автор может редактировать свой комментарий
    if (comment.authorId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Нет прав для редактирования этого комментария');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { body },
      include: {
        author: { 
          select: { 
            id: true, 
            name: true
          } 
        },
      },
    });
  }
}
