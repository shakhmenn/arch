import React, { useState } from 'react';
import { Team, AddMemberData } from '@shared/types/team';
import { User, getUserFullName, getUserInitials } from '@shared/types/user';
import { Role } from '@shared/types/role';
import { toast } from 'sonner';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Card } from '@shared/ui/card';
import { Badge } from '@shared/ui/badge';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Crown, 
  Mail, 
  Phone,
  X
} from 'lucide-react';

interface TeamMembersManagerProps {
  team: Team;
  currentUser?: User;
  availableUsers?: User[];
  onAddMember?: (data: AddMemberData) => Promise<void> | void;
  onRemoveMember?: (userId: number) => Promise<void> | void;
  onAssignLeader?: (userId: number) => Promise<void> | void;
  onRemoveLeader?: () => Promise<void> | void;
  onInviteByEmail?: (email: string) => Promise<void> | void;
  isLoading?: boolean;
  className?: string;
}

interface MemberCardProps {
  member: User;
  team: Team;
  currentUser?: User;
  onRemove?: (userId: number) => void;
  onAssignLeader?: (userId: number) => void;
  onRemoveLeader?: () => void;
  isLoading?: boolean;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  team,
  currentUser,
  onRemove,
  onAssignLeader,
  onRemoveLeader,
  isLoading = false
}) => {
  // Защитная проверка на существование team и member
  if (!team || !member) {
    return null;
  }

  const isLeader = member.id === team.leaderId;
  const isCurrentUser = currentUser?.id === member.id;
  const canManage = currentUser && (
    currentUser.role === Role.ADMIN ||
    (currentUser.role === Role.TEAM_LEADER && currentUser.id === team.leaderId)
  );
  const canRemove = canManage && (!isLeader || isCurrentUser); // Разрешаем удаление лидера или самоудаление
  const canAssignLeader = canManage && !isLeader && member;
  const canRemoveLeader = canManage && isLeader && onRemoveLeader;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Аватар */}
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
            {getUserInitials(member)}
          </div>
          
          {/* Информация о пользователе */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-foreground">
                {getUserFullName(member)}
              </h4>
              {isLeader && (
                <Badge variant="default" className="text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  Лидер
                </Badge>
              )}
              {isCurrentUser && (
                <Badge variant="outline" className="text-xs">
                  Это вы
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground mb-2">
              {member?.role && (
                <Badge variant="outline" className="text-xs mr-2">
                  {member.role}
                </Badge>
              )}
              Участник команды
            </div>
            
            {/* Контактная информация */}
            <div className="space-y-1">
              {member?.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{member.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Действия */}
        {canManage && (canRemove || canAssignLeader || canRemoveLeader) && (
          <div className="flex gap-1 ml-2">
            {canAssignLeader && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAssignLeader?.(member.id)}
                disabled={isLoading}
                className="h-8 w-8 p-0"
                title="Назначить лидером"
              >
                <Crown className="h-4 w-4" />
              </Button>
            )}
            {canRemoveLeader && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveLeader?.()}
                disabled={isLoading}
                className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                title="Снять с поста лидера"
              >
                <Crown className="h-4 w-4" />
              </Button>
            )}
            {canRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove?.(member.id)}
                disabled={isLoading}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                title={isCurrentUser ? "Покинуть команду" : "Удалить из команды"}
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

const TeamMembersManager: React.FC<TeamMembersManagerProps> = ({
  team,
  currentUser,
  availableUsers = [],
  onAddMember,
  onRemoveMember,
  onAssignLeader,
  onRemoveLeader,
  onInviteByEmail,
  isLoading = false,
  className = ''
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);



  // Защитная проверка на существование team
  if (!team) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Команда не найдена
          </h3>
          <p className="text-muted-foreground">
            Информация о команде недоступна
          </p>
        </Card>
      </div>
    );
  }

  const canManage = currentUser && (
    currentUser.role === Role.ADMIN ||
    (currentUser.role === Role.TEAM_LEADER && currentUser.id === team.leaderId)
  );

  // Все участники команды
  const filteredMembers = team.members || [];

  // Пользователи, которых можно добавить (уже отфильтрованы на сервере)
  const usersToAdd = availableUsers || [];

  const handleAddMember = async () => {
    if (!selectedUserId || !onAddMember) return;
    
    setIsSubmitting(true);
    try {
      await onAddMember({ userId: parseInt(selectedUserId) });
      setSelectedUserId('');
      toast.success('Участник успешно добавлен в команду');
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('уже состоит в активной команде')) {
        toast.warning('Пользователь уже состоит в другой команде');
      } else {
        toast.error('Не удалось добавить участника в команду');
        console.error('Ошибка добавления участника:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim() || !onInviteByEmail) return;
    
    setIsSubmitting(true);
    try {
      await onInviteByEmail(inviteEmail.trim());
      setInviteEmail('');
      setShowInviteForm(false);
      toast.success('Приглашение отправлено');
    } catch (error) {
      toast.error('Не удалось отправить приглашение');
      console.error('Ошибка отправки приглашения:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!onRemoveMember) return;
    
    setIsSubmitting(true);
    try {
      await onRemoveMember(userId);
      toast.success('Участник удален из команды');
    } catch (error) {
      toast.error('Не удалось удалить участника из команды');
      console.error('Ошибка удаления участника:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignLeader = async (userId: number) => {
    if (!onAssignLeader) return;
    
    setIsSubmitting(true);
    try {
      await onAssignLeader(userId);
      toast.success('Лидер команды назначен');
    } catch (error) {
      toast.error('Не удалось назначить лидера команды');
      console.error('Ошибка назначения лидера:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveLeader = async () => {
    if (!onRemoveLeader) return;
    
    setIsSubmitting(true);
    try {
      await onRemoveLeader();
      toast.success('Лидер команды снят с поста');
    } catch (error) {
      toast.error('Не удалось снять лидера команды');
      console.error('Ошибка снятия лидера:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            Участники команды "{team.name}"
          </h2>
          <Badge variant="outline">
            {team.members?.length || 0}/{team.maxMembers}
          </Badge>
        </div>
      </div>



      {/* Добавление участников */}
      {canManage && (
        <Card className="p-4">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Добавить участников
          </h3>
          
          <div className="space-y-4">
            {/* Добавление существующих пользователей */}
            {usersToAdd.length > 0 && (
              <div className="flex gap-2">
                <select
                  value={selectedUserId}
                  onChange={(e) => { setSelectedUserId(e.target.value); }}
                  className="flex-1 p-2 rounded-md border bg-background text-foreground"
                  disabled={isLoading || isSubmitting}
                >
                  <option value="">Выберите пользователя</option>
                  {usersToAdd.map((user) => (
                    <option key={user.id} value={user.id}>
                      {getUserFullName(user)}{user.phone ? ` - ${user.phone}` : ''}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleAddMember}
                  disabled={!selectedUserId || isLoading || isSubmitting}
                >
                  {isSubmitting ? 'Добавление...' : 'Добавить'}
                </Button>
              </div>
            )}
            
            {/* Приглашение по email */}
            {onInviteByEmail && (
              <div>
                {!showInviteForm ? (
                  <Button
                    variant="outline"
                    onClick={() => { setShowInviteForm(true); }}
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Пригласить по email
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={inviteEmail}
                      onChange={(e) => { setInviteEmail(e.target.value); }}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleInviteByEmail}
                      disabled={!inviteEmail.trim() || isLoading || isSubmitting}
                    >
                      {isSubmitting ? 'Отправка...' : 'Отправить'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowInviteForm(false);
                        setInviteEmail('');
                      }}
                      className="h-10 w-10 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Список участников */}
      <div className="space-y-3">
        {filteredMembers.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              В команде пока нет участников
            </h3>
            <p className="text-muted-foreground">
              {canManage 
                ? 'Добавьте первых участников в команду'
                : 'Участники будут отображаться здесь'}
            </p>
          </Card>
        ) : (
          filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              team={team}
              currentUser={currentUser}
              onRemove={handleRemoveMember}
              onAssignLeader={handleAssignLeader}
              onRemoveLeader={handleRemoveLeader}
              isLoading={isLoading || isSubmitting}
            />
          ))
        )}
      </div>

      {/* Статистика */}
      <Card className="p-4">
        <h3 className="font-medium mb-3">Статистика команды</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Всего участников</div>
            <div className="text-lg font-semibold">{team.members?.length || 0}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Свободных мест</div>
            <div className="text-lg font-semibold">
              {team.maxMembers - (team.members?.length || 0)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Заполненность</div>
            <div className="text-lg font-semibold">
              {Math.round(((team.members?.length || 0) / team.maxMembers) * 100)}%
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Статус</div>
            <div className="text-lg font-semibold">
              {team.isActive ? 'Активна' : 'Неактивна'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TeamMembersManager;