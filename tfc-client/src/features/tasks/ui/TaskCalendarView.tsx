import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
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
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  AlertTriangle,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  Archive,
  Filter,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTasksQuery } from '../api/tasks-api';
import type { Task, TaskStatus, TaskPriority } from '../types/task';

type CalendarView = 'month' | 'week' | 'day';

interface TaskCalendarViewProps {
  teamId?: string;
  userId?: string;
  projectId?: string;
  onTaskClick?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onCreateTask?: (date: Date) => void;
  className?: string;
}

const statusConfig = {
  TODO: { label: 'К выполнению', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  IN_PROGRESS: { label: 'В работе', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  REVIEW: { label: 'На проверке', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  DONE: { label: 'Выполнено', color: 'bg-green-100 text-green-700 border-green-300' },
  CANCELLED: { label: 'Отменено', color: 'bg-red-100 text-red-700 border-red-300' },
};

const priorityConfig = {
  LOW: { label: 'Низкий', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  MEDIUM: { label: 'Средний', color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-400' },
  HIGH: { label: 'Высокий', color: 'bg-orange-100 text-orange-600', dot: 'bg-orange-400' },
  URGENT: { label: 'Критический', color: 'bg-red-100 text-red-600', dot: 'bg-red-400' },
};

// Task Event Component for Calendar
interface TaskEventProps {
  task: Task;
  isCompact?: boolean;
  onTaskClick?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
}

const TaskEvent: React.FC<TaskEventProps> = ({
  task,
  isCompact = false,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
}) => {
  const statusInfo = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.TODO;
  const priorityInfo = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;
  const isOverdue = task.dueDate && isAfter(new Date(), new Date(task.dueDate)) && task.status !== 'DONE';
  
  if (isCompact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer transition-colors hover:opacity-80',
              statusInfo.color,
              isOverdue && 'border-l-2 border-l-red-500'
            )}
            onClick={() => onTaskClick?.(task)}
          >
            <div className={cn('w-2 h-2 rounded-full flex-shrink-0', priorityInfo.dot)} />
            <span className="truncate flex-1 font-medium">{task.title}</span>
            {task.assignee && (
              <Avatar className="h-4 w-4 flex-shrink-0">
                <AvatarImage src={task.assignee.avatar} />
                <AvatarFallback className="text-xs">
                  {task.assignee.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{task.title}</p>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className={priorityInfo.color}>
                {priorityInfo.label}
              </Badge>
              <Badge variant="outline" className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
            </div>
            {task.dueDate && (
              <p className="text-xs text-muted-foreground">
                Срок: {format(new Date(task.dueDate), 'dd MMMM yyyy, HH:mm', { locale: ru })}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return (
    <Card className={cn(
      'mb-2 transition-all duration-200 hover:shadow-md cursor-pointer border-l-4',
      priorityInfo.dot.replace('bg-', 'border-l-'),
      isOverdue && 'border-l-red-500 bg-red-50/30'
    )}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0" onClick={() => onTaskClick?.(task)}>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm truncate flex-1">
                {task.title}
                {isOverdue && (
                  <AlertTriangle className="inline-block ml-1 h-3 w-3 text-red-500" />
                )}
              </h4>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={cn('text-xs', priorityInfo.color)}>
                {priorityInfo.label}
              </Badge>
              <Badge variant="outline" className={cn('text-xs', statusInfo.color)}>
                {statusInfo.label}
              </Badge>
            </div>
            
            {task.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {task.assignee && (
                  <div className="flex items-center gap-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={task.assignee.avatar} />
                      <AvatarFallback className="text-xs">
                        {task.assignee.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {task.assignee.name}
                    </span>
                  </div>
                )}
              </div>
              
              {task.dueDate && (
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
                )}>
                  <Clock className="h-3 w-3" />
                  <span>
                    {format(new Date(task.dueDate), 'HH:mm', { locale: ru })}
                  </span>
                </div>
              )}
            </div>
          </div>
          
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
      </CardContent>
    </Card>
  );
};

// Calendar Day Cell Component
interface CalendarDayCellProps {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  isToday: boolean;
  view: CalendarView;
  onTaskClick?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onCreateTask?: (date: Date) => void;
}

const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  date,
  tasks,
  isCurrentMonth,
  isToday: isTodayProp,
  view,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onCreateTask,
}) => {
  const dayTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    return isSameDay(new Date(task.dueDate), date);
  });
  
  const isCompact = view === 'month';
  const maxVisibleTasks = isCompact ? 3 : 10;
  const visibleTasks = dayTasks.slice(0, maxVisibleTasks);
  const hiddenTasksCount = Math.max(0, dayTasks.length - maxVisibleTasks);
  
  return (
    <div className={cn(
      'border border-border bg-background transition-colors hover:bg-muted/30',
      !isCurrentMonth && 'bg-muted/20 text-muted-foreground',
      isTodayProp && 'bg-primary/5 border-primary/30',
      view === 'month' ? 'min-h-32 p-2' : 'min-h-24 p-3'
    )}>
      {/* Day header */}
      <div className="flex items-center justify-between mb-2">
        <div className={cn(
          'flex items-center justify-center rounded-full transition-colors',
          isTodayProp ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted',
          view === 'month' ? 'h-6 w-6 text-sm' : 'h-8 w-8 text-base'
        )}>
          {format(date, 'd')}
        </div>
        
        {dayTasks.length > 0 && (
          <Badge variant="secondary" className="text-xs h-5">
            {dayTasks.length}
          </Badge>
        )}
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCreateTask?.(date)}
              className={cn(
                'opacity-0 group-hover:opacity-100 transition-opacity',
                view === 'month' ? 'h-5 w-5 p-0' : 'h-6 w-6 p-0'
              )}
            >
              <Plus className={view === 'month' ? 'h-3 w-3' : 'h-4 w-4'} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Добавить задачу на {format(date, 'dd MMMM', { locale: ru })}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      {/* Tasks */}
      <div className="space-y-1 group">
        {visibleTasks.map((task) => (
          <TaskEvent
            key={task.id}
            task={task}
            isCompact={isCompact}
            onTaskClick={onTaskClick}
            onTaskEdit={onTaskEdit}
            onTaskDelete={onTaskDelete}
          />
        ))}
        
        {hiddenTasksCount > 0 && (
          <div className="text-xs text-muted-foreground text-center py-1">
            +{hiddenTasksCount} еще
          </div>
        )}
        
        {dayTasks.length === 0 && view !== 'month' && (
          <div className="text-xs text-muted-foreground text-center py-4 opacity-0 group-hover:opacity-100 transition-opacity">
            Нет задач
          </div>
        )}
      </div>
    </div>
  );
};

// Main Calendar View Component
const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  teamId,
  userId,
  projectId,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onCreateTask,
  className,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  
  // API hooks
  const { data: tasksData, isLoading } = useTasksQuery({
    teamId,
    userId,
    projectId,
    limit: 1000, // Load all tasks for calendar
  });
  
  const tasks = tasksData?.tasks || [];
  
  // Calculate date range based on view
  const dateRange = useMemo(() => {
    switch (view) {
      case 'month': {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
      }
      case 'week': {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: weekStart, end: weekEnd });
      }
      case 'day': {
        return [currentDate];
      }
      default:
        return [];
    }
  }, [currentDate, view]);
  
  // Navigation handlers
  const handlePrevious = () => {
    switch (view) {
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
    }
  };
  
  const handleNext = () => {
    switch (view) {
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
    }
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  // Get title based on view
  const getTitle = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'LLLL yyyy', { locale: ru });
      case 'week': {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'dd MMM', { locale: ru })} - ${format(weekEnd, 'dd MMM yyyy', { locale: ru })}`;
      }
      case 'day':
        return format(currentDate, 'dd MMMM yyyy', { locale: ru });
      default:
        return '';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Загрузка календаря...</p>
        </div>
      </div>
    );
  }
  
  return (
    <TooltipProvider>
      <div className={cn('flex flex-col h-full', className)}>
        {/* Calendar header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="min-w-20"
              >
                Сегодня
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <h2 className="text-xl font-semibold capitalize">
              {getTitle()}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={view === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('month')}
                className="h-8"
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                Месяц
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('week')}
                className="h-8"
              >
                <CalendarRange className="h-4 w-4 mr-1" />
                Неделя
              </Button>
              <Button
                variant={view === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('day')}
                className="h-8"
              >
                <CalendarCheck className="h-4 w-4 mr-1" />
                День
              </Button>
            </div>
          </div>
        </div>
        
        {/* Calendar grid */}
        <div className="flex-1 overflow-hidden">
          {view === 'month' && (
            <div className="h-full flex flex-col">
              {/* Week days header */}
              <div className="grid grid-cols-7 border-b">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar days */}
              <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                {dateRange.map((date) => (
                  <CalendarDayCell
                    key={date.toISOString()}
                    date={date}
                    tasks={tasks}
                    isCurrentMonth={isSameMonth(date, currentDate)}
                    isToday={isToday(date)}
                    view={view}
                    onTaskClick={onTaskClick}
                    onTaskEdit={onTaskEdit}
                    onTaskDelete={onTaskDelete}
                    onCreateTask={onCreateTask}
                  />
                ))}
              </div>
            </div>
          )}
          
          {view === 'week' && (
            <div className="h-full">
              {/* Week days header */}
              <div className="grid grid-cols-7 border-b">
                {dateRange.map((date) => (
                  <div key={date.toISOString()} className="p-3 text-center border-r last:border-r-0">
                    <div className="text-sm font-medium text-muted-foreground">
                      {format(date, 'EEE', { locale: ru })}
                    </div>
                    <div className={cn(
                      'text-lg font-semibold mt-1',
                      isToday(date) && 'text-primary'
                    )}>
                      {format(date, 'd')}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Week days */}
              <div className="flex-1 grid grid-cols-7">
                {dateRange.map((date) => (
                  <CalendarDayCell
                    key={date.toISOString()}
                    date={date}
                    tasks={tasks}
                    isCurrentMonth={true}
                    isToday={isToday(date)}
                    view={view}
                    onTaskClick={onTaskClick}
                    onTaskEdit={onTaskEdit}
                    onTaskDelete={onTaskDelete}
                    onCreateTask={onCreateTask}
                  />
                ))}
              </div>
            </div>
          )}
          
          {view === 'day' && (
            <div className="h-full p-4">
              <ScrollArea className="h-full">
                <CalendarDayCell
                  date={currentDate}
                  tasks={tasks}
                  isCurrentMonth={true}
                  isToday={isToday(currentDate)}
                  view={view}
                  onTaskClick={onTaskClick}
                  onTaskEdit={onTaskEdit}
                  onTaskDelete={onTaskDelete}
                  onCreateTask={onCreateTask}
                />
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default TaskCalendarView;