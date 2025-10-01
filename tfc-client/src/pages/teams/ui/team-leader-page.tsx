import { FC, useState } from 'react';
import { useTeamsQuery, useTeamQuery } from '@features/teams/api/teams-api';
import { useUserStore } from '@entities/user/model/slice';
import { TeamCard } from '@entities/team/ui';
import { TeamMembersManager } from '@features/teams/ui';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { Users, Settings, BarChart3, Crown } from 'lucide-react';
import { getUserFullName } from '@/shared/types/user';

const TeamLeaderPage: FC = () => {
  const { data: teams, isLoading: isTeamsLoading, isError: isTeamsError } = useTeamsQuery();
  const { data: user } = useUserStore();
  const [activeTab, setActiveTab] = useState('overview');

  // Проверяем права доступа
  if (user?.role !== 'TEAM_LEADER') {
    return (
      <div className="py-8 px-4 md:px-8">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Доступ запрещен</h2>
          <p className="text-muted-foreground">У вас нет прав для просмотра этой страницы.</p>
        </div>
      </div>
    );
  }

  // Находим команду, где пользователь является лидером
  const myTeam = teams?.find(team => 
    team.leaderId === user?.id
  );

  const { data: teamDetails, isLoading: isTeamLoading, isError: isTeamError, refetch } = useTeamQuery(
    myTeam?.id
  );

  if (isTeamsLoading) {
    return (
      <div className="py-8 px-4 md:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Загрузка команды...</p>
        </div>
      </div>
    );
  }

  if (isTeamsError || !myTeam) {
    return (
      <div className="py-8 px-4 md:px-8">
        <div className="bg-muted/50 border rounded-lg p-6 text-center">
          <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Команда не найдена</h2>
          <p className="text-muted-foreground mb-4">
            Вы не являетесь лидером ни одной команды или команда еще не создана.
          </p>
          <p className="text-sm text-muted-foreground">
            Обратитесь к организатору для назначения лидером команды.
          </p>
        </div>
      </div>
    );
  }

  const teamStats = {
    totalMembers: teamDetails?.members?.length || 0,
    activeMembers: teamDetails?.members?.length || 0, // Все участники считаются активными
    pendingInvites: 0 // TODO: добавить когда будет API для приглашений
  };

  return (
    <div className="py-8 px-4 md:px-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Управление командой</h1>
        </div>
        <p className="text-muted-foreground">Управление вашей командой: {myTeam.name}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Обзор
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Команда
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Управление
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Участников</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamStats.totalMembers}</div>
                <p className="text-xs text-muted-foreground">
                  {isTeamLoading ? 'Загрузка...' : 'Всего в команде'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Активных</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamStats.activeMembers}</div>
                <p className="text-xs text-muted-foreground">
                  Активных участников
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Приглашений</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamStats.pendingInvites}</div>
                <p className="text-xs text-muted-foreground">
                  Ожидают ответа
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Информация о команде</CardTitle>
              <CardDescription>
                Основная информация о вашей команде
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isTeamLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Загрузка информации о команде...</p>
                </div>
              ) : isTeamError ? (
                <div className="text-center py-8">
                  <p className="text-destructive mb-2">Ошибка загрузки команды</p>
                  <Button variant="outline" onClick={() => void refetch()}>
                    Повторить
                  </Button>
                </div>
              ) : teamDetails ? (
                <TeamCard 
                  team={teamDetails} 
                  variant="detailed" 
                  showActions={false}
                />
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Участники команды</h2>
            <p className="text-muted-foreground mb-6">
              Просмотр всех участников вашей команды
            </p>
            
            {isTeamLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Загрузка участников...</p>
              </div>
            ) : isTeamError ? (
              <div className="text-center py-8">
                <p className="text-destructive mb-2">Ошибка загрузки участников</p>
                <Button variant="outline" onClick={() => void refetch()}>
                  Повторить
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {teamDetails?.members?.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{getUserFullName(member)}</div>
                            <div className="text-sm text-muted-foreground">{member.phone}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{member.role}</div>
                          {member.id === teamDetails?.leaderId && (
                            <Crown className="h-4 w-4 text-primary ml-auto" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Управление участниками</h2>
            <p className="text-muted-foreground mb-6">
              Добавление, удаление и управление участниками команды
            </p>
            
            {myTeam && (
              <TeamMembersManager 
                team={myTeam}
                currentUser={user}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamLeaderPage;