import { api } from './base-api';
import {
  Team,
  TeamDetails,
  CreateTeamData,
  UpdateTeamData,
  AssignLeaderData,
  AddMemberData,
  GetTeamsFilters,
  TeamsResponse,
  TeamMember
} from '../types/team';
import { User } from '../types/user';

/**
 * API клиент для работы с командами
 */
export const teamsApi = {
  /**
   * Получить список команд с фильтрацией
   */
  async getTeams(filters?: GetTeamsFilters): Promise<TeamsResponse> {
    const response = await api.get('/teams', { params: filters });
    return response.data;
  },

  /**
   * Получить информацию о конкретной команде
   */
  async getTeam(id: number): Promise<TeamDetails> {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  /**
   * Создать новую команду
   */
  async createTeam(data: CreateTeamData): Promise<Team> {
    const response = await api.post('/teams', data);
    return response.data;
  },

  /**
   * Обновить информацию о команде
   */
  async updateTeam(id: number, data: UpdateTeamData): Promise<Team> {
    const response = await api.patch(`/teams/${id}`, data);
    return response.data;
  },

  /**
   * Удалить команду
   */
  async deleteTeam(id: number): Promise<void> {
    await api.delete(`/teams/${id}`);
  },

  /**
   * Назначить лидера команды
   */
  async assignLeader(teamId: number, data: AssignLeaderData): Promise<Team> {
    const response = await api.patch(`/teams/${teamId}/leader`, data);
    return response.data;
  },

  /**
   * Добавить участника в команду
   */
  async addMember(teamId: number, data: AddMemberData): Promise<TeamMember> {
    const response = await api.post(`/teams/${teamId}/members`, data);
    return response.data;
  },

  /**
   * Удалить участника из команды
   */
  async removeMember(teamId: number, userId: number): Promise<void> {
    await api.delete(`/teams/${teamId}/members/${userId}`);
  },

  /**
   * Получить участников команды
   */
  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    const response = await api.get(`/teams/${teamId}/members`);
    return response.data;
  },

  /**
   * Получить доступных пользователей для добавления в команду
   */
  async getAvailableUsers(teamId?: number): Promise<User[]> {
    const params = teamId ? { excludeTeam: teamId } : {};
    const response = await api.get('/users/available', { params });
    return response.data;
  },

  /**
   * Получить команды пользователя
   */
  async getUserTeams(userId?: number): Promise<Team[]> {
    const endpoint = userId ? `/users/${userId}/teams` : '/users/me/teams';
    const response = await api.get(endpoint);
    return response.data;
  },

  /**
   * Переместить пользователя между командами
   */
  async moveUserToTeam(userId: number, fromTeamId: number, toTeamId: number): Promise<void> {
    await api.post('/teams/move-user', {
      userId,
      fromTeamId,
      toTeamId
    });
  },

  /**
   * Получить статистику команды
   */
  async getTeamStats(teamId: number): Promise<any> {
    const response = await api.get(`/teams/${teamId}/stats`);
    return response.data;
  },

  /**
   * Поиск команд
   */
  async searchTeams(query: string): Promise<Team[]> {
    const response = await api.get('/teams/search', { params: { q: query } });
    return response.data;
  },

  /**
   * Получить команды для конкретной роли пользователя
   */
  async getTeamsForRole(role: string): Promise<Team[]> {
    const response = await api.get('/teams/by-role', { params: { role } });
    return response.data;
  },

  /**
   * Активировать/деактивировать команду
   */
  async toggleTeamStatus(teamId: number, isActive: boolean): Promise<Team> {
    const response = await api.patch(`/teams/${teamId}/status`, { isActive });
    return response.data;
  },

  /**
   * Получить историю изменений команды
   */
  async getTeamHistory(teamId: number): Promise<any[]> {
    const response = await api.get(`/teams/${teamId}/history`);
    return response.data;
  },

  /**
   * Экспортировать данные команды
   */
  async exportTeamData(teamId: number, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await api.get(`/teams/${teamId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Получить рекомендации по составу команды
   */
  async getTeamRecommendations(teamId: number): Promise<User[]> {
    const response = await api.get(`/teams/${teamId}/recommendations`);
    return response.data;
  },

  /**
   * Отправить приглашение в команду
   */
  async inviteToTeam(teamId: number, email: string): Promise<void> {
    await api.post(`/teams/${teamId}/invite`, { email });
  },

  /**
   * Принять приглашение в команду
   */
  async acceptInvitation(invitationToken: string): Promise<Team> {
    const response = await api.post('/teams/accept-invitation', { token: invitationToken });
    return response.data;
  },

  /**
   * Отклонить приглашение в команду
   */
  async declineInvitation(invitationToken: string): Promise<void> {
    await api.post('/teams/decline-invitation', { token: invitationToken });
  }
};

/**
 * Утилитарные функции для работы с API команд
 */
export const teamsApiUtils = {
  /**
   * Проверить доступность имени команды
   */
  async isTeamNameAvailable(name: string, excludeId?: number): Promise<boolean> {
    try {
      const response = await api.get('/teams/check-name', {
        params: { name, excludeId }
      });
      return response.data.available;
    } catch {
      return false;
    }
  },

  /**
   * Получить предложения имен команд
   */
  async getTeamNameSuggestions(baseName: string): Promise<string[]> {
    try {
      const response = await api.get('/teams/name-suggestions', {
        params: { baseName }
      });
      return response.data.suggestions;
    } catch {
      return [];
    }
  },

  /**
   * Валидировать данные команды
   */
  validateTeamData(data: CreateTeamData | UpdateTeamData): string[] {
    const errors: string[] = [];

    if ('name' in data && data.name) {
      if (data.name.length < 2) {
        errors.push('Название команды должно содержать минимум 2 символа');
      }
      if (data.name.length > 100) {
        errors.push('Название команды не должно превышать 100 символов');
      }
    }

    if ('description' in data && data.description && data.description.length > 500) {
      errors.push('Описание команды не должно превышать 500 символов');
    }

    if ('maxMembers' in data && data.maxMembers) {
      if (data.maxMembers < 1) {
        errors.push('Команда должна содержать минимум 1 участника');
      }
      if (data.maxMembers > 50) {
        errors.push('Команда не может содержать более 50 участников');
      }
    }

    return errors;
  },

  /**
   * Форматировать ошибки API
   */
  formatApiError(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Произошла неизвестная ошибка';
  }
};

export default teamsApi;