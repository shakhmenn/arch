import { useUserStore } from '@entities/user/model/slice';
import { extractToken, http, setToken as persistToken } from '@shared/api/http';
import { useMutation } from '@tanstack/react-query';
import { setUser as persistUser } from '@shared/api/base-api.ts';

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  password: string;
}

type AnyJson = Record<string, unknown>;

function extractUser(obj: unknown) {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as { user?: unknown };
  const u = o.user;
  return u && typeof u === 'object' ? (u as import('@entities/user/model/types').User) : null;
}

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      return await http<AnyJson>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data) => {
      const token = extractToken(data);
      if (token) {
        persistToken(token);
        useUserStore.getState().setToken(token);
      } else {
        persistToken(null);
        useUserStore.getState().setToken(null);
      }
      const user = extractUser(data);
      if (user) {
        persistUser(user);
        useUserStore.getState().setUser(user);
      } else {
        persistUser(null);
        useUserStore.getState().setUser(null);
      }
    },
  });
};

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      return await http<AnyJson>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data) => {
      const token = extractToken(data);
      if (token) {
        persistToken(token);
        useUserStore.getState().setToken(token);
      } else {
        persistToken(null);
        useUserStore.getState().setToken(null);
      }
      const user = extractUser(data);
      if (user) {
        persistUser(user);
        useUserStore.getState().setUser(user);
      } else {
        persistUser(null);
        useUserStore.getState().setUser(null);
      }
    },
  });
};

export const useLogoutMutation = () => {
  return useMutation({
    mutationFn: async () => {
      return Promise.resolve();
    },
    onSuccess: () => {
      persistToken(null);
      persistUser(null);
      useUserStore.getState().logout();
    },
  });
};
