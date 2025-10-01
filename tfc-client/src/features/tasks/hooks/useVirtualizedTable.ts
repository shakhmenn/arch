import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { List } from 'react-window';
import type { Task, TaskFilters, TaskSortOptions, GetTasksRequest, TaskStatus, TaskPriority } from '@/entities/task';
import { useTasksQuery, useBulkUpdateTasksMutation, useBulkDeleteTasksMutation } from '@/shared/api';
import { useDebounce } from '@/shared/hooks';

export interface UseVirtualizedTableOptions {
  initialFilters?: TaskFilters;
  initialSorting?: TaskSortOptions;
  pageSize?: number;
  debounceMs?: number;
}

export interface UseVirtualizedTableReturn {
  // Data
  tasks: Task[];
  isLoading: boolean;
  isFetching: boolean;
  hasNextPage: boolean;
  totalCount: number;
  
  // Search & Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  
  // Sorting
  sorting: TaskSortOptions;
  setSorting: (sorting: TaskSortOptions) => void;
  handleSort: (field: string) => void;
  
  // Selection
  selectedTasks: Set<string>;
  handleTaskSelect: (taskId: string, selected: boolean) => void;
  handleSelectAll: (selected: boolean) => void;
  clearSelection: () => void;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  
  // Bulk Actions
  handleBulkDelete: () => Promise<void>;
  handleBulkStatusUpdate: (status: TaskStatus) => Promise<void>;
  handleBulkPriorityUpdate: (priority: TaskPriority) => Promise<void>;
  handleBulkAssigneeUpdate: (assigneeId: string) => Promise<void>;
  isBulkUpdating: boolean;
  
  // Virtualization
  listRef: React.RefObject<List>;
  fetchNextPage: () => Promise<any>;
  isItemLoaded: (index: number) => boolean;
  loadMoreItems: () => Promise<void>;
  itemCount: number;
  
  // Utilities
  refreshData: () => void;
  scrollToTop: () => void;
  scrollToTask: (taskId: string) => void;
}

export const useVirtualizedTable = ({
  initialFilters = {},
  initialSorting = { field: 'createdAt', direction: 'desc' },
  pageSize = 50,
  debounceMs = 300
}: UseVirtualizedTableOptions = {}): UseVirtualizedTableReturn => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TaskFilters>(initialFilters);
  const [sorting, setSorting] = useState<TaskSortOptions>(initialSorting);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  
  // Refs
  const listRef = useRef<List>(null);
  
  // Debounced search
  const debouncedSearchQuery = useDebounce(searchQuery, debounceMs);
  
  // Build request object with safety checks
  const request: GetTasksRequest = useMemo(() => {
    // Ensure sorting object is safe
    const safeSorting = sorting && sorting.field && sorting.direction 
      ? { [sorting.field]: sorting.direction }
      : { createdAt: 'desc' };
    
    return {
      filters: filters && typeof filters === 'object' ? filters : {},
      sorting: safeSorting,
      pagination: { 
        page: typeof currentPage === 'number' && currentPage > 0 ? currentPage : 1, 
        limit: typeof pageSize === 'number' && pageSize > 0 ? pageSize : 50 
      },
      search: typeof debouncedSearchQuery === 'string' && debouncedSearchQuery.trim() 
        ? debouncedSearchQuery.trim() 
        : undefined
    };
  }, [filters, sorting, currentPage, pageSize, debouncedSearchQuery]);
  
  // Fetch tasks
  const { 
    data, 
    isLoading, 
    isFetching, 
    hasNextPage, 
    fetchNextPage,
    refetch
  } = useTasksQuery(request);
  
  // Mutations
  const bulkUpdateMutation = useBulkUpdateTasksMutation();
  const bulkDeleteMutation = useBulkDeleteTasksMutation();
  
  // Derived data
  const tasks = useMemo(() => data?.tasks || [], [data]);
  const totalCount = data?.total || 0;
  const itemCount = hasNextPage ? tasks.length + 1 : tasks.length;
  const isAllSelected = tasks.length > 0 && selectedTasks.size === tasks.length;
  const isPartiallySelected = selectedTasks.size > 0 && selectedTasks.size < tasks.length;
  const isBulkUpdating = bulkUpdateMutation.isPending || bulkDeleteMutation.isPending;
  
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
      setSelectedTasks(new Set(tasks.map(task => task.id)));
    } else {
      setSelectedTasks(new Set());
    }
  }, [tasks]);
  
  const clearSelection = useCallback(() => {
    setSelectedTasks(new Set());
  }, []);
  
  // Sorting handler
  const handleSort = useCallback((field: string) => {
    const newDirection = sorting.field === field && sorting.direction === 'asc' ? 'desc' : 'asc';
    setSorting({ field, direction: newDirection });
    setCurrentPage(1); // Reset to first page when sorting changes
    scrollToTop();
  }, [sorting]);
  
  // Bulk action handlers
  const handleBulkDelete = useCallback(async () => {
    if (selectedTasks.size === 0) return;
    
    try {
      await bulkDeleteMutation.mutateAsync(Array.from(selectedTasks));
      setSelectedTasks(new Set());
    } catch (error) {
      console.error('Bulk delete failed:', error);
      throw error;
    }
  }, [selectedTasks, bulkDeleteMutation]);
  
  const handleBulkStatusUpdate = useCallback(async (status: TaskStatus) => {
    if (selectedTasks.size === 0) return;
    
    try {
      await bulkUpdateMutation.mutateAsync({
        taskIds: Array.from(selectedTasks),
        updates: { status }
      });
      setSelectedTasks(new Set());
    } catch (error) {
      console.error('Bulk status update failed:', error);
      throw error;
    }
  }, [selectedTasks, bulkUpdateMutation]);
  
  const handleBulkPriorityUpdate = useCallback(async (priority: TaskPriority) => {
    if (selectedTasks.size === 0) return;
    
    try {
      await bulkUpdateMutation.mutateAsync({
        taskIds: Array.from(selectedTasks),
        updates: { priority }
      });
      setSelectedTasks(new Set());
    } catch (error) {
      console.error('Bulk priority update failed:', error);
      throw error;
    }
  }, [selectedTasks, bulkUpdateMutation]);
  
  const handleBulkAssigneeUpdate = useCallback(async (assigneeId: string) => {
    if (selectedTasks.size === 0) return;
    
    try {
      await bulkUpdateMutation.mutateAsync({
        taskIds: Array.from(selectedTasks),
        updates: { assigneeId }
      });
      setSelectedTasks(new Set());
    } catch (error) {
      console.error('Bulk assignee update failed:', error);
      throw error;
    }
  }, [selectedTasks, bulkUpdateMutation]);
  
  // Virtualization helpers with comprehensive safety checks
  const isItemLoaded = useCallback((index: number) => {
    // Ensure index is a valid number and tasks array exists
    if (typeof index !== 'number' || index < 0) {
      return false;
    }
    return Array.isArray(tasks) && index < tasks.length;
  }, [tasks]);
  
  const loadMoreItems = useCallback(async (startIndex: number, stopIndex: number) => {
    // Ensure parameters are valid numbers
    if (typeof startIndex !== 'number' || typeof stopIndex !== 'number') {
      return Promise.resolve();
    }
    
    // Ensure we have valid state before attempting to load more
    if (hasNextPage && !isFetching && typeof fetchNextPage === 'function') {
      try {
        await fetchNextPage();
      } catch (error) {
        console.error('Error loading more items:', error);
      }
    }
    return Promise.resolve();
  }, [hasNextPage, isFetching, fetchNextPage]);
  
  // Utility functions
  const refreshData = useCallback(() => {
    refetch();
    setCurrentPage(1);
    scrollToTop();
  }, [refetch]);
  
  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToItem(0, 'start');
  }, []);
  
  const scrollToTask = useCallback((taskId: string) => {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      listRef.current?.scrollToItem(taskIndex, 'center');
    }
  }, [tasks]);
  
  // Reset selection when filters or search changes
  const resetSelection = useCallback(() => {
    setSelectedTasks(new Set());
  }, []);
  
  // Effect to reset selection when data changes significantly
  useEffect(() => {
    resetSelection();
  }, [debouncedSearchQuery, filters, sorting, resetSelection]);
  
  // Return data with comprehensive safety checks
  return {
    // Data - ensure all values are safe
    tasks: Array.isArray(tasks) ? tasks : [],
    totalCount: typeof totalCount === 'number' && totalCount >= 0 ? totalCount : 0,
    isLoading: typeof isLoading === 'boolean' ? isLoading : false,
    isFetching: typeof isFetching === 'boolean' ? isFetching : false,
    hasNextPage: typeof hasNextPage === 'boolean' ? hasNextPage : false,
    
    // Search and filters - ensure safe values
    searchQuery: typeof searchQuery === 'string' ? searchQuery : '',
    setSearchQuery: typeof setSearchQuery === 'function' ? setSearchQuery : () => {},
    filters: filters && typeof filters === 'object' ? filters : {},
    setFilters: typeof setFilters === 'function' ? setFilters : () => {},
    
    // Sorting - ensure safe values
    sorting: sorting && typeof sorting === 'object' && sorting.field && sorting.direction 
      ? sorting 
      : { field: 'createdAt', direction: 'desc' },
    setSorting: typeof setSorting === 'function' ? setSorting : () => {},
    handleSort: typeof handleSort === 'function' ? handleSort : () => {},
    
    // Selection - ensure safe values
    selectedTasks: selectedTasks instanceof Set ? selectedTasks : new Set<string>(),
    isAllSelected: typeof isAllSelected === 'boolean' ? isAllSelected : false,
    isPartiallySelected: typeof isPartiallySelected === 'boolean' ? isPartiallySelected : false,
    handleTaskSelect: typeof handleTaskSelect === 'function' ? handleTaskSelect : () => {},
    handleSelectAll: typeof handleSelectAll === 'function' ? handleSelectAll : () => {},
    clearSelection: typeof clearSelection === 'function' ? clearSelection : () => {},
    
    // Bulk operations - ensure safe functions
    isBulkUpdating: typeof isBulkUpdating === 'boolean' ? isBulkUpdating : false,
    handleBulkDelete: typeof handleBulkDelete === 'function' ? handleBulkDelete : () => Promise.resolve(),
    handleBulkStatusUpdate: typeof handleBulkStatusUpdate === 'function' ? handleBulkStatusUpdate : () => Promise.resolve(),
    handleBulkPriorityUpdate: typeof handleBulkPriorityUpdate === 'function' ? handleBulkPriorityUpdate : () => Promise.resolve(),
    handleBulkAssigneeUpdate: typeof handleBulkAssigneeUpdate === 'function' ? handleBulkAssigneeUpdate : () => Promise.resolve(),
    
    // Virtualization - ensure safe values and functions
    itemCount: typeof itemCount === 'number' && itemCount >= 0 ? itemCount : 0,
    isItemLoaded: typeof isItemLoaded === 'function' ? isItemLoaded : () => false,
    loadMoreItems: typeof loadMoreItems === 'function' ? loadMoreItems : () => Promise.resolve(),
    listRef: listRef && typeof listRef === 'object' ? listRef : { current: null },
    fetchNextPage,
    
    // Utilities - ensure safe functions
    refreshData: typeof refreshData === 'function' ? refreshData : () => {},
    scrollToTop: typeof scrollToTop === 'function' ? scrollToTop : () => {},
    scrollToTask: typeof scrollToTask === 'function' ? scrollToTask : () => {}
  };
};

export default useVirtualizedTable;