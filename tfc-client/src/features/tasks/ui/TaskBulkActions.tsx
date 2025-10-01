import React, { useState } from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import {
  CheckSquare,
  X,
  Trash2,
  Edit,
  Copy,
  Archive,
  Users,
  Calendar,
  Flag,
  MoreHorizontal,
  Download,
  Tag,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { TaskStatus, TaskPriority } from '@entities/task/model/types';
import { useUsersQuery } from '@/features/teams/api/teams-api';

interface TaskBulkActionsProps {
  selectedCount: number;
  onAction: (action: string, data?: any) => Promise<void>;
  onClear: () => void;
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

export const TaskBulkActions: React.FC<TaskBulkActionsProps> = ({
  selectedCount,
  onAction,
  onClear,
  className,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: usersData } = useUsersQuery(); // Get all users
  const members = usersData || [];
  
  const handleAction = async (action: string, data?: any) => {
    setIsLoading(true);
    try {
      await onAction(action, data);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStatusChange = (status: TaskStatus) => {
    handleAction('updateStatus', { status });
  };
  
  const handlePriorityChange = (priority: TaskPriority) => {
    handleAction('updatePriority', { priority });
  };
  
  const handleAssigneeChange = (assigneeId: number) => {
    handleAction('updateAssignee', { assigneeId });
  };
  
  const handleDelete = () => {
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = () => {
    handleAction('delete');
    setShowDeleteDialog(false);
  };
  
  const handleArchive = () => {
    setShowArchiveDialog(true);
  };
  
  const confirmArchive = () => {
    handleAction('archive');
    setShowArchiveDialog(false);
  };
  
  const handleDuplicate = () => {
    handleAction('duplicate');
  };
  
  const handleExport = () => {
    handleAction('export');
  };
  
  const handleAddTag = () => {
    const tag = prompt('Введите тег:');
    if (tag) {
      handleAction('addTag', { tag });
    }
  };
  
  return (
    <>
      <Card className={cn('border-blue-200 bg-blue-50', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Выбrano задач:
              </span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {selectedCount}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Status Update */}
              <Select onValueChange={handleStatusChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Изменить статус" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Priority Update */}
              <Select onValueChange={handlePriorityChange}>
                <SelectTrigger className="w-40">
                  <Flag className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Приоритет" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Assignee Update */}
              <Select onValueChange={(value) => handleAssigneeChange(parseInt(value))}>
                <SelectTrigger className="w-40">
                  <Users className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Назначить" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Снять назначение</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.user.id.toString()}>
                      {member.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Quick Actions */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                disabled={isLoading}
              >
                <Copy className="mr-2 h-4 w-4" />
                Дублировать
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={isLoading}
              >
                <Tag className="mr-2 h-4 w-4" />
                Добавить тег
              </Button>
              
              {/* More Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Дополнительные действия</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Экспортировать
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handleArchive}>
                    <Archive className="mr-2 h-4 w-4" />
                    Архивировать
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите удаление</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить {selectedCount} задач(и)? 
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите архивирование</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите архивировать {selectedCount} задач(и)? 
              Архивированные задачи можно будет восстановить позже.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive}>
              Архивировать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};