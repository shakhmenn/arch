import React, { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Separator } from '@/shared/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Activity,
  Calendar as CalendarIcon,
  Clock,
  Edit3,
  MessageSquare,
  Plus,
  Trash2,
  User,
  FileText,
  Link,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Filter,
  RefreshCw,
  ChevronDown,
  Eye,
  Download,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import {
  TaskActivity,
  TaskActivityType,
  TaskStatus,
  TaskPriority,
} from '@/entities/task/model/types';
import { useTaskActivityQuery } from '@/features/tasks/api/tasks-api';

interface ActivityLogProps {
  taskId: string;
  className?: string;
}

interface ActivityFilters {
  type?: TaskActivityType;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

const activityTypeConfig = {
  [TaskActivityType.CREATED]: {
    icon: Plus,
    label: 'Создана',
    color: 'bg-green-100 text-green-800 border-green-200',
    iconColor: 'text-green-600',
  },
  [TaskActivityType.UPDATED]: {
    icon: Edit3,
    label: 'Обновлена',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    iconColor: 'text-blue-600',
  },
  [TaskActivityType.STATUS_CHANGED]: {
    icon: CheckCircle2,
    label: 'Статус изменен',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    iconColor: 'text-purple-600',
  },
  [TaskActivityType.PRIORITY_CHANGED]: {
    icon: AlertCircle,
    label: 'Приоритет изменен',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    iconColor: 'text-orange-600',
  },
  [TaskActivityType.ASSIGNED]: {
    icon: User,
    label: 'Назначена',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    iconColor: 'text-cyan-600',
  },
  [TaskActivityType.UNASSIGNED]: {
    icon: XCircle,
    label: 'Снято назначение',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    iconColor: 'text-gray-600',
  },
  [TaskActivityType.COMMENTED]: {
    icon: MessageSquare,
    label: 'Комментарий',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    iconColor: 'text-indigo-600',
  },
  [TaskActivityType.ATTACHMENT_ADDED]: {
    icon: FileText,
    label: 'Файл добавлен',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    iconColor: 'text-teal-600',
  },
  [TaskActivityType.ATTACHMENT_REMOVED]: {
    icon: Trash2,
    label: 'Файл удален',
    color: 'bg-red-100 text-red-800 border-red-200',
    iconColor: 'text-red-600',
  },
  [TaskActivityType.DEPENDENCY_ADDED]: {
    icon: Link,
    label: 'Зависимость добавлена',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    iconColor: 'text-yellow-600',
  },
  [TaskActivityType.DEPENDENCY_REMOVED]: {
    icon: XCircle,
    label: 'Зависимость удалена',
    color: 'bg-red-100 text-red-800 border-red-200',
    iconColor: 'text-red-600',
  },
  [TaskActivityType.SUBTASK_ADDED]: {
    icon: Plus,
    label: 'Подзадача добавлена',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    iconColor: 'text-emerald-600',
  },
  [TaskActivityType.SUBTASK_REMOVED]: {
    icon: Trash2,
    label: 'Подзадача удалена',
    color: 'bg-red-100 text-red-800 border-red-200',
    iconColor: 'text-red-600',
  },
};

const statusLabels = {
  [TaskStatus.TODO]: 'К выполнению',
  [TaskStatus.IN_PROGRESS]: 'В работе',
  [TaskStatus.IN_REVIEW]: 'На проверке',
  [TaskStatus.DONE]: 'Выполнено',
  [TaskStatus.CANCELLED]: 'Отменено',
};

const priorityLabels = {
  [TaskPriority.LOW]: 'Низкий',
  [TaskPriority.MEDIUM]: 'Средний',
  [TaskPriority.HIGH]: 'Высокий',
  [TaskPriority.URGENT]: 'Срочный',
};

export const ActivityLog: React.FC<ActivityLogProps> = ({ taskId, className }) => {
  const [filters, setFilters] = useState<ActivityFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useTaskActivityQuery(taskId, {
    ...filters,
    limit: 20,
  });

  const activities = data?.pages?.flatMap(page => page.activities) || [];

  const toggleActivityExpansion = (activityId: string) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  const renderActivityContent = (activity: TaskActivity) => {
    const config = activityTypeConfig[activity.type];
    const Icon = config.icon;
    const isExpanded = expandedActivities.has(activity.id);

    let changeDescription = '';
    if (activity.changes) {
      const changes = JSON.parse(activity.changes);
      if (activity.type === TaskActivityType.STATUS_CHANGED) {
        changeDescription = `${statusLabels[changes.from as TaskStatus]} → ${statusLabels[changes.to as TaskStatus]}`;
      } else if (activity.type === TaskActivityType.PRIORITY_CHANGED) {
        changeDescription = `${priorityLabels[changes.from as TaskPriority]} → ${priorityLabels[changes.to as TaskPriority]}`;
      } else if (activity.type === TaskActivityType.ASSIGNED) {
        changeDescription = `Назначено: ${changes.assigneeName}`;
      } else if (activity.type === TaskActivityType.DEPENDENCY_ADDED) {
        changeDescription = `Добавлена зависимость от задачи #${changes.dependencyId}`;
      } else if (activity.type === TaskActivityType.SUBTASK_ADDED) {
        changeDescription = `Добавлена подзадача: ${changes.subtaskTitle}`;
      }
    }

    return (
      <div className="flex gap-3 p-4 hover:bg-muted/50 transition-colors">
        <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', config.color)}>
          <Icon className={cn('h-4 w-4', config.iconColor)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={cn('text-xs', config.color)}>
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={activity.user.avatar} />
                  <AvatarFallback className="text-xs">
                    {activity.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{activity.user.name}</span>
              </div>

              {changeDescription && (
                <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  {changeDescription}
                </div>
              )}

              {activity.description && (
                <div className="text-sm">
                  {isExpanded || activity.description.length <= 100 ? (
                    activity.description
                  ) : (
                    <>
                      {activity.description.substring(0, 100)}...
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 ml-1 text-xs"
                        onClick={() => toggleActivityExpansion(activity.id)}
                      >
                        показать больше
                      </Button>
                    </>
                  )}
                  {isExpanded && activity.description.length > 100 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 ml-1 text-xs"
                      onClick={() => toggleActivityExpansion(activity.id)}
                    >
                      свернуть
                    </Button>
                  )}
                </div>
              )}

              {activity.metadata && (
                <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                  <details>
                    <summary className="cursor-pointer hover:text-foreground">
                      Дополнительная информация
                    </summary>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {JSON.stringify(JSON.parse(activity.metadata), null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground">
              {format(new Date(activity.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            История активности
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            История активности
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Ошибка загрузки истории активности</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Попробовать снова
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              История активности
            </CardTitle>
            <CardDescription>
              {activities.length > 0 ? `${activities.length} записей` : 'Нет записей'}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(hasActiveFilters && 'border-primary')}
            >
              <Filter className="h-4 w-4 mr-2" />
              Фильтры
              <ChevronDown className={cn('h-4 w-4 ml-2 transition-transform', showFilters && 'rotate-180')} />
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="activity-type">Тип активности</Label>
                <Select
                  value={filters.type || ''}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as TaskActivityType || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Все типы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Все типы</SelectItem>
                    {Object.entries(activityTypeConfig).map(([type, config]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date-from">Дата от</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateFrom ? format(filters.dateFrom, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value ? new Date(e.target.value) : undefined }))}
                />
              </div>

              <div>
                <Label htmlFor="date-to">Дата до</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.dateTo ? format(filters.dateTo, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value ? new Date(e.target.value) : undefined }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="search">Поиск по описанию</Label>
              <Input
                id="search"
                placeholder="Введите текст для поиска..."
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value || undefined }))}
              />
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Очистить фильтры
                </Button>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">Нет записей активности</p>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters ? 'Попробуйте изменить фильтры' : 'Активность появится здесь после изменений в задаче'}
            </p>
          </div>
        ) : (
          <div className="h-[600px] overflow-y-auto">
            <div className="divide-y">
              {activities.map((activity, index) => (
                <div key={activity.id}>
                  {renderActivityContent(activity)}
                </div>
              ))}
              
              {hasNextPage && (
                <div className="p-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Загрузить еще
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLog;