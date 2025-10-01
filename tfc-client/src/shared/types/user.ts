import { Role } from './role';

export interface User {
  id: number;
  email?: string;
  phone?: string;
  name?: string;
  surname?: string;
  patronymic?: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: number;
  userId: number;
  phone?: string;
  bio?: string;
  avatar?: string;
  company?: string;
  position?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: Role;
  isActive?: boolean;
}

export interface UpdateUserProfileData {
  phone?: string;
  bio?: string;
  avatar?: string;
  company?: string;
  position?: string;
  website?: string;
  socialLinks?: Record<string, string>;
}

// Утилитарные типы для фильтрации пользователей
export interface GetUsersFilters {
  role?: Role;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Типы для аутентификации
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

export interface RegisterData extends CreateUserData {
  confirmPassword: string;
}

// Утилитарные функции для работы с пользователями
export const getUserFullName = (user: User | null | undefined): string => {
  if (!user) return 'Неизвестный пользователь';
  const firstName = user.name || user.firstName || '';
  const lastName = user.surname || user.lastName || '';
  const patronymic = user.patronymic || '';
  
  // Формат: "Фамилия Имя Отчество" или "Фамилия Имя" если нет отчества
  const parts = [lastName, firstName, patronymic].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : `Пользователь #${user.id || 'неизвестен'}`;
};

export const getUserInitials = (user: User | null | undefined): string => {
  if (!user) return 'U';
  const firstName = user.name || user.firstName || '';
  const lastName = user.surname || user.lastName || '';
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}` || 'U';
};

export const canUserManageTeams = (user: User | null | undefined): boolean => {
  if (!user) return false;
  return user.role === Role.ADMIN || 
         user.role === Role.TEAM_LEADER;
};

export const canUserCreateTeams = (user: User | null | undefined): boolean => {
  if (!user) return false;
  return user.role === Role.ADMIN;
};

export const isUserActive = (user: User | null | undefined): boolean => {
  if (!user) return false;
  return user.isActive ?? false;
};