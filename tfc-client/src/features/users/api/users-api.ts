import { http } from '@shared/api/http';
import { useQuery } from '@tanstack/react-query';
import type { User } from '@entities/user/model/types';

const USERS_QUERY_KEY = ['users'] as const;

export const useUsersQuery = () => {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: async () => {
      return await http<User[]>('/users', { method: 'GET' });
    },
  });
};

export type { User };
