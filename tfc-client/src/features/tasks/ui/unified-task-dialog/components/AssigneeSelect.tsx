import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { User } from 'lucide-react';
import { AssigneeSelectProps, TeamMember } from '../types';
import { useTeamMembers } from '../hooks/useTeamMembers';

export const AssigneeSelect: React.FC<AssigneeSelectProps> = ({
  value,
  onValueChange,
  teamId,
  placeholder = 'Выберите исполнителя',
  disabled = false,
}) => {
  const { data: teamMembers, isLoading } = useTeamMembers(teamId);

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === 'none') {
      onValueChange(undefined);
    } else {
      onValueChange(parseInt(selectedValue, 10));
    }
  };

  const selectedMember = teamMembers?.find(member => member.id === value);

  return (
    <Select
      value={value ? value.toString() : 'none'}
      onValueChange={handleValueChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          {selectedMember ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedMember.avatar} alt={selectedMember.name} />
                <AvatarFallback className="text-xs">
                  {selectedMember.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>{selectedMember.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{placeholder}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Не назначен</span>
          </div>
        </SelectItem>
        {teamMembers?.map((member) => (
          <SelectItem key={member.id} value={member.id.toString()}>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback className="text-xs">
                  {member.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span>{member.name}</span>
                {member.email && (
                  <span className="text-xs text-muted-foreground">{member.email}</span>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};