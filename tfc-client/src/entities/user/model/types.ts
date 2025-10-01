import { Role } from '@shared/types/role';

export interface User {
  id: number;
  phone: string;
  name: string;
  surname?: string; // Фамилия
  patronymic?: string; // Отчество
  birthDate?: string; // Дата рождения
  personalTelegram?: string; // Личный Telegram
  personalInstagram?: string; // Личный Instagram
  personalPhone?: string; // Личный номер телефона
  yearsInBusiness?: number; // Сколько лет в бизнесе
  hobbies?: string; // Увлечения
  role: Role;
  createdAt: string;
}

export interface CreateUserDto {
  surname?: string;
  patronymic?: string;
  birthDate?: string;
  personalTelegram?: string;
  personalInstagram?: string;
  personalPhone?: string;
  yearsInBusiness?: number;
  hobbies?: string;
}

export interface UpdateUserDto {
  surname?: string;
  patronymic?: string;
  birthDate?: string;
  personalTelegram?: string;
  personalInstagram?: string;
  personalPhone?: string;
  yearsInBusiness?: number;
  hobbies?: string;
}

export interface UserState {
  data: User | null;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}