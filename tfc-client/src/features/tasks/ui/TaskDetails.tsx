import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Progress } from '@/shared/ui/progress';
import { Textarea } from '@/shared/ui/textarea';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { ScrollArea } from '@/shared/ui/scroll-area';
import {
  Calendar,
  Clock,
  User,
  Flag,
  MessageSquare,
  Paperclip,
  Edit,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Save,
  X,
  Link,
  History,
  CheckCircle,
  Circle,
  AlertCircle,
  Download,
  Eye,
  MoreHorizontal,
  Tag,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/shared/ui/dropdown-menu';
import type { TaskDetails as TaskDetailsType, TaskPriority, TaskStatus } from '@entities/task/model/types';
import TaskAttachments from './TaskAttachments';
import ActivityLog from './ActivityLog';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

interface TaskDetailsProps {
  task: TaskDetailsType;
  assigneeName?: string;
  creatorName?: string;
  teamName?: string;
  canEdit?: boolean;
  onTaskUpdate?: () => void;
  onEdit?: (task: TaskDetailsType) => void;
  onDelete?: (task: TaskDetailsType) => void;
  onAddSubtask?: (parentTask: TaskDetailsType) => void;
  onClose?: () => void;
  showFullDetails?: boolean;
  className?: string;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({
  task,
  assigneeName,
  creatorName,
  teamName,
  canEdit = false,
  onTaskUpdate,
  onEdit,
  onDelete,
  onAddSubtask,
  onClose,
  showFullDetails = true,
  className,
}) => {
  // State
  const [isEditing, setIsEditing] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [showDependencies, setShowDependencies] = useState(false);
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''
  });

  // Handle edit mode
  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''
    });
  }, [task]);

  const handleSaveEdit = useCallback(async () => {
    try {
      // Update task logic would go here
      setIsEditing(false);
      toast.success('Task updated successfully');
      onTaskUpdate?.();
    } catch (error) {
      toast.error('Failed to update task');
    }
  }, [editForm, onTaskUpdate]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        toast.success('Task deleted successfully');
        onDelete?.(task);
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  }, [task, onDelete]);

  // Handle add subtask
  const handleAddSubtask = useCallback(async () => {
    try {
      toast.success('Subtask created successfully');
      onAddSubtask?.(task);
    } catch (error) {
      toast.error('Failed to create subtask');
    }
  }, [task, onAddSubtask]);

  // Status options
  const statusOptions = [
    { value: 'PENDING', label: 'В ожидании', icon: Circle },
    { value: 'IN_PROGRESS', label: 'В работе', icon: AlertCircle },
    { value: 'DONE', label: 'Готово', icon: CheckCircle }
  ];

  // Priority options
  const priorityOptions = [
    { value: 'LOW', label: 'Низкий' },
    { value: 'MEDIUM', label: 'Средний' },
    { value: 'HIGH', label: 'Высокий' },
    { value: 'URGENT', label: 'Срочно' }
  ];
  const getPriorityConfig = (priority?: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return { label: 'Срочно', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
      case 'HIGH':
        return { label: 'Высокий', color: 'bg-orange-100 text-orange-800', icon: TrendingUp };
      case 'MEDIUM':
        return { label: 'Средний', color: 'bg-yellow-100 text-yellow-800', icon: Circle };
      case 'LOW':
        return { label: 'Низкий', color: 'bg-green-100 text-green-800', icon: CheckCircle2 };
      default:
        return { label: 'Не указан', color: 'bg-gray-100 text-gray-800', icon: Circle };
    }
  };

  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case 'PENDING':
        return { label: 'В ожидании', color: 'bg-gray-100 text-gray-800' };
      case 'TODO':
        return { label: 'К выполнению', color: 'bg-slate-100 text-slate-800' };
      case 'IN_PROGRESS':
        return { label: 'В работе', color: 'bg-blue-100 text-blue-800' };
      case 'IN_REVIEW':
        return { label: 'На проверке', color: 'bg-purple-100 text-purple-800' };
      case 'DONE':
        return { label: 'Готово', color: 'bg-green-100 text-green-800' };
      case 'CANCELLED':
        return { label: 'Отменено', color: 'bg-red-100 text-red-800' };
      default:
        return { label: 'Неизвестно', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formattedDate = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    
    if (diffDays < 0) {
      return { text: `${formattedDate} (просрочено на ${Math.abs(diffDays)} дн.)`, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: `${formattedDate} (сегодня)`, isToday: true };
    } else if (diffDays === 1) {
      return { text: `${formattedDate} (завтра)`, isTomorrow: true };
    } else {
      return { text: `${formattedDate} (через ${diffDays} дн.)`, isUpcoming: true };
    }
  };

  const priorityConfig = getPriorityConfig(task.priority);
  const statusConfig = getStatusConfig(task.status);
  const PriorityIcon = priorityConfig.icon;
  const dueDateInfo = task.dueDate ? formatDueDate(task.dueDate) : null;

  return (
    <div className="space-y-6">
      {/* Основная информация */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{task.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={statusConfig.color}>
                  {statusConfig.label}
                </Badge>
                <Badge className={priorityConfig.color}>
                  <PriorityIcon className="h-3 w-3 mr-1" />
                  {priorityConfig.label}
                </Badge>
                <Badge variant="outline">
                  {task.type === 'PERSONAL' ? 'Личная' : 'Командная'}
                </Badge>
              </div>
            </div>
            
            {task.progress !== undefined && (
              <div className="text-right min-w-[120px]">
                <div className="text-sm text-muted-foreground mb-1">Прогресс</div>
                <div className="flex items-center gap-2">
                  <Progress value={task.progress} className="w-16" />
                  <span className="text-sm font-medium">{task.progress}%</span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {task.description && (
            <div>
              <h4 className="font-medium mb-2">Описание</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
          
          <Separator />
          
          {/* Метаинформация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Создатель:</span>
                <span className="font-medium">{creatorName || 'Неизвестно'}</span>
              </div>
              
              {assigneeName && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Исполнитель:</span>
                  <span className="font-medium">{assigneeName}</span>
                </div>
              )}
              
              {teamName && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Команда:</span>
                  <span className="font-medium">{teamName}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Создано:</span>
                <span>{formatDate(task.createdAt)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Обновлено:</span>
                <span>{formatDate(task.updatedAt)}</span>
              </div>
              
              {task.dueDate && dueDateInfo && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Срок:</span>
                  <span className={`font-medium ${
                    dueDateInfo.isOverdue ? 'text-red-600' :
                    dueDateInfo.isToday ? 'text-orange-600' :
                    dueDateInfo.isTomorrow ? 'text-yellow-600' :
                    'text-foreground'
                  }`}>
                    {dueDateInfo.text}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Теги */}
          {task.tags && task.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Теги</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Файлы */}
      <TaskAttachments
        taskId={task.id}
        attachments={task.attachments || []}
        canEdit={canEdit}
        onAttachmentsChange={onTaskUpdate}
      />
      
      {/* История активности */}
      <ActivityLog
        taskId={task.id}
        activities={task.activity}
      />
    </div>
  );
};

export default TaskDetails;