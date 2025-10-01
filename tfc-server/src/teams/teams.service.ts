import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dtos/create-team.dto';
import { UpdateTeamDto } from './dtos/update-team.dto';
import { Role } from '@prisma/client';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTeamDto) {
    const { name, description } = dto;
    return this.prisma.team.create({
      data: {
        name,
        description,
      },
    });
  }

  async findAll(user: { id: number; role: Role }) {
    if (user.role === Role.ADMIN) {
      return this.prisma.team.findMany();
    }

    // предприниматель видит только свою активную команду
    const membership = await this.prisma.userTeam.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: { team: true },
    });

    return membership ? [membership.team] : [];
  }

  async findOneWithUsersAndTasks(
    teamId: number,
    user: { id: number; role: Role },
  ): Promise<unknown> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                name: true,
                role: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    if (user.role !== Role.ADMIN) {
      const isMember = team.members.some(
        (m) => m.userId === user.id && m.isActive,
      );
      if (!isMember) {
        throw new ForbiddenException('Нет доступа к этой команде');
      }
    }

    const memberIds = team.members.map((m) => m.userId);

    const tasks = await this.prisma.task.findMany({
      where: {
        OR: [
          { teamId: teamId },
          { creatorId: { in: memberIds } },
          { assigneeId: { in: memberIds } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const users = team.members.map((m) => m.user);

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      createdAt: team.createdAt,
      users,
      tasks,
    };
  }

  async assignUser(teamId: number, userId: number) {
    // Проверяем существование команды
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        _count: {
          select: {
            members: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    // Проверяем максимальное количество участников
    if (team._count.members >= team.maxMembers) {
      throw new BadRequestException(
        `В команде уже максимальное количество участников (${team.maxMembers})`,
      );
    }

    // Проверяем, есть ли у пользователя активное членство в какой-либо команде
    const activeTeamMembership = await this.prisma.userTeam.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (activeTeamMembership) {
      throw new BadRequestException(
        'Пользователь уже состоит в активной команде',
      );
    }

    // создаем связь с новыми полями
    return this.prisma.userTeam.create({
      data: {
        userId,
        teamId,
        isActive: true,
        joinedAt: new Date(),
      },
    });
  }

  // Новые методы для управления десятками
  async createTeam(createTeamDto: CreateTeamDto, creatorId: number) {
    const { name, description } = createTeamDto;

    return this.prisma.team.create({
      data: {
        name,
        description,
        maxMembers: 10,
        isActive: true,
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async assignLeader(teamId: number, leaderId: number, assignerId: number) {
    // Проверяем существование команды
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    // Проверяем существование пользователя
    const leader = await this.prisma.user.findUnique({
      where: { id: leaderId },
    });

    if (!leader) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Любой пользователь может быть назначен лидером команды

    // Проверяем уникальность лидера - пользователь не должен быть лидером другой команды
    const existingLeadership = await this.prisma.team.findFirst({
      where: {
        leaderId: leaderId,
        id: { not: teamId },
        isActive: true,
      },
    });

    if (existingLeadership) {
      throw new BadRequestException(
        'Пользователь уже является лидером другой команды',
      );
    }

    // Обновляем команду
    return this.prisma.team.update({
      where: { id: teamId },
      data: { leaderId },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }

  async removeLeader(teamId: number, removerId: number) {
    // Проверяем существование команды
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    if (!team.leaderId) {
      throw new BadRequestException('У команды нет лидера');
    }

    // Снимаем лидера (устанавливаем leaderId в null)
    return this.prisma.team.update({
      where: { id: teamId },
      data: { leaderId: null },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }

  async getTeamsForUser(userId: number, userRole: Role) {
    if (userRole === Role.ADMIN) {
      // Организаторы видят все команды
      const teams = await this.prisma.team.findMany({
        where: { isActive: true },
        include: {
          leader: {
            select: {
              id: true,
              name: true,
              phone: true,
              role: true,
            },
          },
          members: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  role: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return teams.map((team) => ({
        ...team,
        members: team.members.map((m) => m.user),
      }));
    }

    if (userRole === Role.TEAM_LEADER) {
      // Лидеры видят команды, которыми руководят, и команды, в которых участвуют
      const teams = await this.prisma.team.findMany({
        where: {
          isActive: true,
          OR: [
            { leaderId: userId },
            { members: { some: { userId, isActive: true } } },
          ],
        },
        include: {
          leader: {
            select: {
              id: true,
              name: true,
              phone: true,
              role: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  role: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return teams.map((team) => ({
        ...team,
        members: team.members.map((m) => m.user),
      }));
    }

    // Предприниматели видят только свои активные команды
    const userTeams = await this.prisma.userTeam.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        team: {
          include: {
            leader: {
              select: {
                id: true,
                name: true,
                phone: true,
                role: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                    role: true,
                  },
                },
              },
            },
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
    });

    return userTeams
      .map((ut) => ({
        ...ut.team,
        members: ut.team.members.map((m) => m.user),
      }))
      .filter((team) => team.isActive);
  }

  async moveUserToTeam(userId: number, fromTeamId: number, toTeamId: number) {
    // Проверяем существование команд
    const [fromTeam, toTeam] = await Promise.all([
      this.prisma.team.findUnique({ where: { id: fromTeamId } }),
      this.prisma.team.findUnique({ where: { id: toTeamId } }),
    ]);

    if (!fromTeam || !toTeam) {
      throw new NotFoundException('Одна из команд не найдена');
    }

    // Проверяем, что пользователь активно состоит в исходной команде
    const membership = await this.prisma.userTeam.findFirst({
      where: {
        userId,
        teamId: fromTeamId,
        isActive: true,
      },
    });

    if (!membership) {
      throw new BadRequestException(
        'Пользователь не состоит в исходной команде',
      );
    }

    // Проверяем, что в целевой команде есть место
    const toTeamMembersCount = await this.prisma.userTeam.count({
      where: {
        teamId: toTeamId,
        isActive: true,
      },
    });

    if (toTeamMembersCount >= toTeam.maxMembers) {
      throw new BadRequestException('В целевой команде нет свободных мест');
    }

    // Проверяем, что пользователь не имеет активного членства в другой команде
    const activeTeamMembership = await this.prisma.userTeam.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (activeTeamMembership && activeTeamMembership.teamId !== fromTeamId) {
      throw new BadRequestException(
        'Пользователь уже состоит в другой активной команде',
      );
    }

    // Выполняем перемещение в транзакции
    return this.prisma.$transaction(async (tx) => {
      // Деактивируем старое членство
      await tx.userTeam.update({
        where: { id: membership.id },
        data: {
          isActive: false,
          leftAt: new Date(),
        },
      });

      // Добавляем в новую команду
      return tx.userTeam.create({
        data: {
          userId,
          teamId: toTeamId,
          isActive: true,
          joinedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              role: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });
    });
  }

  async getTeamMembers(teamId: number) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                patronymic: true,
                phone: true,
                personalPhone: true,
                role: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            user: {
              name: 'asc',
            },
          },
        },
        _count: {
          select: {
            members: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      maxMembers: team.maxMembers,
      leaderId: team.leaderId,
      leader: team.leader,
      members: team.members.map((m) => m.user),
      membersCount: team._count.members,
      availableSlots: team.maxMembers - team._count.members,
      isActive: team.isActive,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }

  async checkTeamAccess(
    userId: number,
    teamId: number,
    userRole: Role,
  ): Promise<boolean> {
    // Администраторы имеют доступ ко всем командам
    if (userRole === Role.ADMIN) {
      return true;
    }

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: {
            userId,
            isActive: true,
          },
        },
      },
    });

    if (!team) {
      return false;
    }

    // Лидер команды имеет доступ
    if (team.leaderId === userId) {
      return true;
    }

    // Участник команды имеет доступ
    if (team.members.length > 0) {
      return true;
    }

    return false;
  }

  async removeMember(
    teamId: number,
    userId: number,
    removerId: number,
    removerRole: Role,
  ) {
    // Проверяем существование команды
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: {
            userId,
            isActive: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    // Проверяем, что пользователь состоит в команде
    if (team.members.length === 0) {
      throw new BadRequestException('Пользователь не состоит в этой команде');
    }

    // Проверяем права доступа - администраторы, лидеры команды могут удалять участников, или пользователь удаляет себя
    const canRemove =
      removerRole === Role.ADMIN ||
      team.leaderId === removerId ||
      removerId === userId; // Разрешаем самоудаление

    if (!canRemove) {
      throw new ForbiddenException(
        'Нет прав для удаления участника из команды',
      );
    }

    // Если удаляем лидера команды, автоматически снимаем его с поста
    if (team.leaderId === userId) {
      await this.prisma.team.update({
        where: { id: teamId },
        data: { leaderId: null },
      });
    }

    // Удаляем активное членство пользователя в команде
    await this.prisma.userTeam.deleteMany({
      where: {
        userId,
        teamId,
        isActive: true,
      },
    });

    return {
      message: 'Участник успешно удален из команды',
      teamId,
      userId,
    };
  }

  // Новые методы для управления участниками с поддержкой isActive
  async addMemberToTeam(
    teamId: number,
    userId: number,
    adderId: number,
    adderRole: Role,
  ) {
    // Проверяем существование команды
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        _count: {
          select: {
            members: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    // Проверяем права доступа - администраторы и лидеры команды могут добавлять участников
    if (
      adderRole !== Role.ADMIN &&
      team.leaderId !== adderId
    ) {
      throw new ForbiddenException(
        'Нет прав для добавления участника в команду',
      );
    }

    // Проверяем максимальное количество участников
    if (team._count.members >= team.maxMembers) {
      throw new BadRequestException(
        `В команде уже максимальное количество участников (${team.maxMembers})`,
      );
    }

    // Проверяем, есть ли у пользователя активное членство в какой-либо команде
    const activeTeamMembership = await this.prisma.userTeam.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (activeTeamMembership) {
      throw new BadRequestException(
        'Пользователь уже состоит в активной команде',
      );
    }

    // Добавляем участника в команду
    return this.prisma.userTeam.create({
      data: {
        userId,
        teamId,
        isActive: true,
        joinedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });
  }

  async transferMemberBetweenTeams(
    userId: number,
    fromTeamId: number,
    toTeamId: number,
    transfererId: number,
    transfererRole: Role,
  ) {
    // Проверяем права доступа к обеим командам
    const [fromTeamAccess, toTeamAccess] = await Promise.all([
      this.checkTeamAccess(transfererId, fromTeamId, transfererRole),
      this.checkTeamAccess(transfererId, toTeamId, transfererRole),
    ]);

    if (
      (!fromTeamAccess || !toTeamAccess) &&
      transfererRole !== Role.ADMIN
    ) {
      throw new ForbiddenException(
        'Нет прав для перемещения участника между командами',
      );
    }

    return this.moveUserToTeam(userId, fromTeamId, toTeamId);
  }

  async getUserActiveTeam(userId: number) {
    const activeTeamMembership = await this.prisma.userTeam.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        team: {
          include: {
            leader: {
              select: {
                id: true,
                name: true,
                phone: true,
                role: true,
              },
            },
            members: {
              where: { isActive: true },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                    role: true,
                  },
                },
              },
            },
            _count: {
              select: {
                members: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
      },
    });

    return activeTeamMembership
      ? {
          ...activeTeamMembership.team,
          members: activeTeamMembership.team.members.map((m) => m.user),
          joinedAt: activeTeamMembership.joinedAt,
          membersCount: activeTeamMembership.team._count.members,
          availableSlots:
            activeTeamMembership.team.maxMembers -
            activeTeamMembership.team._count.members,
        }
      : null;
  }

  async getTeamHistory(teamId: number) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    const allMemberships = await this.prisma.userTeam.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return {
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
      },
      memberships: allMemberships.map((membership) => ({
        user: membership.user,
        joinedAt: membership.joinedAt,
        leftAt: membership.leftAt,
        isActive: membership.isActive,
      })),
    };
  }

  async updateTeam(
    teamId: number,
    updateTeamDto: UpdateTeamDto,
    updaterId: number,
    updaterRole: Role,
  ) {
    // Проверяем существование команды
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Команда не найдена');
    }

    // Проверяем права доступа
    const hasAccess = await this.checkTeamAccess(
      updaterId,
      teamId,
      updaterRole,
    );
    if (
      !hasAccess &&
      updaterRole !== Role.ADMIN
    ) {
      throw new ForbiddenException('Нет прав для обновления команды');
    }

    // Обновляем команду
    return this.prisma.team.update({
      where: { id: teamId },
      data: updateTeamDto,
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: {
              where: { isActive: true },
            },
          },
        },
      },
    });
  }
}
