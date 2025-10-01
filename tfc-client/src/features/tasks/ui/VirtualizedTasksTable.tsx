import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import type { ListChildComponentProps } from 'react-window';
import { InfiniteLoader } from 'react-window-infinite-loader';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Spinner } from '@/shared/ui/spinner';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/avatar';
import { TaskStatusBadge, TaskPriorityBadge } from '@/shared/ui/badge';
import { InlineEdit, InlineSelect } from '@/shared/ui/inline-edit';
import { EditIconButton, DeleteIconButton, MoreIconButton } from '@/shared/ui/icon-button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/shared/ui/table';
import { useTasksQuery, useBulkUpdateTasksMutation, useBulkDeleteTasksMutation, useUpdateTaskMutation } from '@/shared/api';
import ColumnSettings from './ColumnSettings';
import TableFilters, { FilterValue } from './TableFilters';
import BulkActionsMenu from './BulkActionsMenu';
import type { Task, TaskFilters, TaskSortOptions, GetTasksRequest, TaskStatus, TaskPriority } from '@/entities/task';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Filter, Search, Plus } from 'lucide-react';

// Column configuration
export interface TableColumn {
  key: keyof Task | 'select' | 'actions';
  label: string;
  width: number;
  sortable?: boolean;
  resizable?: boolean;
  visible?: boolean;
  render?: (task: Task, value: any, context?: {
    onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
    users?: Array<{ id: string; name: string; avatar?: string }>;
  }) => React.ReactNode;
}

const DEFAULT_COLUMNS: TableColumn[] = [
  {
    key: 'select',
    label: '',
    width: 50,
    sortable: false,
    resizable: false,
    visible: true
  },
  {
    key: 'title',
    label: 'Task',
    width: 300,
    sortable: true,
    resizable: true,
    visible: true,
    render: (task, value, { onTaskUpdate }) => (
      <div className="flex flex-col gap-1">
        <InlineEdit
          value={task.title}
          onSave={(newTitle) => onTaskUpdate?.(task.id, { title: newTitle })}
          placeholder="Task title..."
          className="font-medium text-sm"
          maxLength={200}
        />
        {task.description && (
          <InlineEdit
            value={task.description}
            onSave={(newDescription) => onTaskUpdate?.(task.id, { description: newDescription })}
            placeholder="Add description..."
            className="text-xs text-muted-foreground"
            multiline
            maxLength={500}
          />
        )}
      </div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    width: 120,
    sortable: true,
    resizable: true,
    visible: true,
    render: (task, value, { onTaskUpdate }) => (
      <InlineSelect
        value={task.status}
        options={[
          { value: 'todo' as TaskStatus, label: 'To Do' },
          { value: 'in_progress' as TaskStatus, label: 'In Progress' },
          { value: 'completed' as TaskStatus, label: 'Completed' },
          { value: 'cancelled' as TaskStatus, label: 'Cancelled' }
        ]}
        onSave={(newStatus) => onTaskUpdate?.(task.id, { status: newStatus as TaskStatus })}
        renderDisplay={(value, option) => <TaskStatusBadge status={value as TaskStatus} />}
      />
    )
  },
  {
    key: 'priority',
    label: 'Priority',
    width: 100,
    sortable: true,
    resizable: true,
    visible: true,
    render: (task, value, { onTaskUpdate }) => (
       <InlineSelect
         value={task.priority}
         options={[
           { value: 'low' as TaskPriority, label: 'Low' },
           { value: 'medium' as TaskPriority, label: 'Medium' },
           { value: 'high' as TaskPriority, label: 'High' },
           { value: 'urgent' as TaskPriority, label: 'Urgent' }
         ]}
         onSave={(newPriority) => onTaskUpdate?.(task.id, { priority: newPriority as TaskPriority })}
         renderDisplay={(value, option) => <TaskPriorityBadge priority={value as TaskPriority} />}
       />
     )
  },
  {
    key: 'assignee',
    label: 'Assignee',
    width: 150,
    sortable: true,
    resizable: true,
    visible: true,
    render: (task, value, { onTaskUpdate, users = [] }) => (
      <InlineSelect
        value={task.assignee?.id || ''}
        options={[
          { value: '', label: 'Unassigned' },
          ...users.map(user => ({ value: user.id, label: user.name }))
        ]}
        onSave={(newAssigneeId) => onTaskUpdate?.(task.id, { assigneeId: newAssigneeId || null })}
        renderDisplay={(value, option) => {
          if (!value || !task.assignee) {
            return <span className="text-sm text-muted-foreground">Unassigned</span>;
          }
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={task.assignee.avatar} />
                <AvatarFallback className="text-xs">
                  {task.assignee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm truncate">{task.assignee.name}</span>
            </div>
          );
        }}
      />
    )
  },
  {
    key: 'dueDate',
    label: 'Due Date',
    width: 140,
    sortable: true,
    resizable: true,
    visible: true,
    render: (task, value, { onTaskUpdate }) => (
      <InlineEdit
        value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
        onSave={(newDate) => onTaskUpdate?.(task.id, { dueDate: newDate ? new Date(newDate).toISOString() : null })}
        placeholder="Set due date..."
        type="date"
        renderDisplay={(value) => {
          if (!value || !task.dueDate) {
            return <span className="text-sm text-muted-foreground">No due date</span>;
          }
          const isOverdue = new Date(task.dueDate) < new Date();
          return (
            <span className={cn(
              'text-sm',
              isOverdue ? 'text-red-600' : 'text-foreground'
            )}>
              {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
            </span>
          );
        }}
      />
     )
   },
   {
    key: 'createdAt',
    label: 'Created',
    width: 120,
    sortable: true,
    resizable: true,
    visible: true,
    render: (task) => (
      <span className="text-sm text-muted-foreground">
        {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
      </span>
    )
  },
  {
    key: 'actions',
    label: '',
    width: 100,
    sortable: false,
    resizable: false,
    visible: true
  }
];

// Row height constant
const ROW_HEIGHT = 60;
const HEADER_HEIGHT = 40;

// Props interface
interface VirtualizedTasksTableProps {
  filters?: TaskFilters;
  sorting?: TaskSortOptions;
  onTaskClick?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  onFiltersChange?: (filters: TaskFilters) => void;
  onSortingChange?: (sorting: TaskSortOptions) => void;
  columns?: TableColumn[];
  height?: number;
  className?: string;
}

// Row component for virtualization
interface TaskRowProps extends ListChildComponentProps {
  data: {
    tasks: Task[];
    columns: TableColumn[];
    selectedTasks: Set<string>;
    onTaskSelect: (taskId: string, selected: boolean) => void;
    onTaskClick?: (task: Task) => void;
    onTaskEdit?: (task: Task) => void;
    onTaskDelete?: (task: Task) => void;
    onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
    users?: Array<{ id: string; name: string; avatar?: string }>;
  };
}

const TaskRow: React.FC<TaskRowProps> = ({ index, style, data }) => {
  // Comprehensive logging for debugging react-window data
  console.debug('🔍 TaskRow received:', {
    index,
    style,
    data,
    dataType: typeof data,
    dataIsNull: data === null,
    dataIsUndefined: data === undefined,
    dataKeys: data ? Object.keys(data) : 'no data',
    dataValues: data ? Object.values(data).map(v => typeof v) : 'no data'
  });
  
  // Check if data contains any undefined/null values
  if (data && typeof data === 'object') {
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        console.error(`❌ TaskRow found ${value} in data.${key}`);
      }
    });
  }
  
  // Comprehensive safety checks for all data properties
  if (!data || typeof data !== 'object') {
    console.error('❌ TaskRow: Invalid data received', { data, index });
    return (
      <div style={style} className="flex items-center px-4 py-2 border-b border-gray-200">
        <div className="text-gray-500">Invalid data</div>
      </div>
    );
  }

  const { 
    tasks = [], 
    columns = [], 
    selectedTasks = new Set(), 
    onTaskSelect = () => {}, 
    onTaskClick = () => {}, 
    onTaskEdit = () => {}, 
    onTaskDelete = () => {}, 
    onTaskUpdate = () => {}, 
    users = [] 
  } = data;

  // Ensure index is valid and task exists
  if (typeof index !== 'number' || index < 0 || !Array.isArray(tasks) || index >= tasks.length) {
    return (
      <div style={style} className="flex items-center px-4 py-2 border-b border-gray-200">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const task = tasks[index];

  // Ensure task object is valid
  if (!task || typeof task !== 'object' || !task.id) {
    return (
      <div style={style} className="flex items-center px-4 py-2 border-b border-gray-200">
        <div className="text-gray-500">Invalid task</div>
      </div>
    );
  }

  const isSelected = selectedTasks.has(task.id);
  const visibleColumns = columns.filter(col => col.visible);

  return (
    <div 
      style={style} 
      className={cn(
        'flex items-center border-b border-border hover:bg-muted/50 cursor-pointer',
        isSelected && 'bg-muted'
      )}
      onClick={() => onTaskClick?.(task)}
    >
      {visibleColumns.map((column) => {
        const width = column.width;
        
        if (column.key === 'select') {
          return (
            <div key={column.key} style={{ width }} className="flex items-center justify-center px-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onTaskSelect(task.id, !!checked)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          );
        }
        
        if (column.key === 'actions') {
          return (
            <div key={column.key} style={{ width }} className="flex items-center justify-end gap-1 px-2">
              <EditIconButton 
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskEdit?.(task);
                }}
              />
              <DeleteIconButton 
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskDelete?.(task);
                }}
              />
              <MoreIconButton 
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          );
        }
        
        const value = task[column.key as keyof Task];
        // Ensure value is never undefined to prevent Object.values errors in react-window
        const safeValue = value !== undefined && value !== null ? value : '';
        
        // Additional safety check for render function parameters
        const safeTask = { ...task };
        // Remove any undefined/null properties from task object
        Object.keys(safeTask).forEach(key => {
          if (safeTask[key as keyof Task] === undefined || safeTask[key as keyof Task] === null) {
            (safeTask as any)[key] = '';
          }
        });
        
        const content = column.render ? column.render(safeTask, safeValue, { onTaskUpdate, users }) : String(safeValue);
        
        return (
          <div 
            key={column.key} 
            style={{ width }} 
            className="flex items-center px-3 py-2 truncate"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
};

// Main component
const VirtualizedTasksTable: React.FC<VirtualizedTasksTableProps> = ({
  filters = {},
  sorting = { field: 'createdAt', direction: 'desc' },
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onFiltersChange,
  onSortingChange,
  columns = DEFAULT_COLUMNS,
  height = 600,
  className
}) => {
  console.log('🚀 VirtualizedTasksTable component is rendering');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [tableColumns, setTableColumns] = useState(columns);
  const [tableFilters, setTableFilters] = useState<FilterValue[]>([]);
  const [List, setList] = useState<any>(null);
  const listRef = useRef<List>(null);
  
  // Dynamic import of react-window List component
  useEffect(() => {
    import('react-window').then(({ FixedSizeList }) => {
      setList(() => FixedSizeList);
    }).catch(error => {
      console.error('Failed to load react-window:', error);
    });
  }, []);
  
  // Mutations for inline editing
  const updateTaskMutation = useUpdateTaskMutation();
  
  // Handle task updates from inline editing
  const handleTaskUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      await updateTaskMutation.mutateAsync({ id: taskId, ...updates });
      // The query will be invalidated automatically by the mutation
    } catch (error) {
      console.error('Failed to update task:', error);
      // You might want to show a toast notification here
    }
  }, [updateTaskMutation]);
  
  const pageSize = Math.ceil(height / ROW_HEIGHT) + 10; // Buffer for smooth scrolling
  
  // Convert filters to API format
  const apiFilters: TaskFilters = {};
  tableFilters.forEach(filter => {
    if (filter.field === 'status' && filter.operator === 'equals') {
      apiFilters.status = filter.value;
    } else if (filter.field === 'priority' && filter.operator === 'equals') {
      apiFilters.priority = filter.value;
    } else if (filter.field === 'assigneeId' && filter.operator === 'equals') {
      apiFilters.assigneeId = filter.value;
    } else if (filter.field === 'dueDate') {
      if (filter.operator === 'greaterThan') {
        apiFilters.dueDateFrom = filter.value;
      } else if (filter.operator === 'lessThan') {
        apiFilters.dueDateTo = filter.value;
      }
    }
  });

  // Build request object
  const request: GetTasksRequest = useMemo(() => ({
    filters: Object.keys(apiFilters).length > 0 ? apiFilters : undefined,
    sortBy: sorting.field,
    sortOrder: sorting.direction,
    page: currentPage,
    limit: pageSize,
    search: filters.search || undefined
  }), [tableFilters, sorting, currentPage, pageSize, filters.search, apiFilters]);
  
  // Fetch tasks
  const { data, isLoading, isFetching, hasNextPage, fetchNextPage } = useTasksQuery(request);
  
  // Детальное логирование состояния данных
  useEffect(() => {
    console.log('🔍 VirtualizedTasksTable - Data state changed:', {
      data,
      dataType: typeof data,
      dataIsNull: data === null,
      dataIsUndefined: data === undefined,
      dataIsArray: Array.isArray(data),
      hasTasks: data && 'tasks' in data
    });
    
    const tasksLength = Array.isArray(data) ? data.length : (data && data.tasks ? data.tasks.length : 'N/A');
    console.log('🔍 VirtualizedTasksTable - Request details:', {
      tasksLength,
      isLoading,
      isFetching,
      hasNextPage,
      request
    });
  }, [data, isLoading, isFetching, hasNextPage, request]);
  
  // Mutations
  const bulkUpdateMutation = useBulkUpdateTasksMutation();
  const bulkDeleteMutation = useBulkDeleteTasksMutation();
  
  // All tasks from all pages
  const allTasks = useMemo(() => {
    console.log('🔍 VirtualizedTasksTable - Computing allTasks:', {
      data,
      dataExists: !!data,
      dataIsArray: Array.isArray(data),
      hasTasksProperty: data && 'tasks' in data,
      tasksIsArray: data && Array.isArray(data.tasks),
      tasksValue: data && data.tasks
    });
    
    // Handle both direct array response and object with tasks property
    let tasks = [];
    if (Array.isArray(data)) {
      // Direct array response from API
      tasks = data;
      console.log('✅ VirtualizedTasksTable - Using direct array response:', tasks.length, 'items');
    } else if (data && Array.isArray(data.tasks)) {
      // Object with tasks property
      tasks = data.tasks;
      console.log('✅ VirtualizedTasksTable - Using data.tasks:', tasks.length, 'items');
    } else {
      console.warn('⚠️ VirtualizedTasksTable - No valid tasks data, returning empty array');
      return [];
    }
    
    return tasks;
  }, [data]);
  
  // Infinite loading with safety checks
  const itemCount = useMemo(() => {
    const count = Array.isArray(allTasks) ? allTasks.length : 0;
    return (hasNextPage && count > 0) ? count + 1 : count;
  }, [allTasks, hasNextPage]);
  
  const isItemLoaded = useCallback((index: number) => {
    if (typeof index !== 'number' || index < 0 || !Array.isArray(allTasks)) {
      return false;
    }
    return index < allTasks.length && !!allTasks[index];
  }, [allTasks]);
  
  const loadMoreItems = useCallback(() => {
    if (hasNextPage && !isFetching && typeof fetchNextPage === 'function') {
      return fetchNextPage();
    }
    return Promise.resolve();
  }, [hasNextPage, isFetching, fetchNextPage]);
  
  // Selection handlers
  const handleTaskSelect = useCallback((taskId: string, selected: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      return newSet;
    });
  }, []);
  
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedTasks(new Set(allTasks.map(task => task.id)));
    } else {
      setSelectedTasks(new Set());
    }
  }, [allTasks]);
  
  // Sorting handler
  const handleSort = useCallback((field: string) => {
    const newDirection = sorting.field === field && sorting.direction === 'asc' ? 'desc' : 'asc';
    onSortingChange?.({ field, direction: newDirection });
  }, [sorting, onSortingChange]);
  
  // Bulk actions
  const handleBulkDelete = useCallback(async () => {
    if (selectedTasks.size === 0) return;
    
    const count = selectedTasks.size;
    const taskIds = Array.from(selectedTasks);
    
    try {
      toast.promise(
        bulkDeleteMutation.mutateAsync(taskIds),
        {
          loading: `Удаление ${count} задач...`,
          success: `Успешно удалено ${count} задач`,
          error: 'Ошибка при удалении задач'
        }
      );
      setSelectedTasks(new Set());
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  }, [selectedTasks, bulkDeleteMutation]);
  
  const handleBulkStatusUpdate = useCallback(async (status: TaskStatus) => {
    if (selectedTasks.size === 0) return;
    
    const count = selectedTasks.size;
    const statusLabels: Record<string, string> = {
      'todo': 'В работу',
      'in_progress': 'В процессе', 
      'completed': 'Завершено',
      'cancelled': 'Отменено'
    };
    
    try {
      toast.promise(
        bulkUpdateMutation.mutateAsync({
          taskIds: Array.from(selectedTasks),
          updates: { status }
        }),
        {
          loading: `Обновление статуса ${count} задач...`,
          success: `Статус ${count} задач изменен на "${statusLabels[status]}"`,
          error: 'Ошибка при обновлении статуса'
        }
      );
      setSelectedTasks(new Set());
    } catch (error) {
      console.error('Bulk status update failed:', error);
    }
  }, [selectedTasks, bulkUpdateMutation]);
  
  const handleBulkPriorityUpdate = useCallback(async (priority: TaskPriority) => {
    if (selectedTasks.size === 0) return;
    
    const count = selectedTasks.size;
    const priorityLabels: Record<string, string> = {
      'low': 'Низкий',
      'medium': 'Средний',
      'high': 'Высокий',
      'urgent': 'Срочный'
    };
    
    try {
      toast.promise(
        bulkUpdateMutation.mutateAsync({
          taskIds: Array.from(selectedTasks),
          updates: { priority }
        }),
        {
          loading: `Обновление приоритета ${count} задач...`,
          success: `Приоритет ${count} задач изменен на "${priorityLabels[priority]}"`,
          error: 'Ошибка при обновлении приоритета'
        }
      );
      setSelectedTasks(new Set());
    } catch (error) {
      console.error('Bulk priority update failed:', error);
    }
  }, [selectedTasks, bulkUpdateMutation]);
  
  const handleBulkAssigneeUpdate = useCallback(async (assigneeId: string | null) => {
    if (selectedTasks.size === 0) return;
    
    const count = selectedTasks.size;
    
    try {
      toast.promise(
        bulkUpdateMutation.mutateAsync({
          taskIds: Array.from(selectedTasks),
          updates: { assigneeId }
        }),
        {
          loading: `Обновление исполнителя ${count} задач...`,
          success: assigneeId 
            ? `Исполнитель назначен для ${count} задач`
            : `Исполнитель снят с ${count} задач`,
          error: 'Ошибка при обновлении исполнителя'
        }
      );
      setSelectedTasks(new Set());
    } catch (error) {
      console.error('Bulk assignee update failed:', error);
    }
  }, [selectedTasks, bulkUpdateMutation]);
  
  // Keyboard shortcuts for bulk actions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedTasks.size === 0) return;
      
      // Only handle shortcuts when no input is focused
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        handleBulkDelete();
      } else if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            handleBulkStatusUpdate('todo' as TaskStatus);
            break;
          case '2':
            event.preventDefault();
            handleBulkStatusUpdate('in_progress' as TaskStatus);
            break;
          case '3':
            event.preventDefault();
            handleBulkStatusUpdate('completed' as TaskStatus);
            break;
          case 'a':
            event.preventDefault();
            handleSelectAll();
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedTasks, handleBulkDelete, handleBulkStatusUpdate, handleSelectAll]);
  
  // Row data for virtualization
  const rowData = useMemo(() => {
    // Comprehensive safety checks to prevent TypeError in react-window
    const safeTasks = Array.isArray(allTasks) ? allTasks : [];
    const safeColumns = Array.isArray(tableColumns) ? tableColumns : [];
    const safeSelectedTasks = selectedTasks instanceof Set ? selectedTasks : new Set();
    const safeUsers = Array.isArray([]) ? [] : []; // TODO: Fetch users from API or pass as prop
    
    // Ensure all callback functions are properly defined
    const safeOnTaskSelect = typeof handleTaskSelect === 'function' ? handleTaskSelect : () => {};
    const safeOnTaskClick = typeof onTaskClick === 'function' ? onTaskClick : () => {};
    const safeOnTaskEdit = typeof onTaskEdit === 'function' ? onTaskEdit : () => {};
    const safeOnTaskDelete = typeof onTaskDelete === 'function' ? onTaskDelete : () => {};
    const safeOnTaskUpdate = typeof handleTaskUpdate === 'function' ? handleTaskUpdate : () => {};
    
    const safeData = {
      tasks: safeTasks,
      columns: safeColumns,
      selectedTasks: safeSelectedTasks,
      onTaskSelect: safeOnTaskSelect,
      onTaskClick: safeOnTaskClick,
      onTaskEdit: safeOnTaskEdit,
      onTaskDelete: safeOnTaskDelete,
      onTaskUpdate: safeOnTaskUpdate,
      users: safeUsers
    };
    return safeData;
  }, [allTasks, tableColumns, selectedTasks, handleTaskSelect, onTaskClick, onTaskEdit, onTaskDelete, handleTaskUpdate]);
  
  const visibleColumns = tableColumns.filter(col => col.visible);
  const totalWidth = visibleColumns.reduce((sum, col) => sum + col.width, 0);
  const isAllSelected = allTasks.length > 0 && selectedTasks.size === allTasks.length;
  const isPartiallySelected = selectedTasks.size > 0 && selectedTasks.size < allTasks.length;
  
  return (
    <div className={cn('flex flex-col', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск задач..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange?.({ ...filters, search: e.target.value })}
              className="pl-10 pr-4 py-2 border rounded-md w-64 text-sm"
            />
          </div>
          
          <TableFilters
            filters={tableFilters}
            onFiltersChange={setTableFilters}
            availableUsers={[]} // TODO: Pass actual users
          />
        </div>
        
        <div className="flex items-center gap-2">
          <BulkActionsMenu
            selectedCount={selectedTasks.size}
            onStatusUpdate={handleBulkStatusUpdate}
            onPriorityUpdate={handleBulkPriorityUpdate}
            onAssigneeUpdate={handleBulkAssigneeUpdate}
            onDelete={handleBulkDelete}
            availableUsers={[]}
          />
          <ColumnSettings
            columns={tableColumns}
            onColumnsChange={setTableColumns}
          />

        </div>
      </div>
      
      {/* Table Container */}
      <div className="flex-1 relative" style={{ height }}>
        {/* Header */}
        <div 
          className="flex items-center bg-muted/50 border-b sticky top-0 z-10"
          style={{ height: HEADER_HEIGHT, width: totalWidth }}
        >
          {visibleColumns.map((column) => {
            const isSortable = column.sortable && column.key !== 'select' && column.key !== 'actions';
            const isSorted = sorting.field === column.key;
            
            return (
              <div
                key={column.key}
                style={{ width: column.width }}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium text-muted-foreground border-r last:border-r-0',
                  isSortable && 'cursor-pointer hover:bg-muted/80'
                )}
                onClick={() => isSortable && handleSort(column.key as string)}
              >
                {column.key === 'select' ? (
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isPartiallySelected}
                    onCheckedChange={handleSelectAll}
                  />
                ) : (
                  <>
                    {column.label}
                    {isSorted && (
                      sorting.direction === 'asc' ? 
                        <ChevronUp className="ml-1 h-3 w-3" /> : 
                        <ChevronDown className="ml-1 h-3 w-3" />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Virtualized List */}
        {isLoading || !List ? (
          <div className="flex items-center justify-center h-32">
            <Spinner />
            {!List && <span className="ml-2 text-sm text-muted-foreground">Loading table...</span>}
          </div>
        ) : (
          <InfiniteLoader
            isItemLoaded={typeof isItemLoaded === 'function' ? isItemLoaded : () => false}
            itemCount={typeof itemCount === 'number' && itemCount >= 0 ? itemCount : 0}
            loadMoreItems={typeof loadMoreItems === 'function' ? loadMoreItems : () => Promise.resolve()}
          >
            {({ onItemsRendered, ref }) => {
              // Ensure onItemsRendered is a function
              const safeOnItemsRendered = typeof onItemsRendered === 'function' ? onItemsRendered : () => {};
              
              return (
                <List
                  ref={(list) => {
                    listRef.current = list;
                    if (typeof ref === 'function') {
                      ref(list);
                    }
                  }}
                  height={Math.max(height - HEADER_HEIGHT, 100)}
                  itemCount={Math.max(itemCount || 0, 0)}
                  itemSize={ROW_HEIGHT}
                  itemData={{
                    tasks: Array.isArray(rowData?.tasks) ? rowData.tasks : [],
                    columns: Array.isArray(rowData?.columns) ? rowData.columns : [],
                    selectedTasks: rowData?.selectedTasks instanceof Set ? rowData.selectedTasks : new Set(),
                    onTaskSelect: typeof rowData?.onTaskSelect === 'function' ? rowData.onTaskSelect : () => {},
                    onTaskClick: typeof rowData?.onTaskClick === 'function' ? rowData.onTaskClick : () => {},
                    onTaskEdit: typeof rowData?.onTaskEdit === 'function' ? rowData.onTaskEdit : () => {},
                    onTaskDelete: typeof rowData?.onTaskDelete === 'function' ? rowData.onTaskDelete : () => {},
                    onTaskUpdate: typeof rowData?.onTaskUpdate === 'function' ? rowData.onTaskUpdate : () => {},
                    users: Array.isArray(rowData?.users) ? rowData.users : []
                  }}
                  onItemsRendered={safeOnItemsRendered}
                  width={Math.max(totalWidth, 100)}
                >
                  {TaskRow}
                </List>
              );
            }}
          </InfiniteLoader>
        )}
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t text-sm text-muted-foreground">
        <div>
          Showing {allTasks.length} of {data?.total || 0} tasks
        </div>
        <div className="flex items-center gap-2">
          {isFetching && <Spinner size="sm" />}
        </div>
      </div>
    </div>
  );
};

export default VirtualizedTasksTable;