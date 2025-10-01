import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { Calendar } from '@/shared/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/shared/ui/command';
import {
  X,
  Calendar as CalendarIcon,
  Users,
  Building,
  Tag,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import type { TaskFilters } from '@entities/task/model/types';
import { useTeamQuery } from '@/features/teams/api/teams-api';
import { useTeamsQuery } from '@/features/teams/api/teams-api';

interface TaskFiltersPanelProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  className?: string;
}

const TASK_STATUSES = [
  { value: 'TODO', label: 'К выполнению' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'REVIEW', label: 'На проверке' },
  { value: 'COMPLETED', label: 'Завершено' },
  { value: 'BLOCKED', label: 'Заблокировано' },
];

const TASK_PRIORITIES = [
  { value: 'HIGH', label: 'Высокий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'LOW', label: 'Низкий' },
];

export const TaskFiltersPanel: React.FC<TaskFiltersPanelProps> = ({
  filters,
  onFiltersChange,
  className,
}) => {
  const [dueDateFromOpen, setDueDateFromOpen] = useState(false);
  const [dueDateToOpen, setDueDateToOpen] = useState(false);
  const [createdFromOpen, setCreatedFromOpen] = useState(false);
  const [createdToOpen, setCreatedToOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  const { data: teamsData } = useTeamsQuery({ page: 1, limit: 100 });
  const { data: teamData } = useTeamQuery(filters.teamId || undefined);
  const membersData = teamData?.members || [];
  
  const teams = teamsData?.teams || [];
  const members = membersData || [];
  
  const updateFilters = (updates: Partial<TaskFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };
  
  const clearFilters = () => {
    onFiltersChange({});
  };
  
  const addTag = (tag: string) => {
    if (tag && !filters.tags?.includes(tag)) {
      updateFilters({
        tags: [...(filters.tags || []), tag]
      });
    }
    setTagInput('');
  };
  
  const removeTag = (tagToRemove: string) => {
    updateFilters({
      tags: filters.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };
  
  const toggleStatus = (status: string) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    updateFilters({ status: newStatuses.length > 0 ? newStatuses : undefined });
  };
  
  const togglePriority = (priority: string) => {
    const currentPriorities = filters.priority || [];
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority];
    
    updateFilters({ priority: newPriorities.length > 0 ? newPriorities : undefined });
  };
  
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.priority?.length) count++;
    if (filters.assigneeId) count++;
    if (filters.teamId) count++;
    if (filters.projectId) count++;
    if (filters.dueDateFrom || filters.dueDateTo) count++;
    if (filters.createdFrom || filters.createdTo) count++;
    if (filters.tags?.length) count++;
    if (filters.hasSubtasks !== undefined) count++;
    if (filters.hasDependencies !== undefined) count++;
    if (filters.isOverdue) count++;
    return count;
  };
  
  const activeFiltersCount = getActiveFiltersCount();
  
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Фильтры
            </CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Сбросить
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Статус</Label>
          <div className="flex flex-wrap gap-2">
            {TASK_STATUSES.map((status) => (
              <div key={status.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status.value}`}
                  checked={filters.status?.includes(status.value) || false}
                  onCheckedChange={() => toggleStatus(status.value)}
                />
                <Label
                  htmlFor={`status-${status.value}`}
                  className="text-sm cursor-pointer"
                >
                  {status.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Priority Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Приоритет</Label>
          <div className="flex flex-wrap gap-2">
            {TASK_PRIORITIES.map((priority) => (
              <div key={priority.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`priority-${priority.value}`}
                  checked={filters.priority?.includes(priority.value) || false}
                  onCheckedChange={() => togglePriority(priority.value)}
                />
                <Label
                  htmlFor={`priority-${priority.value}`}
                  className="text-sm cursor-pointer"
                >
                  {priority.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Assignee Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Исполнитель</Label>
          <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={assigneeOpen}
                className="w-full justify-between"
              >
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  {filters.assigneeId
                    ? members.find(m => m.id === filters.assigneeId)?.user.name || 'Выбран'
                    : 'Выберите исполнителя'
                  }
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Поиск исполнителя..." />
                <CommandEmpty>Исполнитель не найден</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      updateFilters({ assigneeId: undefined });
                      setAssigneeOpen(false);
                    }}
                  >
                    Все исполнители
                  </CommandItem>
                  {members.map((member) => (
                    <CommandItem
                      key={member.id}
                      onSelect={() => {
                        updateFilters({ assigneeId: member.user.id });
                        setAssigneeOpen(false);
                      }}
                    >
                      {member.user.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Team Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Команда</Label>
          <Popover open={teamOpen} onOpenChange={setTeamOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={teamOpen}
                className="w-full justify-between"
              >
                <div className="flex items-center">
                  <Building className="mr-2 h-4 w-4" />
                  {filters.teamId
                    ? teams.find(t => t.id === filters.teamId)?.name || 'Выбрана'
                    : 'Выберите команду'
                  }
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Поиск команды..." />
                <CommandEmpty>Команда не найдена</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      updateFilters({ teamId: undefined });
                      setTeamOpen(false);
                    }}
                  >
                    Все команды
                  </CommandItem>
                  {teams.map((team) => (
                    <CommandItem
                      key={team.id}
                      onSelect={() => {
                        updateFilters({ teamId: team.id });
                        setTeamOpen(false);
                      }}
                    >
                      {team.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Due Date Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Срок выполнения</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500">От</Label>
              <Popover open={dueDateFromOpen} onOpenChange={setDueDateFromOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dueDateFrom
                      ? format(new Date(filters.dueDateFrom), 'dd.MM.yyyy', { locale: ru })
                      : 'Выберите дату'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dueDateFrom ? new Date(filters.dueDateFrom) : undefined}
                    onSelect={(date) => {
                      updateFilters({ dueDateFrom: date?.toISOString() });
                      setDueDateFromOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label className="text-xs text-gray-500">До</Label>
              <Popover open={dueDateToOpen} onOpenChange={setDueDateToOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dueDateTo
                      ? format(new Date(filters.dueDateTo), 'dd.MM.yyyy', { locale: ru })
                      : 'Выберите дату'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dueDateTo ? new Date(filters.dueDateTo) : undefined}
                    onSelect={(date) => {
                      updateFilters({ dueDateTo: date?.toISOString() });
                      setDueDateToOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        {/* Created Date Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Дата создания</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500">От</Label>
              <Popover open={createdFromOpen} onOpenChange={setCreatedFromOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.createdFrom
                      ? format(new Date(filters.createdFrom), 'dd.MM.yyyy', { locale: ru })
                      : 'Выберите дату'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.createdFrom ? new Date(filters.createdFrom) : undefined}
                    onSelect={(date) => {
                      updateFilters({ createdFrom: date?.toISOString() });
                      setCreatedFromOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label className="text-xs text-gray-500">До</Label>
              <Popover open={createdToOpen} onOpenChange={setCreatedToOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.createdTo
                      ? format(new Date(filters.createdTo), 'dd.MM.yyyy', { locale: ru })
                      : 'Выберите дату'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.createdTo ? new Date(filters.createdTo) : undefined}
                    onSelect={(date) => {
                      updateFilters({ createdTo: date?.toISOString() });
                      setCreatedToOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        {/* Tags Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Теги</Label>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Добавить тег..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={() => addTag(tagInput)}
              disabled={!tagInput}
            >
              <Tag className="h-4 w-4" />
            </Button>
          </div>
          
          {filters.tags && filters.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeTag(tag)}
                >
                  {tag}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* Additional Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Дополнительные фильтры</Label>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasSubtasks"
              checked={filters.hasSubtasks === true}
              onCheckedChange={(checked) => {
                updateFilters({ hasSubtasks: checked ? true : undefined });
              }}
            />
            <Label htmlFor="hasSubtasks" className="text-sm cursor-pointer">
              Имеет подзадачи
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasDependencies"
              checked={filters.hasDependencies === true}
              onCheckedChange={(checked) => {
                updateFilters({ hasDependencies: checked ? true : undefined });
              }}
            />
            <Label htmlFor="hasDependencies" className="text-sm cursor-pointer">
              Имеет зависимости
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isOverdue"
              checked={filters.isOverdue === true}
              onCheckedChange={(checked) => {
                updateFilters({ isOverdue: checked ? true : undefined });
              }}
            />
            <Label htmlFor="isOverdue" className="text-sm cursor-pointer">
              Просроченные
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};