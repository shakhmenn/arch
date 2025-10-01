import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  Separator,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
} from '@/shared/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import {
  Search,
  Plus,
  X,
  Link,
  Unlink,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  GitBranch,
  Loader2,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  useTaskDependenciesQuery,
  useTaskDependentsQuery,
  useCreateTaskDependencyMutation,
  useDeleteTaskDependencyMutation,
  useTaskSearchMutation,
} from '../api/tasks-api';
import type { Task, TaskDependency } from '../types/task';

interface TaskDependenciesDialogProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  dueDate?: string;
}

const statusConfig = {
  PENDING: { label: 'В ожидании', color: 'bg-gray-100 text-gray-800', icon: Clock },
  TODO: { label: 'К выполнению', color: 'bg-slate-100 text-slate-800', icon: Clock },
  IN_PROGRESS: { label: 'В работе', color: 'bg-blue-100 text-blue-800', icon: Clock },
  IN_REVIEW: { label: 'На проверке', color: 'bg-purple-100 text-purple-800', icon: Clock },
  DONE: { label: 'Выполнено', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Отменено', color: 'bg-red-100 text-red-800', icon: X },
};

const priorityConfig = {
  LOW: { label: 'Низкий', color: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Средний', color: 'bg-blue-100 text-blue-600' },
  HIGH: { label: 'Высокий', color: 'bg-orange-100 text-orange-600' },
  URGENT: { label: 'Критический', color: 'bg-red-100 text-red-600' },
};

export const TaskDependenciesDialog: React.FC<TaskDependenciesDialogProps> = ({
  taskId,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // API hooks
  const { data: dependencies, isLoading: dependenciesLoading } = useTaskDependenciesQuery(taskId);
  const { data: dependents, isLoading: dependentsLoading } = useTaskDependentsQuery(taskId);
  const { mutate: searchTasks } = useTaskSearchMutation();
  const { mutate: createDependency, isPending: isCreating } = useCreateTaskDependencyMutation();
  const { mutate: deleteDependency, isPending: isDeleting } = useDeleteTaskDependencyMutation();

  // Search for tasks
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      searchTasks(
        { query, excludeTaskId: taskId },
        {
          onSuccess: (data) => {
            setSearchResults(data.tasks || []);
          },
          onError: () => {
            setSearchResults([]);
          },
          onSettled: () => {
            setIsSearching(false);
          },
        }
      );
    } catch (error) {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Add dependency
  const handleAddDependency = (dependsOnTaskId: string) => {
    createDependency(
      {
        taskId,
        dependsOnTaskId,
      },
      {
        onSuccess: () => {
          setSelectedTasks([]);
          setSearchQuery('');
          setSearchResults([]);
          onSuccess?.();
        },
      }
    );
  };

  // Remove dependency
  const handleRemoveDependency = (dependencyId: string) => {
    deleteDependency(dependencyId, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  // Add multiple dependencies
  const handleAddSelectedDependencies = () => {
    selectedTasks.forEach((dependsOnTaskId) => {
      handleAddDependency(dependsOnTaskId);
    });
  };

  // Toggle task selection
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Check if task is already a dependency
  const isAlreadyDependency = (taskId: string) => {
    return dependencies?.some((dep) => dep.dependsOnTask.id === taskId);
  };

  // Render task item
  const renderTaskItem = (task: SearchResult, showActions = true) => {
    const statusInfo = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.TODO;
    const priorityInfo = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;
    const StatusIcon = statusInfo.icon;
    const isSelected = selectedTasks.includes(task.id);
    const isAlreadyAdded = isAlreadyDependency(task.id);

    return (
      <Card key={task.id} className={cn(
        'transition-all duration-200 hover:shadow-md',
        isSelected && 'ring-2 ring-blue-500',
        isAlreadyAdded && 'opacity-50'
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-sm truncate">{task.title}</h4>
                <Badge variant="outline" className={cn('text-xs px-2 py-1', statusInfo.color)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusInfo.label}
                </Badge>
                <Badge variant="outline" className={cn('text-xs px-2 py-1', priorityInfo.color)}>
                  {priorityInfo.label}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {task.assignee && (
                  <span>Исполнитель: {task.assignee.name}</span>
                )}
                {task.dueDate && (
                  <span>Срок: {new Date(task.dueDate).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            
            {showActions && (
              <div className="flex items-center gap-2">
                {isAlreadyAdded ? (
                  <Badge variant="secondary" className="text-xs">
                    Уже добавлено
                  </Badge>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTaskSelection(task.id)}
                      className={cn(
                        'h-8 w-8 p-0',
                        isSelected && 'bg-blue-100 text-blue-700'
                      )}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddDependency(task.id)}
                      disabled={isCreating}
                      className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-700"
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Управление зависимостями задач
            </DialogTitle>
            <DialogDescription>
              Настройте зависимости между задачами для правильного планирования работы
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="dependencies" className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dependencies">Зависимости</TabsTrigger>
              <TabsTrigger value="dependents">Зависимые задачи</TabsTrigger>
              <TabsTrigger value="add">Добавить зависимость</TabsTrigger>
            </TabsList>

            <TabsContent value="dependencies" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Задачи, от которых зависит текущая</h3>
                {dependencies && dependencies.length > 0 && (
                  <Badge variant="outline">{dependencies.length}</Badge>
                )}
              </div>
              
              {dependenciesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : dependencies && dependencies.length > 0 ? (
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {dependencies.map((dependency) => (
                      <Card key={dependency.id} className="transition-all duration-200 hover:shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {renderTaskItem(dependency.dependsOnTask, false)}
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveDependency(dependency.id)}
                                  disabled={isDeleting}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                                >
                                  <Unlink className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Удалить зависимость</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    У этой задачи нет зависимостей. Вы можете добавить их на вкладке "Добавить зависимость".
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="dependents" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Задачи, которые зависят от текущей</h3>
                {dependents && dependents.length > 0 && (
                  <Badge variant="outline">{dependents.length}</Badge>
                )}
              </div>
              
              {dependentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : dependents && dependents.length > 0 ? (
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {dependents.map((dependent) => (
                      <Card key={dependent.id} className="transition-all duration-200 hover:shadow-md">
                        <CardContent className="p-4">
                          {renderTaskItem(dependent.task, false)}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    От этой задачи не зависят другие задачи.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="add" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск задач для добавления зависимости..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {selectedTasks.length > 0 && (
                    <Button
                      onClick={handleAddSelectedDependencies}
                      disabled={isCreating}
                      className="flex items-center gap-2"
                    >
                      {isCreating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Link className="h-4 w-4" />
                      )}
                      Добавить ({selectedTasks.length})
                    </Button>
                  )}
                </div>

                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {searchResults.map((task) => renderTaskItem(task))}
                    </div>
                  </ScrollArea>
                ) : searchQuery ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      По запросу "{searchQuery}" ничего не найдено.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Search className="h-4 w-4" />
                    <AlertDescription>
                      Введите название задачи для поиска и добавления зависимости.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default TaskDependenciesDialog;