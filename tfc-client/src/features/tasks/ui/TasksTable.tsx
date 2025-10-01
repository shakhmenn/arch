import { FC, useState, useRef, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, CreateTaskPayload } from '@entities/task/model/types';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Checkbox } from '@/shared/ui/checkbox';
import { 
  MoreHorizontal, 
  Calendar, 
  User, 
  Paperclip, 
  AlertTriangle, 
  TrendingUp, 
  Circle, 
  CheckCircle2,
  Eye,
  Check,
  X,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { getUserFullName } from '@/shared/types/user';
import type { User as UserType } from '@/shared/types/user';

interface TasksTableProps {
  tasks: Task[];
  users?: UserType[];
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onViewDetails: (taskId: number) => void;
  onTaskUpdate: (taskId: number, updates: Partial<Task>) => void;
  onCreateTask: (task: CreateTaskPayload) => void;
  onBulkStatusChange?: (taskIds: number[], status: TaskStatus) => void;
  onBulkDelete?: (taskIds: number[]) => void;
  onStartInlineCreate?: () => void;
  isUpdating?: boolean;
}

interface EditingTask {
  id: number;
  field: 'title' | 'status' | 'priority' | 'dueDate' | 'assigneeId';
  value: string;
}

const getPriorityConfig = (priority: TaskPriority) => {
  const configs = {
    URGENT: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', label: 'Срочный' },
    HIGH: { icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Высокий' },
    MEDIUM: { icon: Circle, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Средний' },
    LOW: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', label: 'Низкий' }
  };
  return configs[priority];
};

const getStatusConfig = (status: TaskStatus) => {
  const configs = {
    TODO: { label: 'К выполнению', color: 'bg-gray-100 text-gray-800', dot: 'bg-gray-400' },
    PENDING: { label: 'Ожидает', color: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
    IN_PROGRESS: { label: 'В работе', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
    IN_REVIEW: { label: 'На проверке', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
    DONE: { label: 'Выполнено', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
    CANCELLED: { label: 'Отменено', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' }
  };
  return configs[status] || configs.TODO;
};

const TasksTable: FC<TasksTableProps> = ({ 
  tasks, 
  users = [], 
  onStatusChange, 
  onViewDetails, 
  onTaskUpdate,
  onCreateTask,
  onBulkStatusChange,
  onBulkDelete,
  onStartInlineCreate,
  isUpdating = false 
}) => {
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [editingTask, setEditingTask] = useState<EditingTask | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: '',
    assigneeId: undefined as number | undefined,
    description: '',
    tags: [] as string[]
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(tasks.map(t => t.id)));
    } else {
      setSelectedTasks(new Set());
    }
  };

  const handleSelectTask = (taskId: number, checked: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (checked) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Завтра';
    if (diffDays === -1) return 'Вчера';
    if (diffDays > 0 && diffDays <= 7) return `Через ${diffDays} дн.`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} дн. назад`;
    
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getAssigneeName = (assigneeId?: number) => {
    if (!assigneeId) return '—';
    const user = users.find(u => u.id === assigneeId);
    return user ? getUserFullName(user) : '—';
  };

  const startEditing = (taskId: number, field: EditingTask['field'], currentValue: string) => {
    setEditingTask({ id: taskId, field, value: currentValue });
  };

  const saveEdit = () => {
    if (!editingTask) return;
    
    const updates: Partial<Task> = {};
    
    if (editingTask.field === 'title') {
      updates.title = editingTask.value;
    } else if (editingTask.field === 'status') {
      updates.status = editingTask.value as TaskStatus;
    } else if (editingTask.field === 'priority') {
      updates.priority = editingTask.value as TaskPriority;
    } else if (editingTask.field === 'dueDate') {
      updates.dueDate = editingTask.value || null;
    } else if (editingTask.field === 'assigneeId') {
      updates.assigneeId = editingTask.value ? parseInt(editingTask.value) : null;
    }
    
    onTaskUpdate(editingTask.id, updates);
    setEditingTask(null);
  };

  const cancelEdit = () => {
    setEditingTask(null);
  };

  const createNewTask = () => {
    if (!newTask.title.trim()) return;
    
    onCreateTask({
      type: 'PERSONAL',
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority as TaskPriority,
      dueDate: newTask.dueDate || undefined,
      assigneeId: newTask.assigneeId || undefined,
      tags: newTask.tags
    });
    
    setNewTask({
      title: '',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: '',
      assigneeId: undefined,
      description: '',
      tags: []
    });
    setIsCreatingNew(false);
  };

  const cancelNewTask = () => {
    setNewTask({
      title: '',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: '',
      assigneeId: undefined,
      description: '',
      tags: []
    });
    setIsCreatingNew(false);
  };

  useEffect(() => {
    if (editingTask && inputRef.current) {
      inputRef.current.focus();
      // Метод select() работает только для input элементов, не для select
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [editingTask]);

  // Обработка внешнего вызова создания новой задачи
  useEffect(() => {
    if (onStartInlineCreate) {
      // Создаем функцию для активации inline создания
      const startInlineCreate = () => {
        setIsCreatingNew(true);
      };
      // Сохраняем функцию в глобальном объекте для доступа извне
      (window as any).startInlineTaskCreate = startInlineCreate;
    }
  }, [onStartInlineCreate]);

  // Функция для активации создания новой задачи извне
  const activateInlineCreate = () => {
    setIsCreatingNew(true);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden relative">
      {/* Панель массовых действий */}
      {selectedTasks.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">
                Выбрано задач: {selectedTasks.size}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onBulkStatusChange && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => onBulkStatusChange(Array.from(selectedTasks), TaskStatus.IN_PROGRESS)}
                  >
                    В работу
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => onBulkStatusChange(Array.from(selectedTasks), TaskStatus.DONE)}
                  >
                    Завершить
                  </Button>
                </>
              )}
              {onBulkDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (confirm(`Удалить ${selectedTasks.size} задач?`)) {
                      onBulkDelete(Array.from(selectedTasks));
                      setSelectedTasks(new Set());
                    }
                  }}
                >
                  Удалить
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setSelectedTasks(new Set())}
              >
                Отменить
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Заголовок таблицы */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-1 flex items-center">
            <Checkbox 
              checked={selectedTasks.size === tasks.length && tasks.length > 0}
              onCheckedChange={handleSelectAll}
              className="h-4 w-4"
            />
          </div>
          <div className="col-span-4 flex items-center justify-between">
            <span>Задача</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-200"
              onClick={() => setIsCreatingNew(true)}
              title="Добавить задачу"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="col-span-2">Исполнитель</div>
          <div className="col-span-2">Срок</div>
          <div className="col-span-2">Статус</div>
          <div className="col-span-1">Действия</div>
        </div>
      </div>

      {/* Строки таблицы */}
      <div className="divide-y divide-gray-200">
        {/* Строка создания новой задачи */}
        {isCreatingNew && (
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-blue-50 border-l-4 border-blue-400">
            {/* Чекбокс */}
            <div className="col-span-1 flex items-center">
              <div className="h-4 w-4" />
            </div>

            {/* Название задачи */}
            <div className="col-span-4 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Введите название задачи..."
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createNewTask();
                  if (e.key === 'Escape') cancelNewTask();
                }}
              />
            </div>

            {/* Исполнитель */}
            <div className="col-span-2 flex items-center">
              <select
                value={newTask.assigneeId || ''}
                onChange={(e) => setNewTask(prev => ({ ...prev, assigneeId: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Не назначено</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {getUserFullName(user)}
                  </option>
                ))}
              </select>
            </div>

            {/* Срок */}
            <div className="col-span-2 flex items-center">
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Статус */}
            <div className="col-span-2 flex items-center">
              <select
                value={newTask.status}
                onChange={(e) => setNewTask(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PENDING">В ожидании</option>
                <option value="IN_PROGRESS">В работе</option>
                <option value="DONE">Готово</option>
              </select>
            </div>

            {/* Действия */}
            <div className="col-span-1 flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-green-100"
                onClick={createNewTask}
                title="Сохранить"
              >
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-red-100"
                onClick={cancelNewTask}
                title="Отмена"
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          </div>
        )}
        
        {tasks.map((task) => {
          const priorityConfig = getPriorityConfig(task.priority);
          const statusConfig = getStatusConfig(task.status);
          const PriorityIcon = priorityConfig.icon;
          const isSelected = selectedTasks.has(task.id);
          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

          return (
            <div 
              key={task.id} 
              className={`grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors ${
                isSelected ? 'bg-blue-50' : ''
              }`}
            >
              {/* Чекбокс */}
              <div className="col-span-1 flex items-center">
                <Checkbox 
                  checked={isSelected}
                  onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
                  className="h-4 w-4"
                />
              </div>

              {/* Название задачи */}
              <div className="col-span-4 flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-1 flex-shrink-0">
                  <PriorityIcon className={`h-3 w-3 ${priorityConfig.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  {editingTask?.id === task.id && editingTask.field === 'title' ? (
                    <div className="flex items-center gap-1">
                      <input
                        ref={inputRef}
                        type="text"
                        value={editingTask.value}
                        onChange={(e) => setEditingTask(prev => prev ? { ...prev, value: e.target.value } : null)}
                        className="flex-1 px-1 py-0.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        onBlur={saveEdit}
                      />
                    </div>
                  ) : (
                    <div 
                      className="font-medium text-sm text-gray-900 truncate cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                      onClick={() => startEditing(task.id, 'title', task.title)}
                    >
                      {task.title}
                    </div>
                  )}
                  {task.description && (
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {task.description}
                    </div>
                  )}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {task.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs px-1 py-0 h-4">
                          {tag}
                        </Badge>
                      ))}
                      {task.tags.length > 2 && (
                        <span className="text-xs text-gray-400">+{task.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
                {task.attachments && task.attachments.length > 0 && (
                  <div className="flex items-center gap-1 text-gray-400 flex-shrink-0">
                    <Paperclip className="h-3 w-3" />
                    <span className="text-xs">{task.attachments.length}</span>
                  </div>
                )}
              </div>

              {/* Исполнитель */}
              <div className="col-span-2 flex items-center">
                <div className="flex items-center gap-2 min-w-0 w-full">
                  <User className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  {editingTask?.id === task.id && editingTask.field === 'assigneeId' ? (
                    <select
                      ref={inputRef as any}
                      value={editingTask.value}
                      onChange={(e) => setEditingTask(prev => prev ? { ...prev, value: e.target.value } : null)}
                      className="flex-1 px-1 py-0.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      onBlur={saveEdit}
                    >
                      <option value="">Не назначено</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {getUserFullName(user)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span 
                      className="text-sm text-gray-600 truncate cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded flex-1"
                      onClick={() => startEditing(task.id, 'assigneeId', task.assigneeId?.toString() || '')}
                    >
                      {getAssigneeName(task.assigneeId)}
                    </span>
                  )}
                </div>
              </div>

              {/* Срок */}
              <div className="col-span-2 flex items-center">
                <div className="flex items-center gap-2 w-full">
                  <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  {editingTask?.id === task.id && editingTask.field === 'dueDate' ? (
                    <input
                      ref={inputRef}
                      type="date"
                      value={editingTask.value}
                      onChange={(e) => setEditingTask(prev => prev ? { ...prev, value: e.target.value } : null)}
                      className="flex-1 px-1 py-0.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      onBlur={saveEdit}
                    />
                  ) : (
                    <span 
                      className={`text-sm cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded flex-1 ${
                        isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
                      }`}
                      onClick={() => startEditing(task.id, 'dueDate', task.dueDate || '')}
                    >
                      {task.dueDate ? formatDate(task.dueDate) : '—'}
                    </span>
                  )}
                </div>
              </div>

              {/* Статус */}
              <div className="col-span-2 flex items-center">
                <div className="flex items-center gap-2 w-full">
                  <div className={`w-2 h-2 rounded-full ${statusConfig.dot} flex-shrink-0`} />
                  {editingTask?.id === task.id && editingTask.field === 'status' ? (
                    <select
                      ref={inputRef as any}
                      value={editingTask.value}
                      onChange={(e) => setEditingTask(prev => prev ? { ...prev, value: e.target.value } : null)}
                      className="flex-1 px-1 py-0.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      onBlur={saveEdit}
                    >
                      <option value="PENDING">В ожидании</option>
                      <option value="IN_PROGRESS">В работе</option>
                      <option value="DONE">Готово</option>
                    </select>
                  ) : (
                    <span 
                      className="text-sm text-gray-600 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded flex-1"
                      onClick={() => startEditing(task.id, 'status', task.status)}
                    >
                      {statusConfig.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Действия */}
              <div className="col-span-1 flex items-center justify-end">
                <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 hover:bg-muted"
                  onClick={() => onViewDetails(task.id)}
                  title="Детали"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 hover:bg-muted"
                      disabled={isUpdating}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-[100]">
                    <DropdownMenuItem onClick={() => onStatusChange(task.id, 'IN_PROGRESS')}>
                      В работу
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(task.id, 'DONE')}>
                      Завершить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Пустое состояние */}
      {tasks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-sm">Нет задач для отображения</div>
        </div>
      )}
    </div>
  );
};

export default TasksTable;