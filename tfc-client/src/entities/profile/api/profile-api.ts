import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api/base-api';
import type { UserProfile, CreateProfileDto, UpdateProfileDto } from '../model/types';

const PROFILE_KEYS = {
  all: ['profiles'] as const,
  me: () => [...PROFILE_KEYS.all, 'me'] as const,
  byId: (id: number) => [...PROFILE_KEYS.all, id] as const,
  list: () => [...PROFILE_KEYS.all, 'list'] as const,
};

// Получить свой профиль
export const useMyProfile = () => {
  return useQuery({
    queryKey: PROFILE_KEYS.me(),
    queryFn: async (): Promise<UserProfile | null> => {
      console.log('useMyProfile: Starting API request to /profiles/me');
      try {
        const response = await api.get('/profiles/me');
        console.log('useMyProfile: Success response:', response.data);
        return response.data;
      } catch (error: any) {
        console.log('useMyProfile: Error occurred:', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
        // Если профиль не найден (404) или сервер недоступен, возвращаем null вместо ошибки
        if (error.response?.status === 404 || error?.code === 'ERR_NETWORK') {
          console.log('useMyProfile: Profile not found or server unavailable, returning null');
          return null;
        }
        console.log('useMyProfile: Throwing error for status:', error.response?.status);
        throw error;
      }
    },
    retry: false, // Не повторяем запрос при 404 или сетевых ошибках
    throwOnError: false, // Не выбрасываем ошибки, обрабатываем их в queryFn
  });
};

// Получить профиль по ID (только для ORGANIZER)
export const useProfile = (userId: number) => {
  return useQuery({
    queryKey: PROFILE_KEYS.byId(userId),
    queryFn: async (): Promise<UserProfile> => {
      const response = await api.get(`/profiles/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });
};

// Получить список всех профилей (только для ORGANIZER)
export const useProfiles = () => {
  return useQuery({
    queryKey: PROFILE_KEYS.list(),
    queryFn: async (): Promise<UserProfile[]> => {
      const response = await api.get('/profiles');
      return response.data;
    },
  });
};

// Создать профиль
export const useCreateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateProfileDto): Promise<UserProfile> => {
      console.log('Creating profile with data:', data);
      try {
        const response = await api.post('/profiles', data);
        console.log('Profile created successfully:', response.data);
        return response.data;
      } catch (error) {
        console.error('Profile creation failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Profile creation success callback:', data);
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.all });
    },
    onError: (error) => {
      console.error('Profile creation error callback:', error);
    },
  });
};

// Обновить профиль
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateProfileDto): Promise<UserProfile> => {
      const response = await api.patch('/profiles', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.all });
    },
  });
};

// Удалить профиль
export const useDeleteProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await api.delete('/profiles');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.all });
    },
  });
};