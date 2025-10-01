import React from 'react';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { ChevronDown, Trash2, User, Flag } from 'lucide-react';

interface BulkActionsMenuProps {
  selectedCount: number;
  onStatusUpdate: (status: string) => void;
  onPriorityUpdate: (priority: string) => void;
  onAssigneeUpdate: (assigneeId: string | null) => void;
  onDelete: () => void;
  availableUsers?: Array<{ id: string; name: string; avatar?: string }>;
}

export const BulkActionsMenu: React.FC<BulkActionsMenuProps> = ({
  selectedCount,
  onStatusUpdate,
  onPriorityUpdate,
  onAssigneeUpdate,
  onDelete,
  availableUsers = []
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        Выбрано: {selectedCount}
      </span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Действия
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Массовые операции</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Status Updates */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Flag className="mr-2 h-4 w-4" />
              Изменить статус
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onStatusUpdate('todo')}>
                В работу
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusUpdate('in_progress')}>
                В процессе
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusUpdate('completed')}>
                Завершено
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusUpdate('cancelled')}>
                Отменено
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          {/* Priority Updates */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Flag className="mr-2 h-4 w-4" />
              Изменить приоритет
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onPriorityUpdate('low')}>
                Низкий
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPriorityUpdate('medium')}>
                Средний
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPriorityUpdate('high')}>
                Высокий
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPriorityUpdate('urgent')}>
                Срочный
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          {/* Assignee Updates */}
          {availableUsers.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <User className="mr-2 h-4 w-4" />
                Назначить исполнителя
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => onAssigneeUpdate(null)}>
                  Снять назначение
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {availableUsers.map(user => (
                  <DropdownMenuItem 
                    key={user.id} 
                    onClick={() => onAssigneeUpdate(user.id)}
                  >
                    {user.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          
          <DropdownMenuSeparator />
          
          {/* Delete */}
          <DropdownMenuItem 
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить выбранные
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default BulkActionsMenu;