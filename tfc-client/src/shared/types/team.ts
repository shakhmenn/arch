import { User } from './user';

export interface Team {
  id: number;
  name: string;
  description?: string | null;
  maxMembers: number;
  leaderId?: number;
  leader?: User;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members?: User[];
  _count?: {
    members: number;
  };
}

export interface TeamMember {
  id: number;
  userId: number;
  teamId: number;
  user: User;
  joinedAt: string;
  isActive: boolean;
}

// DTO для создания команды
export interface CreateTeamData {
  name: string;
  description?: string;
  maxMembers?: number;
  leaderId?: number;
}

// DTO для обновления команды
export interface UpdateTeamData {
  name?: string;
  description?: string;
  maxMembers?: number;
  isActive?: boolean;
}

// DTO для назначения лидера
export interface AssignLeaderData {
  leaderId: number;
}

// DTO для добавления участника
export interface AddMemberData {
  userId: number;
}

// Фильтры для получения команд
export interface GetTeamsFilters {
  isActive?: boolean;
  search?: string;
  leaderId?: number;
  hasLeader?: boolean;
  page?: number;
  limit?: number;
}

// Ответ API для списка команд
export interface TeamsResponse {
  teams: Team[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Статистика команды
export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  completedTasks: number;
  pendingTasks: number;
  teamEfficiency: number;
}

// Детальная информация о команде
export interface TeamDetails extends Team {
  stats: TeamStats;
  recentActivity: TeamActivity[];
}

// Активность команды
export interface TeamActivity {
  id: number;
  type: 'member_joined' | 'member_left' | 'leader_assigned' | 'task_completed' | 'team_created';
  description: string;
  userId?: number;
  user?: User;
  createdAt: string;
}

// Утилитарные функции для работы с командами
export const getTeamMembersCount = (team: Team): number => {
  return team._count?.members ?? team.members?.length ?? 0;
};

export const isTeamFull = (team: Team): boolean => {
  const membersCount = getTeamMembersCount(team);
  return membersCount >= team.maxMembers;
};

export const canAddMembers = (team: Team): boolean => {
  return team.isActive && !isTeamFull(team);
};

export const isUserTeamLeader = (team: Team, userId: number): boolean => {
  return team.leaderId === userId;
};

export const isUserTeamMember = (team: Team, userId: number): boolean => {
  return team.members?.some(member => member.id === userId) ?? false;
};

export const getTeamLeader = (team: Team): User | undefined => {
  return team.leader;
};

export const getActiveMembers = (team: Team): User[] => {
  return team.members ?? [];
};

export const getTeamCapacityPercentage = (team: Team): number => {
  const membersCount = getTeamMembersCount(team);
  return Math.round((membersCount / team.maxMembers) * 100);
};

export const formatTeamCapacity = (team: Team): string => {
  const membersCount = getTeamMembersCount(team);
  return `${membersCount}/${team.maxMembers}`;
};

// Типы для сортировки команд
export type TeamSortField = 'name' | 'createdAt' | 'membersCount' | 'leader';
export type SortOrder = 'asc' | 'desc';

export interface TeamSortOptions {
  field: TeamSortField;
  order: SortOrder;
}

// Статусы команды
export enum TeamStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FULL = 'full',
  NEEDS_LEADER = 'needs_leader'
}

export const getTeamStatus = (team: Team): TeamStatus => {
  if (!team.isActive) return TeamStatus.INACTIVE;
  if (!team.leaderId) return TeamStatus.NEEDS_LEADER;
  if (isTeamFull(team)) return TeamStatus.FULL;
  return TeamStatus.ACTIVE;
};

export const getTeamStatusDisplayName = (status: TeamStatus): string => {
  switch (status) {
    case TeamStatus.ACTIVE:
      return 'Активная';
    case TeamStatus.INACTIVE:
      return 'Неактивная';
    case TeamStatus.FULL:
      return 'Заполнена';
    case TeamStatus.NEEDS_LEADER:
      return 'Нужен лидер';
    default:
      return 'Неизвестный статус';
  }
};