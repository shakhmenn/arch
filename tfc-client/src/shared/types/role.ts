export enum Role {
  USER = 'USER',
  TEAM_LEADER = 'TEAM_LEADER',
  ADMIN = 'ADMIN'
}

// Для обратной совместимости
export type RoleType = Role;

// Утилитарные функции для работы с ролями
export const isAdmin = (role: Role): boolean => {
  return role === Role.ADMIN;
};

export const canManageTeams = (role: Role): boolean => {
  return role === Role.ADMIN || role === Role.TEAM_LEADER;
};

export const getRoleDisplayName = (role: Role): string => {
  switch (role) {
    case Role.ADMIN:
      return 'Администратор';
    case Role.TEAM_LEADER:
      return 'Лидер команды';
    case Role.USER:
      return 'Пользователь';
    default:
      return 'Неизвестная роль';
  }
};