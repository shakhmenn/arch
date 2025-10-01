import { Role } from '@shared/types/role';

export interface UserProfile {
  id: number;
  userId: number;
  userName?: string;
  userAge?: number;
  businessName?: string;
  businessDescription?: string;
  currentRevenue?: number;
  targetRevenue?: number;
  currentEmployees?: number;
  targetEmployees?: number;
  bio?: string;
  avatarUrl?: string;
  workPhone?: string; // Рабочий номер телефона
  website?: string; // Официальный сайт
  workInstagram?: string; // Рабочий аккаунт Instagram
  workTelegram?: string; // Рабочий канал Telegram
  workSchedule?: string; // График работы
  addresses?: string; // Адреса точек присутствия
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    surname?: string;
    patronymic?: string;
    birthDate?: string;
    personalTelegram?: string;
    personalInstagram?: string;
    personalPhone?: string;
    yearsInBusiness?: number;
    hobbies?: string;
    phone: string;
    role: Role;
    createdAt: string;
  };
}

export interface CreateProfileDto {
  userName?: string;
  userAge?: number;
  businessName?: string;
  businessDescription?: string;
  currentRevenue?: number;
  targetRevenue?: number;
  currentEmployees?: number;
  targetEmployees?: number;
  bio?: string;
  workPhone?: string;
  website?: string;
  workInstagram?: string;
  workTelegram?: string;
  workSchedule?: string;
  addresses?: string;
}

export interface UpdateProfileDto extends Partial<CreateProfileDto> {}

// Типы для бизнес-контекста
export interface BusinessContext {
  id: number;
  userId: number;
  industry?: string;
  businessStage?: string;
  foundedYear?: number;
  location?: string;
  mainProducts?: string;
  targetAudience?: string;
  businessModel?: string;
  marketSize?: number;
  competitorCount?: number;
  dataRelevanceDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessContextDto {
  industry?: string;
  businessStage?: string;
  foundedYear?: number;
  location?: string;
  mainProducts?: string;
  targetAudience?: string;
  businessModel?: string;
  marketSize?: number;
  competitorCount?: number;
  dataRelevanceDate: string;
}

export interface UpdateBusinessContextDto extends Partial<CreateBusinessContextDto> {}