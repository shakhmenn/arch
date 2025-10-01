import { FC, useState } from 'react';
import { 
  useTeamsQuery, 
  useTeamQuery,
  useCreateTeamMutation, 
  useUpdateTeamMutation,
  useAvailableUsersQuery,
  useAddMemberMutation,
  useRemoveMemberMutation,
  useAssignLeaderMutation,
  useRemoveLeaderMutation
} from '@/features/teams';
import { toast } from 'sonner';
import { useUserStore } from '@entities/user/model/slice';
import { TeamsList } from '@entities/team/ui';
import { TeamMembersManager } from '@features/teams/ui';
import CreateTeamModal from '@features/teams/ui/CreateTeamModal';
import TeamEditModal from '@features/teams/ui/TeamEditModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { Users, Plus, Settings, BarChart3 } from 'lucide-react';
import { CreateTeamData, UpdateTeamData, Team } from '@shared/types/team';

const OrganizerTeamsPage: FC = () => {
  const { data: teams, isLoading, refetch } = useTeamsQuery();
  const { data: users, isLoading: isUsersLoading } = useAvailableUsersQuery();
  const { data: user } = useUserStore();
  const createTeamMutation = useCreateTeamMutation();
  const updateTeamMutation = useUpdateTeamMutation();
  const addMemberMutation = useAddMemberMutation();
  const removeMemberMutation = useRemoveMemberMutation();
  const assignLeaderMutation = useAssignLeaderMutation();
  const removeLeaderMutation = useRemoveLeaderMutation();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const { data: selectedTeam, refetch: refetchSelectedTeam } = useTeamQuery(selectedTeamId || undefined);
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);

  const handleCreateTeam = async (data: CreateTeamData) => {
    try {
      await createTeamMutation.mutateAsync(data);
      await refetch();
      setActiveTab('teams');
    } catch (error) {
      console.error('Ошибка создания команды:', error);
      throw error;
    }
  };

  const handleUpdateTeam = async (teamId: number, data: UpdateTeamData) => {
    try {
      await updateTeamMutation.mutateAsync({ teamId, data });
      await refetch();
    } catch (error) {
      console.error('Ошибка при обновлении команды:', error);
      throw error;
    }
  };

  const handleTeamSelect = (team: Team) => {
    setSelectedTeamId(team.id);
    setActiveTab('management');
  };

  const handleEditTeam = (team: Team) => {
    setTeamToEdit(team);
    setIsEditModalOpen(true);
  };

  const handleManageMembers = (team: Team) => {
    setSelectedTeamId(team.id);
    setActiveTab('management');
  };

  const handleAddMember = async (data: { userId: number }) => {
    if (!selectedTeamId) return;
    try {
      await addMemberMutation.mutateAsync({ teamId: selectedTeamId, userId: data.userId });
      await Promise.all([refetch(), refetchSelectedTeam()]);
      toast.success('Участник успешно добавлен в команду');
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('уже состоит в активной команде')) {
        toast.warning('Пользователь уже состоит в другой команде');
      } else {
        toast.error('Не удалось добавить участника в команду');
        console.error('Ошибка добавления участника:', error);
      }
      throw error;
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!selectedTeamId) return;
    try {
      await removeMemberMutation.mutateAsync({ teamId: selectedTeamId, userId });
      await Promise.all([refetch(), refetchSelectedTeam()]);
      toast.success('Участник удален из команды');
    } catch (error) {
      toast.error('Не удалось удалить участника из команды');
      console.error('Ошибка удаления участника:', error);
      throw error;
    }
  };

  const handleAssignLeader = async (userId: number) => {
    if (!selectedTeamId) return;
    try {
      await assignLeaderMutation.mutateAsync({ teamId: selectedTeamId, leaderId: userId });
      await Promise.all([refetch(), refetchSelectedTeam()]);
      toast.success('Лидер команды назначен');
    } catch (error) {
      toast.error('Не удалось назначить лидера команды');
      console.error('Ошибка назначения лидера:', error);
      throw error;
    }
  };

  const handleRemoveLeader = async () => {
    if (!selectedTeamId) return;
    try {
      await removeLeaderMutation.mutateAsync({ teamId: selectedTeamId });
      await Promise.all([refetch(), refetchSelectedTeam()]);
      toast.success('Лидер команды снят с поста');
    } catch (error) {
      toast.error('Не удалось снять лидера команды');
      console.error('Ошибка снятия лидера:', error);
      throw error;
    }
  };

  // Проверяем права доступа
  const allowedRoles = ['SUPER_ORGANIZER', 'ORGANIZER', 'TEAM_LEADER'];
  if (!user?.role || !allowedRoles.includes(user.role)) {
    return (
      <div className="py-8 px-4 md:px-8">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Доступ запрещен</h2>
          <p className="text-muted-foreground">У вас нет прав для просмотра этой страницы.</p>
        </div>
      </div>
    );
  }

  const teamStats = {
    total: teams?.length || 0,
    totalMembers: teams?.reduce((acc, team) => acc + (team.members?.length || 0), 0) || 0,
    averageSize: teams?.length ? Math.round((teams.reduce((acc, team) => acc + (team.members?.length || 0), 0) / teams.length) * 10) / 10 : 0
  };

  return (
    <div className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Управление командами</h1>
            <p className="text-muted-foreground">
              Создавайте команды, управляйте участниками и отслеживайте прогресс
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Создать команду
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Обзор
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Команды
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
                <CardTitle className="text-sm font-medium">Всего команд</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? 'Загрузка...' : 'Активных команд в системе'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего участников</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamStats.totalMembers}</div>
                <p className="text-xs text-muted-foreground">
                  Участников во всех командах
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Средний размер</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamStats.averageSize}</div>
                <p className="text-xs text-muted-foreground">
                  Участников на команду
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Последние команды</CardTitle>
              <CardDescription>
                Недавно созданные или обновленные команды
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamsList 
                teams={teams?.slice(0, 5) || []} 
                currentUserRole={user?.role || 'ENTREPRENEUR'}
                isLoading={isLoading}
                onTeamClick={handleTeamSelect}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Все команды</h2>
              <p className="text-muted-foreground">Управление всеми командами организации</p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Создать команду
            </Button>
          </div>

          <TeamsList
              teams={teams || []}
              currentUserRole={user?.role || 'ENTREPRENEUR'}
              isLoading={isLoading}
              onTeamClick={handleTeamSelect}
              onEditTeam={handleEditTeam}
              onManageMembers={handleManageMembers}
            />
        </TabsContent>



        <TabsContent value="management" className="space-y-6">
          {selectedTeam ? (
            <div>
              <div className="flex items-center justify-end mb-6">
                <Button 
                  variant="outline" 
                  onClick={() => { setSelectedTeamId(null); }}
                >
                  Назад к списку
                </Button>
              </div>
              
              <TeamMembersManager 
                team={selectedTeam} 
                currentUser={user}
                availableUsers={users || []}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
                onAssignLeader={handleAssignLeader}
                onRemoveLeader={handleRemoveLeader}
                isLoading={isUsersLoading || addMemberMutation.isPending || removeMemberMutation.isPending || assignLeaderMutation.isPending || removeLeaderMutation.isPending}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Выберите команду</h3>
              <p className="text-muted-foreground mb-4">
                Выберите команду из списка для управления участниками
              </p>
              <Button onClick={() => { setActiveTab('teams'); }}>
                Перейти к командам
              </Button>
            </div>
          )}
        </TabsContent></Tabs>

        {/* Модальные окна */}
        <CreateTeamModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSubmit={handleCreateTeam}
          isLoading={createTeamMutation.isPending}
        />

        <TeamEditModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          team={teamToEdit}
          onSubmit={handleUpdateTeam}
          isLoading={updateTeamMutation.isPending}
        />
      </div>
    </div>
  );
};

export default OrganizerTeamsPage;