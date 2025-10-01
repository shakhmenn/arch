import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api/base-api';
import { BusinessContext, CreateBusinessContextDto, UpdateBusinessContextDto } from '../model/types';

// API функции
const businessContextApi = {
  // Получить бизнес-контекст
  getBusinessContext: async (): Promise<BusinessContext> => {
    const response = await api.get('/metrics/business-context');
    return response.data;
  },

  // Создать бизнес-контекст
  createBusinessContext: async (data: CreateBusinessContextDto): Promise<BusinessContext> => {
    const response = await api.post('/metrics/business-context', data);
    return response.data;
  },

  // Обновить бизнес-контекст
  updateBusinessContext: async (data: UpdateBusinessContextDto): Promise<BusinessContext> => {
    const response = await api.patch('/metrics/business-context', data);
    return response.data;
  },
};

// React Query хуки
export const useBusinessContext = () => {
  return useQuery({
    queryKey: ['businessContext'],
    queryFn: businessContextApi.getBusinessContext,
    retry: (failureCount, error: any) => {
      // Не повторять запрос если контекст не найден (404) или сервер недоступен
      if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
        return false;
      }
      return failureCount < 3;
    },
    // Возвращаем null при ошибке вместо выброса исключения
    throwOnError: false,
  });
};

export const useCreateBusinessContext = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: businessContextApi.createBusinessContext,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessContext'] });
    },
  });
};

export const useUpdateBusinessContext = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: businessContextApi.updateBusinessContext,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessContext'] });
    },
  });
};