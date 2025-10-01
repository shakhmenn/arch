import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/avatar';
import { Card, CardContent } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  User,
  Link2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  Pause,
  X,
  MoreHorizontal
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Task, TaskStatus, TaskPriority } from '@/entities/task';
import { useCreateSubtaskMutation, useUpdateTaskMutation, useDeleteTaskMutation } from '@/features/tasks/api/tasks-api';
import { toast } from 'sonner';

// Status icons mapping
const STATUS_ICONS = {
  todo: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
  cancelled: X,
  on_hold: Pause
} as const;

// Status colors mapping
const STATUS_COLORS = {
  todo: 'text-gray-500',
  in_progress: 'text-blue-500',
  completed: 'text-green-500',
  cancelled: 'text-red-500',
  on_hold: 'text-yellow-500'
} as const;

// Priority colors mapping
const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700 border-gray-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200'
} as const;

// Priority labels
const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent'
} as const;

interface TaskCardProps {
  task: Task;
  level?: number;
  isExpanded?: boolean;
  onToggleExpand?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onAddSubtask?: (parentTask: Task) => void;
  onTaskClick?: (task: Task) => void;
  showSubtasks?: boolean;
  isDragging?: boolean;
  dragHandleProps?: any;
  className?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  level = 0,
  isExpanded = false,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddSubtask,
  onTaskClick,
  showSubtasks = true,
  isDragging = false,
  dragHandleProps,
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  // Mutations
  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();
  const createSubtaskMutation = useCreateSubtaskMutation();

  // Calculate subtask progress
  const subtaskProgress = useMemo(() => {
    if (!task.subtasks || task.subtasks.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completed = task.subtasks.filter(subtask => subtask.status === 'completed').length;
    const total = task.subtasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }, [task.subtasks]);

  // Check if task is overdue
  const isOverdue = useMemo(() => {
    if (!task.dueDate || task.status === 'completed') return false;
    return new Date(task.dueDate) < new Date();
  }, [task.dueDate, task.status]);

  // Handle title edit
  const handleTitleSave = useCallback(async () => {
    if (editTitle.trim() !== task.title) {
      try {
        await updateTaskMutation.mutateAsync({
          id: task.id,
          title: editTitle.trim()
        });
        toast.success('Task title updated');
      } catch (error) {
        toast.error('Failed to update task title');
        setEditTitle(task.title); // Reset on error
      }
    }
    setIsEditing(false);
  }, [editTitle, task.title, task.id, updateTaskMutation]);

  // Handle status change
  const handleStatusChange = useCallback(async (newStatus: TaskStatus) => {
    try {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        status: newStatus
      });
      toast.success('Task status updated');
    } catch (error) {
      toast.error('Failed to update task status');
    }
  }, [task.id, updateTaskMutation]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        await deleteTaskMutation.mutateAsync(task.id);
        toast.success('Task deleted');
        onDelete?.(task);
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  }, [task, deleteTaskMutation, onDelete]);

  // Handle add subtask
  const handleAddSubtask = useCallback(async () => {
    try {
      await createSubtaskMutation.mutateAsync({
        parentTaskId: task.id,
        title: 'New subtask',
        description: '',
        priority: 'medium'
      });
      toast.success('Subtask created');
      onAddSubtask?.(task);
    } catch (error) {
      toast.error('Failed to create subtask');
    }
  }, [task, createSubtaskMutation, onAddSubtask]);

  const StatusIcon = STATUS_ICONS[task.status];
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const hasDependencies = task.dependencies && task.dependencies.length > 0;

  return (
    <TooltipProvider>
      <Card
        className={cn(
          'group transition-all duration-200 hover:shadow-md',
          'border-l-4',
          task.priority === 'urgent' && 'border-l-red-500',
          task.priority === 'high' && 'border-l-orange-500',
          task.priority === 'medium' && 'border-l-blue-500',
          task.priority === 'low' && 'border-l-gray-300',
          isDragging && 'shadow-lg rotate-2 scale-105',
          isOverdue && 'bg-red-50 border-red-200',
          level > 0 && 'ml-6 border-l-2 border-l-gray-200',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...dragHandleProps}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Hierarchy indicator */}
              {level > 0 && (
                <div className="flex items-center">
                  {Array.from({ length: level }).map((_, i) => (
                    <div key={i} className="w-4 h-px bg-gray-300 mr-1" />
                  ))}
                </div>
              )}

              {/* Expand/Collapse button */}
              {hasSubtasks && showSubtasks && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  onClick={() => onToggleExpand?.(task.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}

              {/* Status icon */}
              <Button
                variant="ghost"
                size="sm"
                className={cn('h-6 w-6 p-0', STATUS_COLORS[task.status])}
                onClick={() => {
                  const nextStatus = task.status === 'todo' ? 'in_progress' : 
                                   task.status === 'in_progress' ? 'completed' : 'todo';
                  handleStatusChange(nextStatus);
                }}
              >
                <StatusIcon className="h-4 w-4" />
              </Button>

              {/* Task content */}
              <div className="flex-1 min-w-0">
                {/* Title */}
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleSave();
                      if (e.key === 'Escape') {
                        setEditTitle(task.title);
                        setIsEditing(false);
                      }
                    }}
                    className="w-full bg-transparent border-none outline-none font-medium text-sm"
                    autoFocus
                  />
                ) : (
                  <h3
                    className={cn(
                      'font-medium text-sm cursor-pointer hover:text-blue-600 transition-colors',
                      task.status === 'completed' && 'line-through text-gray-500'
                    )}
                    onClick={() => onTaskClick?.(task)}
                    onDoubleClick={() => setIsEditing(true)}
                  >
                    {task.title}
                  </h3>
                )}

                {/* Description */}
                {task.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}

                {/* Metadata row */}
                <div className="flex items-center gap-3 mt-2">
                  {/* Priority badge */}
                  <Badge
                    variant="outline"
                    className={cn('text-xs px-2 py-0.5', PRIORITY_COLORS[task.priority])}
                  >
                    {PRIORITY_LABELS[task.priority]}
                  </Badge>

                  {/* Assignee */}
                  {task.assignee && (
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-400" />
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={task.assignee.avatar} />
                            <AvatarFallback className="text-xs">
                              {task.assignee.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{task.assignee.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Due date */}
                  {task.dueDate && (
                    <Tooltip>
                      <TooltipTrigger>
                        <div className={cn(
                          'flex items-center gap-1 text-xs',
                          isOverdue ? 'text-red-600' : 'text-gray-500'
                        )}>
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                          </span>
                          {isOverdue && <AlertCircle className="h-3 w-3" />}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{format(new Date(task.dueDate), 'PPP')}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Dependencies indicator */}
                  {hasDependencies && (
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Link2 className="h-3 w-3" />
                          <span>{task.dependencies!.length}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{task.dependencies!.length} dependencies</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Subtasks progress */}
                  {hasSubtasks && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>{subtaskProgress.completed}/{subtaskProgress.total}</span>
                      </div>
                      <Progress
                        value={subtaskProgress.percentage}
                        className="w-12 h-1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={cn(
              'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
              isHovered && 'opacity-100'
            )}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={handleAddSubtask}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add subtask</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onEdit?.(task)}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit task</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:text-red-600"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete task</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>More actions</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Subtasks */}
          {hasSubtasks && showSubtasks && isExpanded && (
            <div className="mt-4 space-y-2">
              {task.subtasks!.map((subtask) => (
                <TaskCard
                  key={subtask.id}
                  task={subtask}
                  level={level + 1}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddSubtask={onAddSubtask}
                  onTaskClick={onTaskClick}
                  showSubtasks={showSubtasks}
                  className="bg-gray-50"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default TaskCard;