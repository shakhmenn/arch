import { http } from '@shared/api/http';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Team, CreateTeamData, AddMemberData, UpdateTeamData } from '@shared/types/team';
import type { TeamWithMembers } from '@entities/team/model/types';
import type { User } from '@shared/types/user';

const TEAMS_QUERY_KEY = ['teams'] as const;

export const useTeamsQuery = () => {
  return useQuery({
    queryKey: TEAMS_QUERY_KEY,
    queryFn: async () => {
      return await http<Team[]>('/teams', { method: 'GET' });
    },
  });
};

export const useTeamQuery = (teamId: number | undefined) => {
  return useQuery({
    queryKey: [...TEAMS_QUERY_KEY, teamId ?? ''],
    queryFn: async () => {
      if (!teamId) throw new Error('teamId is required');
      return await http<TeamWithMembers>(`/teams/${String(teamId)}`, { method: 'GET' });
    },
    enabled: Boolean(teamId),
  });
};

export const useCreateTeamMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTeamData) => {
      return await http<Team>('/teams', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
    },
  });
};

export const useAssignUserToTeamMutation = (teamId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddMemberData) => {
      return await http(`/teams/${String(teamId)}/users`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
    },
  });
};

export const useUpdateTeamMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, data }: { teamId: number; data: UpdateTeamData }) => {
      return await http<Team>(`/teams/${teamId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
    },
  });
};

// API хук для получения списка всех пользователей
export const useUsersQuery = () => {
  return useQuery({
    queryKey: ['users'] as const,
    queryFn: async () => {
      return await http<User[]>('/users', { method: 'GET' });
    },
  });
};

// API хук для получения пользователей, доступных для добавления в команды
export const useAvailableUsersQuery = () => {
  return useQuery({
    queryKey: ['users', 'available-for-teams'] as const,
    queryFn: async () => {
      return await http<User[]>('/users/available-for-teams', { method: 'GET' });
    },
  });
};

// Мутация для добавления участника в команду
export const useAddMemberMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: number; userId: number }) => {
      return await http(`/teams/${teamId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    },
    onSuccess: (_, { teamId }) => {
      void queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: [...TEAMS_QUERY_KEY, teamId] });
      void queryClient.invalidateQueries({ queryKey: ['users', 'available-for-teams'] });
    },
  });
};

// Мутация для удаления участника из команды
export const useRemoveMemberMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: number; userId: number }) => {
      return await http(`/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_, { teamId }) => {
      void queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: [...TEAMS_QUERY_KEY, teamId] });
      void queryClient.invalidateQueries({ queryKey: ['users', 'available-for-teams'] });
    },
  });
};

// Мутация для назначения лидера команды
export const useAssignLeaderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, leaderId }: { teamId: number; leaderId: number }) => {
      return await http(`/teams/${teamId}/leader`, {
        method: 'PATCH',
        body: JSON.stringify({ leaderId }),
      });
    },
    onSuccess: (_, { teamId }) => {
      void queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: [...TEAMS_QUERY_KEY, teamId] });
    },
   });
 };

// Мутация для снятия лидера команды
export const useRemoveLeaderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId }: { teamId: number }) => {
      return await http(`/teams/${teamId}/leader`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_, { teamId }) => {
      void queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: [...TEAMS_QUERY_KEY, teamId] });
    },
  });
};

// Хук для получения активной команды пользователя
export const useUserActiveTeamQuery = (userId: number | undefined) => {
  return useQuery({
    queryKey: ['user-active-team', userId ?? ''] as const,
    queryFn: async () => {
      if (!userId) throw new Error('userId is required');
      return await http<TeamWithMembers | null>(`/teams/user/${userId}/active-team`, { method: 'GET' });
    },
    enabled: Boolean(userId),
  });
};
