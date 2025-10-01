import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api/base-api';
import {
  MetricDefinition,
  MetricValue,
  MetricHistory,
  MetricsDashboard,
  CreateMetricValueDto,
  UpdateMetricValueDto,
  MetricsFilters,
  MetricCategory,
} from '../model/types';

// API функции
const metricsApi = {
  // Получить все определения метрик
  getMetricDefinitions: async (): Promise<MetricDefinition[]> => {
    const response = await api.get('/metrics/definitions');
    return response.data;
  },

  // Получить определения метрик по категории
  getMetricDefinitionsByCategory: async (category: MetricCategory): Promise<MetricDefinition[]> => {
    const response = await api.get(`/metrics/definitions/category/${category}`);
    return response.data;
  },

  // Получить значения метрик пользователя
  getMetricValues: async (filters?: MetricsFilters): Promise<MetricValue[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.periodType) params.append('periodType', filters.periodType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/metrics/values?${params.toString()}`);
    return response.data;
  },

  // Создать значение метрики
  createMetricValue: async (data: CreateMetricValueDto): Promise<MetricValue> => {
    const response = await api.post('/metrics/values', data);
    return response.data;
  },

  // Обновить значение метрики
  updateMetricValue: async (id: number, data: UpdateMetricValueDto): Promise<MetricValue> => {
    const response = await api.patch(`/metrics/values/${id}`, data);
    return response.data;
  },

  // Удалить значение метрики
  deleteMetricValue: async (id: number): Promise<void> => {
    await api.delete(`/metrics/values/${id}`);
  },

  // Получить историю изменений метрики
  getMetricHistory: async (metricValueId: number): Promise<MetricHistory[]> => {
    const response = await api.get(`/metrics/values/${metricValueId}/history`);
    return response.data;
  },

  // Получить дашборд метрик
  getMetricsDashboard: async (): Promise<MetricsDashboard> => {
    const response = await api.get('/metrics/dashboard');
    return response.data;
  },
};

// React Query хуки
export const useMetricDefinitions = () => {
  return useQuery({
    queryKey: ['metricDefinitions'],
    queryFn: metricsApi.getMetricDefinitions,
  });
};

export const useMetricDefinitionsByCategory = (category: MetricCategory) => {
  return useQuery({
    queryKey: ['metricDefinitions', 'category', category],
    queryFn: () => metricsApi.getMetricDefinitionsByCategory(category),
  });
};

export const useMetricValues = (filters?: MetricsFilters) => {
  return useQuery({
    queryKey: ['metricValues', filters],
    queryFn: () => metricsApi.getMetricValues(filters),
  });
};

export const useMetricValue = (id: number) => {
  return useQuery({
    queryKey: ['metricValue', id],
    queryFn: async (): Promise<MetricValue> => {
      const response = await api.get(`/metrics/values/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateMetricValue = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: metricsApi.createMetricValue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metricValues'] });
      queryClient.invalidateQueries({ queryKey: ['metricsDashboard'] });
    },
  });
};

export const useUpdateMetricValue = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMetricValueDto }) => 
      metricsApi.updateMetricValue(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metricValues'] });
      queryClient.invalidateQueries({ queryKey: ['metricsDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['metricHistory'] });
    },
  });
};

export const useDeleteMetricValue = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: metricsApi.deleteMetricValue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metricValues'] });
      queryClient.invalidateQueries({ queryKey: ['metricsDashboard'] });
    },
  });
};

export const useMetricHistory = (metricValueId: number) => {
  return useQuery({
    queryKey: ['metricHistory', metricValueId],
    queryFn: () => metricsApi.getMetricHistory(metricValueId),
    enabled: !!metricValueId,
  });
};

export const useMetricsDashboard = () => {
  return useQuery({
    queryKey: ['metricsDashboard'],
    queryFn: metricsApi.getMetricsDashboard,
    retry: (failureCount, error: any) => {
      // Не повторять запрос если нет данных (404)
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
};