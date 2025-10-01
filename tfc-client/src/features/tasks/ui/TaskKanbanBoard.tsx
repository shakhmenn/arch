import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  CardHeader,
  Badge,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Progress,
  ScrollArea,
} from '@/shared/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  Plus,
  MoreHorizontal,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Layers,
  MessageSquare,
  Paperclip,
  Edit,
  Trash2,
  Eye,
  Copy,
  Archive,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { format, formatDistanceToNow, isAfter } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  useTasksQuery,
  useUpdateTaskMutation,
  useChangeTaskStatusMutation,
} from '../api/tasks-api';
import type { Task, TaskStatus, TaskPriority } from '../types/task';

interface TaskKanbanBoardProps {
  teamId?: string;
  userId?: string;
  projectId?: string;
  onTaskClick?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onCreateTask?: (status: TaskStatus) => void;
  className?: string;
}

interface KanbanColumn {
  id: TaskStatus;
  title: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  maxTasks?: number;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'TODO',
    title: 'К выполнению',
    color: 'bg-gray-100 border-gray-300',
    icon: Clock,
  },
  {
    id: 'IN_PROGRESS',
    title: 'В работе',
    color: 'bg-blue-100 border-blue-300',
    icon: Clock,
    maxTasks: 3, // WIP limit
  },
  {
    id: 'REVIEW',
    title: 'На проверке',
    color: 'bg-yellow-100 border-yellow-300',
    icon: Clock,
  },
  {
    id: 'DONE',
    title: 'Выполнено',
    color: 'bg-green-100 border-green-300',
    icon: CheckCircle,
  },
];

const priorityConfig = {
  LOW: { label: 'Низкий', color: 'bg-gray-100 text-gray-600', border: 'border-l-gray-400' },
  MEDIUM: { label: 'Средний', color: 'bg-blue-100 text-blue-600', border: 'border-l-blue-400' },
  HIGH: { label: 'Высокий', color: 'bg-orange-100 text-orange-600', border: 'border-l-orange-400' },
  URGENT: { label: 'Критический', color: 'bg-red-100 text-red-600', border: 'border-l-red-400' },
};

// Sortable Task Card Component
interface SortableTaskCardProps {
  task: Task;
  onTaskClick?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({
  task,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityInfo = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;
  const isOverdue = task.dueDate && isAfter(new Date(), new Date(task.dueDate)) && task.status !== 'DONE';
  
  // Calculate subtask progress
  const totalSubtasks = task._count?.subtasks || 0;
  const completedSubtasks = task.subtasks?.filter(subtask => subtask.status === 'DONE').length || 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'touch-none',
        isDragging && 'opacity-50 rotate-2 scale-105'
      )}
      {...attributes}
    >
      <Card className={cn(
        'mb-3 transition-all duration-200 hover:shadow-lg cursor-pointer border-l-4',
        priorityInfo.border,
        isOverdue && 'border-l-red-500 bg-red-50/30',
        isDragging && 'shadow-2xl'
      )}>
        <CardContent className="p-4">
          {/* Drag handle */}
          <div className="flex items-start gap-3">
            <div
              {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing hover:bg-muted rounded p-1 transition-colors"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex-1 min-w-0" onClick={() => onTaskClick?.(task)}>
              {/* Title and priority */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-sm leading-tight flex-1">
                  {task.title}
                  {isOverdue && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="inline-block ml-1 h-4 w-4 text-red-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Задача просрочена</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </h4>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-muted"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTaskClick?.(task); }}>
                      <Eye className="h-4 w-4 mr-2" />
                      Просмотр
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTaskEdit?.(task); }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Редактировать
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                      <Copy className="h-4 w-4 mr-2" />
                      Дублировать
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                      <Archive className="h-4 w-4 mr-2" />
                      Архивировать
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onTaskDelete?.(task.id); }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Priority badge */}
              <Badge variant="outline" className={cn('text-xs px-2 py-1 mb-2', priorityInfo.color)}>
                {priorityInfo.label}
              </Badge>
              
              {/* Description */}
              {task.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              )}
              
              {/* Progress bar for subtasks */}
              {totalSubtasks > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      Подзадачи: {completedSubtasks}/{totalSubtasks}
                    </span>
                    <span className="text-xs font-medium">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              )}
              
              {/* Task metadata */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {task.assignee && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee.avatar} />
                          <AvatarFallback className="text-xs">
                            {task.assignee.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Исполнитель: {task.assignee.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {task.dueDate && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn(
                          "flex items-center gap-1 text-xs",
                          isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
                        )}>
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(task.dueDate), 'dd.MM', { locale: ru })}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Срок: {format(new Date(task.dueDate), 'dd MMMM yyyy', { locale: ru })}
                          {isOverdue && ' (просрочено)'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {totalSubtasks > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          <span>{totalSubtasks}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Подзадач: {totalSubtasks}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {task.attachments && task.attachments.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          <span>{task.attachments.length}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Вложений: {task.attachments.length}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {task.commentsCount && task.commentsCount > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{task.commentsCount}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Комментариев: {task.commentsCount}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Kanban Column Component
interface KanbanColumnProps {
  column: KanbanColumn;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onCreateTask?: (status: TaskStatus) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onCreateTask,
}) => {
  const Icon = column.icon;
  const isOverLimit = column.maxTasks && tasks.length > column.maxTasks;
  
  return (
    <div className="flex flex-col h-full min-w-80">
      {/* Column header */}
      <div className={cn(
        'p-4 rounded-t-lg border-2 border-b-0',
        column.color,
        isOverLimit && 'border-red-300 bg-red-100'
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <h3 className="font-semibold text-sm">{column.title}</h3>
            <Badge variant="secondary" className="text-xs">
              {tasks.length}
            </Badge>
            {column.maxTasks && (
              <Badge 
                variant={isOverLimit ? "destructive" : "outline"} 
                className="text-xs"
              >
                /{column.maxTasks}
              </Badge>
            )}
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCreateTask?.(column.id)}
                className="h-8 w-8 p-0 hover:bg-white/50"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Добавить задачу в {column.title}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {isOverLimit && (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertTriangle className="h-3 w-3" />
            <span>Превышен лимит WIP</span>
          </div>
        )}
      </div>
      
      {/* Column content */}
      <div className={cn(
        'flex-1 p-4 border-2 border-t-0 rounded-b-lg bg-white/50',
        column.color.replace('bg-', 'border-'),
        isOverLimit && 'border-red-300'
      )}>
        <ScrollArea className="h-full">
          <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-0">
              {tasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onTaskClick={onTaskClick}
                  onTaskEdit={onTaskEdit}
                  onTaskDelete={onTaskDelete}
                />
              ))}
            </div>
          </SortableContext>
          
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Icon className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm text-center">
                Нет задач в статусе<br />"{column.title}"
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCreateTask?.(column.id)}
                className="mt-2 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Добавить задачу
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

// Main Kanban Board Component
const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  teamId,
  userId,
  projectId,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onCreateTask,
  className,
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // API hooks
  const { data: tasksData, isLoading } = useTasksQuery({
    teamId,
    userId,
    projectId,
    limit: 1000, // Load all tasks for kanban
  });
  
  const { mutate: updateTaskStatus } = useChangeTaskStatusMutation();
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const tasks = tasksData?.tasks || [];
    const grouped: Record<TaskStatus, Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      DONE: [],
      CANCELLED: [],
    };
    
    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    
    return grouped;
  }, [tasksData]);
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasksByStatus ? Object.values(tasksByStatus)
      .flat()
      .find((task) => task.id === active.id) : null;
    setActiveTask(task || null);
  };
  
  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveTask(null);
      return;
    }
    
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    
    // Find the task
    const task = tasksByStatus ? Object.values(tasksByStatus)
      .flat()
      .find((task) => task.id === taskId) : null;
    
    if (task && task.status !== newStatus) {
      // Update task status
      updateTaskStatus({
        taskId,
        status: newStatus,
      });
    }
    
    setActiveTask(null);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Загрузка задач...</p>
        </div>
      </div>
    );
  }
  
  return (
    <TooltipProvider>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={cn('flex gap-6 h-full overflow-x-auto pb-4', className)}>
          {KANBAN_COLUMNS.map((column) => (
            <SortableContext
              key={column.id}
              id={column.id}
              items={tasksByStatus[column.id].map(task => task.id)}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn
                column={column}
                tasks={tasksByStatus[column.id]}
                onTaskClick={onTaskClick}
                onTaskEdit={onTaskEdit}
                onTaskDelete={onTaskDelete}
                onCreateTask={onCreateTask}
              />
            </SortableContext>
          ))}
        </div>
        
        {/* Drag overlay */}
        <DragOverlay>
          {activeTask ? (
            <SortableTaskCard
              task={activeTask}
              onTaskClick={onTaskClick}
              onTaskEdit={onTaskEdit}
              onTaskDelete={onTaskDelete}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </TooltipProvider>
  );
};

export default TaskKanbanBoard;