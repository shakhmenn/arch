import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Link,
  Trash2,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Pause,
  XCircle,
  MoreHorizontal,
  Edit,
  Eye,
  Copy,
  Archive,
  Flag,
  Target,
  Users,
  MessageSquare,
  Paperclip,
  GitBranch,
  Layers,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Progress } from '@/shared/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { Separator } from '@/shared/ui/separator';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { format, isOverdue, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskHierarchy as TaskHierarchyType,
} from '@/entities/task/model/types';
import { useTaskHierarchyQuery, useCreateSubtaskMutation, useDeleteTaskMutation } from '../api/tasks-api';
import { TaskCard } from './TaskCard';
import { UnifiedTaskDialog } from './unified-task-dialog/UnifiedTaskDialog';
import { TaskDependenciesDialog } from './TaskDependenciesDialog';

interface TaskHierarchyProps {
  taskId: number;
  className?: string;
  maxDepth?: number;
}

interface TaskNodeProps {
  hierarchy: TaskHierarchyType;
  level: number;
  maxDepth: number;
  onTaskUpdate?: () => void;
}

const TaskNode: React.FC<TaskNodeProps> = ({ hierarchy, level, maxDepth, onTaskUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const [showCreateSubtask, setShowCreateSubtask] = useState(false);
  const [showDependencies, setShowDependencies] = useState(false);
  
  const createSubtaskMutation = useCreateSubtaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();
  
  const { task, subtasks } = hierarchy;
  const hasSubtasks = subtasks && subtasks.length > 0;
  const canAddSubtasks = level < maxDepth;
  const hasDependencies = task.dependencies && task.dependencies.length > 0;
  const completedSubtasks = subtasks?.filter(subtask => subtask.task.status === TaskStatus.DONE).length || 0;
  const totalSubtasks = subtasks?.length || 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
  
  const statusInfo = statusConfig[task.status];
  const priorityInfo = priorityConfig[task.priority];
  const StatusIcon = statusInfo.icon;
  const PriorityIcon = priorityInfo.icon;
  
  const isOverdueTask = task.dueDate && isOverdue(new Date(task.dueDate)) && task.status !== TaskStatus.DONE;
  
  const handleToggleExpand = () => {
    if (hasSubtasks) {
      setIsExpanded(!isExpanded);
    }
  };
  
  const handleDeleteTask = async () => {
    if (window.confirm(`Вы уверены, что хотите удалить задачу "${task.title}"?`)) {
      try {
        await deleteTaskMutation.mutateAsync(task.id);
        onTaskUpdate?.();
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit task:', task.id);
  };

  const handleView = () => {
    // TODO: Implement view functionality
    console.log('View task:', task.id);
  };

  const handleCopy = () => {
    // TODO: Implement copy functionality
    console.log('Copy task:', task.id);
  };

  const handleArchive = () => {
    // TODO: Implement archive functionality
    console.log('Archive task:', task.id);
  };
  
  const statusConfig = {
    [TaskStatus.TODO]: {
      label: 'К выполнению',
      icon: Circle,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      iconColor: 'text-gray-600',
    },
    [TaskStatus.IN_PROGRESS]: {
      label: 'В работе',
      icon: Clock,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      iconColor: 'text-blue-600',
    },
    [TaskStatus.IN_REVIEW]: {
      label: 'На проверке',
      icon: Eye,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      iconColor: 'text-yellow-600',
    },
    [TaskStatus.DONE]: {
      label: 'Выполнено',
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-800 border-green-200',
      iconColor: 'text-green-600',
    },
    [TaskStatus.CANCELLED]: {
      label: 'Отменено',
      icon: XCircle,
      color: 'bg-red-100 text-red-800 border-red-200',
      iconColor: 'text-red-600',
    },
  };

  const priorityConfig = {
    [TaskPriority.LOW]: {
      label: 'Низкий',
      icon: Flag,
      color: 'bg-green-100 text-green-800 border-green-200',
      iconColor: 'text-green-600',
    },
    [TaskPriority.MEDIUM]: {
      label: 'Средний',
      icon: Flag,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      iconColor: 'text-yellow-600',
    },
    [TaskPriority.HIGH]: {
      label: 'Высокий',
      icon: Flag,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      iconColor: 'text-orange-600',
    },
    [TaskPriority.URGENT]: {
      label: 'Срочный',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-800 border-red-200',
      iconColor: 'text-red-600',
    },
  };
  
  return (
    <TooltipProvider>
      <div className={cn('relative', level > 0 && 'ml-6')}>
        {/* Connection line for nested tasks */}
        {level > 0 && (
          <div className="absolute -left-6 top-0 bottom-0 w-px bg-gray-200" />
        )}
        
        <Card className={cn(
          'mb-2 transition-all duration-200 hover:shadow-md',
          level === 0 && 'border-l-4 border-l-blue-500'
        )}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {/* Expand/Collapse button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-6 w-6"
                  onClick={handleToggleExpand}
                  disabled={!hasSubtasks}
                >
                  {hasSubtasks ? (
                    isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                </Button>
                
                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900 truncate">{task.title}</h4>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {task.assignee && (
                      <span>Исполнитель: {task.assignee.name}</span>
                    )}
                    {task.dueDate && (
                      <span>Срок: {new Date(task.dueDate).toLocaleDateString()}</span>
                    )}
                    {task._count && (
                      <span>Подзадач: {task._count.subtasks}</span>
                    )}
                    {task._count && task._count.dependencies > 0 && (
                      <span>Зависимостей: {task._count.dependencies}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center space-x-1 ml-2">
                {canAddSubtasks && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateSubtask(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDependencies(true)}
                  className="h-8 w-8 p-0"
                >
                  <Link className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteTask}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      
         {/* Subtasks */}
         {isExpanded && hasSubtasks && (
           <div className="ml-8 space-y-2">
             {subtasks.map((subtaskHierarchy, index) => (
               <TaskNode
                 key={subtaskHierarchy.task.id}
                 hierarchy={subtaskHierarchy}
                 level={level + 1}
                 maxDepth={maxDepth}
                 onTaskUpdate={onTaskUpdate}
               />
             ))}
           </div>
         )}
         
         {/* Create subtask dialog */}
         {showCreateSubtask && (
           <UnifiedTaskDialog
             mode="create"
             taskType="TEAM"
             parentTaskId={task.id}
             open={showCreateSubtask}
             onOpenChange={setShowCreateSubtask}
             onSuccess={() => {
               setShowCreateSubtask(false);
               onTaskUpdate?.();
             }}
           />
         )}
         
         {/* Dependencies dialog */}
         {showDependencies && (
           <TaskDependenciesDialog
             taskId={task.id}
             open={showDependencies}
             onOpenChange={setShowDependencies}
           />
         )}
       </div>
     </TooltipProvider>
  );
};

export const TaskHierarchy: React.FC<TaskHierarchyProps> = ({ 
  taskId, 
  className,
  maxDepth = 5 
}) => {
  const { data: hierarchy, isLoading, error, refetch } = useTaskHierarchyQuery(taskId);
  
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-red-600 mb-4">Ошибка загрузки иерархии задач</p>
        <Button onClick={() => refetch()} variant="outline">
          Попробовать снова
        </Button>
      </div>
    );
  }
  
  if (!hierarchy) {
    return (
      <div className={cn('text-center py-8 text-gray-500', className)}>
        Задача не найдена
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-2', className)}>
      <TaskNode 
        hierarchy={hierarchy} 
        level={0} 
        maxDepth={maxDepth}
        onTaskUpdate={() => refetch()}
      />
    </div>
  );
};