import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { ScrollArea } from '@/shared/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/shared/ui/dropdown-menu';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Calendar,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import { TaskCard } from './TaskCard';
import VirtualizedTasksTable from './VirtualizedTasksTable';
import type { Task, TaskFilters, TaskSortOptions, TaskStatus, TaskPriority } from '@/entities/task';
import { useTasksQuery, useCreateTaskMutation } from '@/features/tasks/api/tasks-api';
import { toast } from 'sonner';

// View modes
type ViewMode = 'list' | 'cards' | 'table' | 'calendar';

// Sort options
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'title', label: 'Title' }
] as const;

// Status options
const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'В ожидании', color: 'bg-gray-100 text-gray-700' },
  { value: 'TODO', label: 'К выполнению', color: 'bg-slate-100 text-slate-700' },
  { value: 'IN_PROGRESS', label: 'В работе', color: 'bg-blue-100 text-blue-700' },
  { value: 'IN_REVIEW', label: 'На проверке', color: 'bg-purple-100 text-purple-700' },
  { value: 'DONE', label: 'Готово', color: 'bg-green-100 text-green-700' },
  { value: 'CANCELLED', label: 'Отменено', color: 'bg-red-100 text-red-700' }
] as const;

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' }
] as const;

interface TaskListProps {
  projectId?: string;
  teamId?: string;
  userId?: string;
  parentTaskId?: string;
  initialFilters?: TaskFilters;
  initialSorting?: TaskSortOptions;
  showHeader?: boolean;
  showFilters?: boolean;
  showViewModes?: boolean;
  defaultViewMode?: ViewMode;
  height?: number;
  className?: string;
  onTaskSelect?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  onTaskCreate?: (task: Partial<Task>) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  projectId,
  teamId,
  userId,
  parentTaskId,
  initialFilters = {},
  initialSorting = { field: 'createdAt', direction: 'desc' },
  showHeader = true,
  showFilters = true,
  showViewModes = true,
  defaultViewMode = 'cards',
  height = 600,
  className,
  onTaskSelect,
  onTaskEdit,
  onTaskDelete,
  onTaskCreate
}) => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TaskFilters>(initialFilters);
  const [sorting, setSorting] = useState<TaskSortOptions>(initialSorting);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  // Mutations
  const createTaskMutation = useCreateTaskMutation();

  // Build query filters
  const queryFilters = useMemo(() => {
    const result: TaskFilters = { ...filters };
    
    if (projectId) result.projectId = projectId;
    if (teamId) result.teamId = teamId;
    if (userId) result.assigneeId = userId;
    if (parentTaskId) result.parentTaskId = parentTaskId;
    if (searchQuery.trim()) result.search = searchQuery.trim();
    
    return result;
  }, [filters, projectId, teamId, userId, parentTaskId, searchQuery]);

  // Fetch tasks
  const {
    data: tasksData,
    isLoading,
    isFetching,
    refetch
  } = useTasksQuery({
    filters: queryFilters,
    sortBy: sorting.field,
    sortOrder: sorting.direction,
    page: 1,
    limit: 1000 // For now, load all tasks
  });

  const tasks = tasksData?.data || [];

  // Handle task expansion
  const handleToggleExpand = useCallback((taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  // Handle task selection
  const handleTaskSelect = useCallback((task: Task) => {
    onTaskSelect?.(task);
  }, [onTaskSelect]);

  // Handle task creation
  const handleCreateTask = useCallback(async () => {
    try {
      const newTask = await createTaskMutation.mutateAsync({
        title: 'New Task',
        description: '',
        priority: 'medium',
        status: TaskStatus.TODO,
        projectId,
        teamId,
        parentTaskId
      });
      toast.success('Task created successfully');
      onTaskCreate?.(newTask);
    } catch (error) {
      toast.error('Failed to create task');
    }
  }, [createTaskMutation, projectId, teamId, parentTaskId, onTaskCreate]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof TaskFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  }, []);

  // Handle sorting change
  const handleSortingChange = useCallback((field: string) => {
    setSorting(prev => ({
      field: field as keyof Task,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status) count++;
    if (filters.priority) count++;
    if (filters.assigneeId) count++;
    if (filters.dueDateFrom || filters.dueDateTo) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [filters, searchQuery]);

  // Render task cards
  const renderTaskCards = () => (
    <ScrollArea className="flex-1" style={{ height: height - (showHeader ? 120 : 60) }}>
      <div className="space-y-3 p-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No tasks found</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isExpanded={expandedTasks.has(task.id)}
              onToggleExpand={handleToggleExpand}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
              onTaskClick={handleTaskSelect}
              showSubtasks={true}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );

  // Render task table
  const renderTaskTable = () => (
    <div className="flex-1">
      <VirtualizedTasksTable
        filters={queryFilters}
        sorting={sorting}
        onTaskClick={handleTaskSelect}
        onTaskEdit={onTaskEdit}
        onTaskDelete={onTaskDelete}
        onFiltersChange={setFilters}
        onSortingChange={setSorting}
        height={height - (showHeader ? 120 : 60)}
      />
    </div>
  );

  // Render calendar view (placeholder)
  const renderCalendarView = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Calendar view coming soon</p>
      </div>
    </div>
  );

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Header */}
      {showHeader && (
        <div className="border-b bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Tasks</h2>
              <p className="text-sm text-gray-600">
                {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                {activeFilterCount > 0 && (
                  <span className="ml-2">
                    ({activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active)
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          {showFilters && (
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status filter */}
              <Select
                value={filters.status || ''}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', option.color)} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Priority filter */}
              <Select
                value={filters.priority || ''}
                onValueChange={(value) => handleFilterChange('priority', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priority</SelectItem>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', option.color)} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {sorting.direction === 'asc' ? (
                      <SortAsc className="h-4 w-4 mr-2" />
                    ) : (
                      <SortDesc className="h-4 w-4 mr-2" />
                    )}
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {SORT_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleSortingChange(option.value)}
                      className={cn(
                        sorting.field === option.value && 'bg-accent'
                      )}
                    >
                      {option.label}
                      {sorting.field === option.value && (
                        <span className="ml-auto">
                          {sorting.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View modes */}
              {showViewModes && (
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="rounded-none"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                    className="rounded-l-none"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Clear filters */}
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                >
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading tasks...</p>
          </div>
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <>
          {viewMode === 'cards' && renderTaskCards()}
          {viewMode === 'list' && renderTaskCards()}
          {viewMode === 'table' && renderTaskTable()}
          {viewMode === 'calendar' && renderCalendarView()}
        </>
      )}
    </div>
  );
};

export default TaskList;