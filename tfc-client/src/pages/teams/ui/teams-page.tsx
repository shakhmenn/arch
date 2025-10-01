import React from 'react';
import { useUserStore } from '@entities/user/model/slice';
import { useUserActiveTeamQuery } from '@/features/teams/api/teams-api';
import { useTeamsQuery, useCreateTeamMutation } from '@/features/teams/api/teams-api';
import CreateTeamForm from '@/features/teams/ui/create-team-form';
import TeamsList from '@/entities/team/ui/teams-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import { Users, Crown, Phone, Calendar, UserCheck } from 'lucide-react';
import { Role } from '@/shared/types/role';
import { getUserFullName } from '@/shared/types/user';
import { CreateTeamData } from '@/shared/types/team';

const TeamsPage: React.FC = () => {
  const { data: user } = useUserStore();
  const isUser = user?.role === Role.USER;

  // Для предпринимателей используем специальный хук
  const { 
    data: teamDetails, 
    isLoading: isTeamLoading, 
    isError: isTeamError 
  } = useUserActiveTeamQuery(user?.id);

  // Для остальных ролей используем обычный список команд
  const { 
    data: teams, 
    isLoading
  } = useTeamsQuery();

  const createTeamMutation = useCreateTeamMutation();

  const handleCreateTeam = async (data: CreateTeamData) => {
    try {
      await createTeamMutation.mutateAsync(data);
    } catch (error) {
      console.error('Ошибка создания команды:', error);
    }
  };

  // Отображение для предпринимателей
  if (isEntrepreneur) {
    if (isTeamLoading) {
      return (
        <div className="py-8 px-4 md:px-8 max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Моя команда</h1>
            <p className="text-muted-foreground">Загрузка информации о команде...</p>
          </div>
        </div>
      );
    }

    if (isTeamError || !teamDetails) {
      return (
        <div className="py-8 px-4 md:px-8 max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Моя команда</h1>
            <p className="text-muted-foreground">У вас пока нет активной команды</p>
          </div>
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Команда не найдена</h3>
            <p className="text-muted-foreground mb-6">
              Обратитесь к организатору или лидеру команды для добавления в команду.
            </p>
          </div>
        </div>
      );
    }

    // Обрабатываем структуру данных members
    const teamMembers = teamDetails?.members?.filter(member => member.role !== Role.TEAM_LEADER) || [];
    const teamLeader = teamDetails?.members?.find(member => member.role === Role.TEAM_LEADER);

    return (
      <div className="py-8 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Моя команда</h1>
          <p className="text-muted-foreground">Информация о вашей команде и участниках</p>
        </div>

        <div className="space-y-6">
          {/* Информация о команде */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Информация о команде
              </CardTitle>
              <CardDescription>
                Основные данные вашей команды
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-2">{teamDetails.name}</h3>
                  {teamDetails.description && (
                    <p className="text-muted-foreground mb-4">{teamDetails.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Создано: {new Date(teamDetails.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Участников: {teamDetails.members?.length || 0}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Лидер команды */}
          {teamLeader && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Лидер команды
                </CardTitle>
                <CardDescription>
                  Контактная информация лидера команды
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{getUserFullName(teamLeader)}</div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {teamLeader.phone}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Участники команды */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Участники команды
              </CardTitle>
              <CardDescription>
                Все участники вашей команды
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamMembers.length > 0 ? (
                <div className="grid gap-3">
                  {teamMembers.map((member) => (
                    <div 
                      key={member.id} 
                      className={`flex items-center gap-4 p-3 rounded-lg border ${
                        member.id === user?.id 
                          ? 'bg-primary/5 border-primary/20' 
                          : 'bg-muted/30 border-border'
                      }`}
                    >
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {getUserFullName(member)}
                          {member.id === user?.id && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              Это вы
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.role === 'ENTREPRENEUR' ? 'Предприниматель' : member.role}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">В команде пока нет других участников</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Статистика команды */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего участников</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamDetails?.members?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Включая лидера команды
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Дата создания</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {teamDetails ? new Date(teamDetails.createdAt).toLocaleDateString() : '-'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Команда существует {teamDetails ? Math.ceil((Date.now() - new Date(teamDetails.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0} дней
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-8">
      <h2 className="text-3xl font-bold mb-6 text-foreground">Управление командами</h2>
      
      <div className="space-y-6">
        <CreateTeamForm onSubmit={handleCreateTeam} isLoading={createTeamMutation.isPending} />
        <TeamsList 
          teams={teams || []} 
          currentUserRole={user?.role || Role.USER}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default TeamsPage;
