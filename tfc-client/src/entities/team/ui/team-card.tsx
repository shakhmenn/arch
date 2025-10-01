import React from 'react';
import { Team, TeamStatus, getTeamStatus, getTeamStatusDisplayName, formatTeamCapacity, isUserTeamLeader, isUserTeamMember } from '@shared/types/team';
import { Role } from '@shared/types/role';
import { User } from '@shared/types/user';
import { Badge } from '@shared/ui/badge';
import { Card } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Users, Crown, Calendar, Settings, UserPlus, UserMinus, Eye } from 'lucide-react';

interface TeamCardProps {
  team: Team;
  currentUser?: User;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onView?: (team: Team) => void;
  onEdit?: (team: Team) => void;
  onManageMembers?: (team: Team) => void;
  onJoinTeam?: (team: Team) => void;
  onLeaveTeam?: (team: Team) => void;
  className?: string;
}

const TeamCard: React.FC<TeamCardProps> = ({
  team,
  currentUser,
  variant = 'default',
  showActions = true,
  onView,
  onEdit,
  onManageMembers,
  onJoinTeam,
  onLeaveTeam,
  className = ''
}) => {
  const status = getTeamStatus(team);
  const isLeader = currentUser ? isUserTeamLeader(team, currentUser.id) : false;
  const isMember = currentUser ? isUserTeamMember(team, currentUser.id) : false;
  
  const canManage = currentUser && (
    currentUser.role === Role.ADMIN ||
    (currentUser.role === Role.TEAM_LEADER && isLeader)
  );
  
  const canJoin = currentUser && 
    currentUser.role === Role.USER && 
    !isMember && 
    status === TeamStatus.ACTIVE;
  
  const canLeave = currentUser && isMember && !isLeader;

  const getStatusBadgeVariant = (status: TeamStatus) => {
    switch (status) {
      case TeamStatus.ACTIVE:
        return 'default';
      case TeamStatus.FULL:
        return 'secondary';
      case TeamStatus.NEEDS_LEADER:
        return 'destructive';
      case TeamStatus.INACTIVE:
        return 'outline';
      default:
        return 'outline';
    }
  };

  const renderCompactCard = () => (
    <Card className={`p-3 hover:shadow-sm transition-shadow ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-foreground truncate">{team.name}</h4>
              <Badge variant={getStatusBadgeVariant(status)} className="text-xs">
                {getTeamStatusDisplayName(status)}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {formatTeamCapacity(team)}
              </span>
              {team.leader && (
                <span className="flex items-center gap-1 truncate">
                  <Crown className="h-3 w-3" />
                  {team.leader.firstName} {team.leader.lastName}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {showActions && (
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView?.(team)}
              className="h-7 w-7 p-0"
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );

  const renderDetailedCard = () => (
    <Card className={`p-6 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xl font-semibold text-foreground">{team.name}</h3>
            <Badge variant={getStatusBadgeVariant(status)}>
              {getTeamStatusDisplayName(status)}
            </Badge>
            {isLeader && (
              <Badge variant="outline" className="text-xs">
                Вы лидер
              </Badge>
            )}
            {isMember && !isLeader && (
              <Badge variant="outline" className="text-xs">
                Участник
              </Badge>
            )}
          </div>
          
          {team.description && (
            <p className="text-muted-foreground mb-4">
              {team.description}
            </p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">{formatTeamCapacity(team)}</span>
                <span className="text-muted-foreground"> участников</span>
              </span>
            </div>
            
            {team.leader && (
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">{team.leader.firstName} {team.leader.lastName}</span>
                  <span className="text-muted-foreground"> (лидер)</span>
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Создана {new Date(team.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          {team.members && team.members.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Участники команды:</h4>
              <div className="flex flex-wrap gap-2">
                {team.members.slice(0, 5).map((member) => (
                  <Badge key={member.id} variant="outline" className="text-xs">
                    {member.name} {member.surname}
                    {member.id === team.leaderId && ' (лидер)'}
                  </Badge>
                ))}
                {team.members.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{team.members.length - 5} еще
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showActions && (
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView?.(team)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Подробнее
          </Button>
          
          {canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(team)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Настройки
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onManageMembers?.(team)}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Участники
              </Button>
            </>
          )}
          
          {canJoin && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onJoinTeam?.(team)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Присоединиться
            </Button>
          )}
          
          {canLeave && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onLeaveTeam?.(team)}
              className="flex items-center gap-2"
            >
              <UserMinus className="h-4 w-4" />
              Покинуть
            </Button>
          )}
        </div>
      )}
    </Card>
  );

  const renderDefaultCard = () => (
    <Card className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1" onClick={() => onView?.(team)}>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-foreground">{team.name}</h3>
            <Badge variant={getStatusBadgeVariant(status)}>
              {getTeamStatusDisplayName(status)}
            </Badge>
            {isLeader && (
              <Badge variant="outline" className="text-xs">
                Лидер
              </Badge>
            )}
            {isMember && !isLeader && (
              <Badge variant="outline" className="text-xs">
                Участник
              </Badge>
            )}
          </div>
          
          {team.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {team.description}
            </p>
          )}
        </div>
        
        {showActions && canManage && (
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(team);
              }}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onManageMembers?.(team);
              }}
              className="h-8 w-8 p-0"
            >
              <Users className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{formatTeamCapacity(team)}</span>
          </div>
          
          {team.leader && (
            <div className="flex items-center gap-1">
              <Crown className="h-4 w-4" />
              <span>{team.leader.name} {team.leader.surname}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(team.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        {showActions && (canJoin || canLeave) && (
          <div className="flex gap-2">
            {canJoin && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onJoinTeam?.(team);
                }}
                className="h-7 text-xs"
              >
                Присоединиться
              </Button>
            )}
            {canLeave && (
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onLeaveTeam?.(team);
                }}
                className="h-7 text-xs"
              >
                Покинуть
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  switch (variant) {
    case 'compact':
      return renderCompactCard();
    case 'detailed':
      return renderDetailedCard();
    default:
      return renderDefaultCard();
  }
};

export default TeamCard;