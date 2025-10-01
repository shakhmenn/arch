import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Separator,
} from '@/shared/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/shared/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Settings,
  Eye,
  EyeOff,
  SortAsc,
  SortDesc,
  Trash2,
  Archive,
  CheckSquare,
  Square,
  List,
  Grid,
  Table,
  Calendar,
  BarChart3,
  Kanban,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  useTasksQuery,
  useBulkUpdateTasksMutation,
  useBulkDeleteTasksMutation,
  useExportTasksMutation,
  useImportTasksMutation,
} from '../api/tasks-api';
import VirtualizedTasksTable from './VirtualizedTasksTable';
import TaskList from './TaskList';
import TaskKanbanBoard from './TaskKanbanBoard';
import TaskCalendarView from './TaskCalendarView';
import { UnifiedTaskDialog } from './unified-task-dialog/UnifiedTaskDialog';
import type { Task, TaskStatus, TaskPriority, TaskFilters, TaskSortField } from '../types/task';
import { useVirtualizedTable } from '../hooks/useVirtualizedTable';
import { toast } from 'sonner';

type ViewMode = 'list' | 'cards' | 'table' | 'kanban' | 'calendar';

interface TasksPageProps {
  teamId?: string;
  userId?: string;
  projectId?: string;
}

// Main Tasks Page component
export const TasksPage: React.FC<TasksPageProps> = ({ teamId, userId, projectId }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Initialize virtualized table
  const tableState = useVirtualizedTable({
    initialSorting: { field: 'createdAt', direction: 'desc' },
    pageSize: 50,
    debounceMs: 300
  });
  
  // API hooks
  const { data: tasksData, isLoading } = useTasksQuery({
    teamId,
    userId,
    projectId,
    filters: tableState.filters,
    sort: tableState.sorting,
    search: searchQuery,
  });
  
  const { mutate: bulkUpdateTasks } = useBulkUpdateTasksMutation();
  const { mutate: bulkDeleteTasks } = useBulkDeleteTasksMutation();
  const { mutate: exportTasks } = useExportTasksMutation();
  const { mutate: importTasks } = useImportTasksMutation();

  // Task handlers
  const handleTaskClick = useCallback((task: Task) => {
    console.log('Task clicked:', task);
    // Navigate to task details or open task view
  }, []);
  
  const handleTaskEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  }, []);
  
  const handleTaskDelete = useCallback(async (task: Task) => {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        // Delete single task - this would use a delete mutation
        console.log('Deleting task:', task.id);
        toast.success('Task deleted successfully');
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  }, []);
  
  const handleCreateTask = useCallback((status?: TaskStatus, date?: Date) => {
    setEditingTask(undefined);
    setTaskDialogOpen(true);
  }, []);
  
  const handleTaskSave = useCallback((taskData: Partial<Task>) => {
    console.log('Saving task:', taskData);
    toast.success(editingTask ? 'Task updated successfully' : 'Task created successfully');
  }, [editingTask]);
  
  // Bulk action handlers with toast notifications
  const handleBulkDelete = useCallback(async () => {
    if (tableState.selectedTasks.size === 0) return;
    
    const count = tableState.selectedTasks.size;
    if (confirm(`Are you sure you want to delete ${count} task(s)?`)) {
      try {
        const taskIds = Array.from(tableState.selectedTasks);
        bulkDeleteTasks({ taskIds });
        await tableState.handleBulkDelete();
        toast.success(`Удалено задач: ${count}`);
      } catch (error) {
        toast.error('Failed to delete tasks');
      }
    }
  }, [tableState, bulkDeleteTasks]);
  
  const handleBulkStatusUpdate = useCallback(async (status: string) => {
    if (tableState.selectedTasks.size === 0) return;
    
    try {
      const taskIds = Array.from(tableState.selectedTasks);
      bulkUpdateTasks({ 
        taskIds, 
        updates: { status } 
      });
      await tableState.handleBulkStatusUpdate(status);
      toast.success(`Обновлено задач: ${tableState.selectedTasks.size}`);
    } catch (error) {
      toast.error('Failed to update tasks');
    }
  }, [tableState, bulkUpdateTasks]);
  
  // Filter handlers
  const handleFilterChange = useCallback((newFilters: Partial<TaskFilters>) => {
    tableState.setFilters(prev => ({ ...prev, ...newFilters }));
  }, [tableState]);
  
  const handleClearFilters = useCallback(() => {
    tableState.setFilters({});
    setSearchQuery('');
  }, [tableState]);
  
  // Export/Import handlers
  const handleExportTasks = useCallback(() => {
    exportTasks({ teamId, userId, projectId, filters: tableState.filters });
    toast.success('Экспорт задач начат');
  }, [exportTasks, teamId, userId, projectId, tableState.filters]);
  
  const handleImportTasks = useCallback((file: File) => {
    importTasks({ file, teamId });
    toast.success('Импорт задач начат');
  }, [importTasks, teamId]);
  

  
  // Statistics
  const stats = useMemo(() => {
    const tasks = tasksData?.tasks || [];
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'TODO').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      review: tasks.filter(t => t.status === 'REVIEW').length,
      done: tasks.filter(t => t.status === 'DONE').length,
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE').length,
    };
  }, [tasksData]);

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">Задачи</h1>
          <p className="text-muted-foreground">
            Управление и отслеживание задач команды
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="h-8"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8"
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="h-8"
            >
              <Kanban className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="h-8"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-8" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('import-file')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Импорт
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".csv,.xlsx,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportTasks(file);
            }}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportTasks}
          >
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
          
          <Button onClick={handleCreateTask}>
            <Plus className="h-4 w-4 mr-2" />
            Новая задача
          </Button>
        </div>
      </div>
      
      {/* Bulk Actions Bar */}
      {tableState.selectedTasks.size > 0 && (
        <div className="flex items-center gap-2 px-6 py-3 bg-blue-50 border-b">
          <div className="text-sm font-medium">
            Выбрано задач: {tableState.selectedTasks.size}
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleBulkStatusUpdate('DONE')}
              disabled={tableState.isBulkUpdating}
            >
              Завершить
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleBulkStatusUpdate('IN_PROGRESS')}
              disabled={tableState.isBulkUpdating}
            >
              В работу
            </Button>
            
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleBulkDelete}
              disabled={tableState.isBulkUpdating}
            >
              Удалить
            </Button>
          </div>
        </div>
      )}
      
      {/* Statistics */}
      <div className="px-6 py-4 border-b bg-muted/30">
        <div className="grid grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Всего</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.todo}</div>
            <div className="text-sm text-muted-foreground">К выполнению</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground">В работе</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.review}</div>
            <div className="text-sm text-muted-foreground">На проверке</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.done}</div>
            <div className="text-sm text-muted-foreground">Выполнено</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-muted-foreground">Просрочено</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'list' && (
          <TaskList
            tasks={tasksData?.tasks || []}
            loading={isLoading}
            viewMode="list"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onTaskSelect={handleTaskClick}
            onTaskCreate={handleCreateTask}
            onTaskSave={handleTaskSave}
            onTaskDelete={handleTaskDelete}
            onBulkDelete={handleBulkDelete}
            onBulkUpdate={handleBulkStatusUpdate}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        )}
        
        {viewMode === 'cards' && (
          <TaskList
            tasks={tasksData?.tasks || []}
            loading={isLoading}
            viewMode="cards"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onTaskSelect={handleTaskClick}
            onTaskCreate={handleCreateTask}
            onTaskSave={handleTaskSave}
            onTaskDelete={handleTaskDelete}
            onBulkDelete={handleBulkDelete}
            onBulkUpdate={handleBulkStatusUpdate}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        )}
        
        {viewMode === 'table' && (
          <VirtualizedTasksTable
            filters={tableState.filters}
            sorting={tableState.sorting}
            onTaskClick={handleTaskClick}
            onTaskEdit={handleTaskEdit}
            onTaskDelete={handleTaskDelete}
            onFiltersChange={tableState.setFilters}
            onSortingChange={tableState.setSorting}
            height={600}
            className="h-full"
          />
        )}
        
        {viewMode === 'kanban' && (
          <TaskKanbanBoard
            tasks={tasksData?.tasks || []}
            loading={isLoading}
            onTaskCreate={handleCreateTask}
            onTaskSave={handleTaskSave}
            onTaskDelete={handleTaskDelete}
          />
        )}
        
        {viewMode === 'calendar' && (
          <TaskCalendarView
            tasks={tasksData?.tasks || []}
            loading={isLoading}
            onTaskCreate={handleCreateTask}
            onTaskSave={handleTaskSave}
            onTaskDelete={handleTaskDelete}
          />
        )}
      </div>

      {/* Task Creation Dialog */}
      <UnifiedTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        editingTask={editingTask}
        mode="task"
      />
    </div>
  );
};

export default TasksPage;