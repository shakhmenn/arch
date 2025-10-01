import React from 'react';
import { Team, TeamStatus, getTeamStatus, getTeamStatusDisplayName, formatTeamCapacity } from '@shared/types/team';
import { Role } from '@shared/types/role';
import { Badge } from '@shared/ui/badge';
import { Card } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Users, Crown, Calendar, Settings } from 'lucide-react';

interface TeamsListProps {
  teams: Team[];
  currentUserRole: Role;
  onTeamClick?: (team: Team) => void;
  onEditTeam?: (team: Team) => void;
  onManageMembers?: (team: Team) => void;
  isLoading?: boolean;
  className?: string;
}

interface TeamCardProps {
  team: Team;
  currentUserRole: Role;
  onTeamClick?: (team: Team) => void;
  onEditTeam?: (team: Team) => void;
  onManageMembers?: (team: Team) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({
  team,
  currentUserRole,
  onTeamClick,
  onEditTeam,
  onManageMembers
}) => {
  const status = getTeamStatus(team);
  const canManage = currentUserRole === Role.ADMIN ||
                   (currentUserRole === Role.TEAM_LEADER && team.leader?.id);

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

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1" onClick={() => onTeamClick?.(team)}>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-foreground">{team.name}</h3>
            <Badge variant={getStatusBadgeVariant(status)}>
              {getTeamStatusDisplayName(status)}
            </Badge>
          </div>
          
          {team.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {team.description}
            </p>
          )}
        </div>
        
        {canManage && (
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEditTeam?.(team);
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
      </div>
    </Card>
  );
};

const TeamsList: React.FC<TeamsListProps> = ({
  teams,
  currentUserRole,
  onTeamClick,
  onEditTeam,
  onManageMembers,
  isLoading = false,
  className = ''
}) => {
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="p-4 animate-pulse">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 bg-muted rounded w-32"></div>
                  <div className="h-5 bg-muted rounded w-16"></div>
                </div>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-4 bg-muted rounded w-16"></div>
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 bg-muted rounded w-20"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Команды не найдены
        </h3>
        <p className="text-muted-foreground">
          {currentUserRole === Role.USER 
            ? 'Вы пока не состоите ни в одной команде. Обратитесь к администратору.'
            : 'Создайте первую команду для начала работы.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          currentUserRole={currentUserRole}
          onTeamClick={onTeamClick}
          onEditTeam={onEditTeam}
          onManageMembers={onManageMembers}
        />
      ))}
    </div>
  );
};

export default TeamsList;
export { TeamCard };