import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api/base-api';
import type { User } from '../model/types';

export interface UpdateUserDto {
  name?: string;
  surname?: string;
  patronymic?: string;
  birthDate?: string;
  personalTelegram?: string;
  personalInstagram?: string;
  personalPhone?: string;
  yearsInBusiness?: number;
  hobbies?: string;
}

const USER_KEYS = {
  all: ['users'] as const,
  me: () => [...USER_KEYS.all, 'me'] as const,
};

// Обновить данные текущего пользователя
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateUserDto): Promise<User> => {
      const response = await api.patch('/users/me', data);
      return response.data;
    },
    onSuccess: () => {
      // Инвалидируем кеш профиля, чтобы обновить данные пользователя
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
    },
  });
};