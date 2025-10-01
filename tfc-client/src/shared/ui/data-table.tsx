import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from './table';
import { Checkbox } from './checkbox';
import { Spinner } from './spinner';
import { Button } from './button';
import { Input } from './input';

export interface Column<T> {
  id: string;
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  cell?: (props: { row: T; value: any }) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  sticky?: 'left' | 'right';
}

export interface SortingState {
  id: string;
  desc: boolean;
}

export interface FilterState {
  id: string;
  value: any;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  error?: string | null;
  // Selection
  enableRowSelection?: boolean;
  selectedRows?: Set<string | number>;
  onRowSelectionChange?: (selectedRows: Set<string | number>) => void;
  getRowId?: (row: T) => string | number;
  // Sorting
  sorting?: SortingState[];
  onSortingChange?: (sorting: SortingState[]) => void;
  // Filtering
  globalFilter?: string;
  onGlobalFilterChange?: (filter: string) => void;
  columnFilters?: FilterState[];
  onColumnFiltersChange?: (filters: FilterState[]) => void;
  // Pagination
  pageSize?: number;
  pageIndex?: number;
  pageCount?: number;
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  // Styling
  className?: string;
  rowClassName?: (row: T) => string;
  // Actions
  onRowClick?: (row: T) => void;
  // Empty state
  emptyMessage?: string;
  // Bulk actions
  bulkActions?: React.ReactNode;
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error = null,
  enableRowSelection = false,
  selectedRows = new Set(),
  onRowSelectionChange,
  getRowId = (row: any) => row.id,
  sorting = [],
  onSortingChange,
  globalFilter = '',
  onGlobalFilterChange,
  // columnFilters = [],
  // onColumnFiltersChange,
  pageSize = 50,
  pageIndex = 0,
  pageCount = 0,
  onPaginationChange,
  className,
  rowClassName,
  onRowClick,
  emptyMessage = 'No data available',
  bulkActions
}: DataTableProps<T>) {
  // Handle sorting
  const handleSort = (columnId: string) => {
    if (!onSortingChange) return;

    const existingSort = sorting.find(s => s.id === columnId);
    let newSorting: SortingState[];

    if (!existingSort) {
      newSorting = [{ id: columnId, desc: false }];
    } else if (!existingSort.desc) {
      newSorting = [{ id: columnId, desc: true }];
    } else {
      newSorting = [];
    }

    onSortingChange(newSorting);
  };

  // Handle row selection
  const handleRowSelection = (rowId: string | number, selected: boolean) => {
    if (!onRowSelectionChange) return;

    const newSelection = new Set(selectedRows);
    if (selected) {
      newSelection.add(rowId);
    } else {
      newSelection.delete(rowId);
    }
    onRowSelectionChange(newSelection);
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (!onRowSelectionChange) return;

    if (selected) {
      const allIds = data.map((row) => getRowId(row));
      onRowSelectionChange(new Set(allIds));
    } else {
      onRowSelectionChange(new Set());
    }
  };

  // Calculate selection state
  const isAllSelected = data.length > 0 && selectedRows.size === data.length;
  // const isIndeterminate = selectedRows.size > 0 && selectedRows.size < data.length;

  // Get cell value
  const getCellValue = (row: T, column: Column<T>) => {
    if (column.accessorKey) {
      return row[column.accessorKey];
    }
    return null;
  };

  // Get sort direction for column
  const getSortDirection = (columnId: string): 'asc' | 'desc' | null => {
    const sort = sorting.find(s => s.id === columnId);
    if (!sort) return null;
    return sort.desc ? 'desc' : 'asc';
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-32 text-destructive">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Global Filter */}
      {onGlobalFilterChange && (
        <div className="flex items-center justify-between">
          <Input
            placeholder="Search..."
            value={globalFilter}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            className="max-w-sm"
          />
          {bulkActions && selectedRows.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedRows.size} selected
              </span>
              {bulkActions}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {enableRowSelection && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    // indeterminate={isIndeterminate}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all rows"
                  />
                </TableHead>
              )}
              {columns.map((column) => {
                const sortDirection = getSortDirection(column.id);
                return (
                  <TableHead
                    key={column.id}
                    sortable={column.sortable}
                    sortDirection={sortDirection}
                    onClick={column.sortable ? () => handleSort(column.id) : undefined}
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                      maxWidth: column.maxWidth,
                      textAlign: column.align
                    }}
                    className={cn({
                      'sticky left-0 z-10 bg-background': column.sticky === 'left',
                      'sticky right-0 z-10 bg-background': column.sticky === 'right'
                    })}
                  >
                    {column.header}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (enableRowSelection ? 1 : 0)}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <Spinner className="mr-2" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (enableRowSelection ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const rowId = getRowId(row);
                const isSelected = selectedRows.has(rowId);

                return (
                  <TableRow
                    key={rowId}
                    selected={isSelected}
                    clickable={!!onRowClick}
                    onClick={() => onRowClick?.(row)}
                    className={rowClassName?.(row)}
                  >
                    {enableRowSelection && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleRowSelection(rowId, !!checked)}
                          aria-label={`Select row ${rowId}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const value = getCellValue(row, column);
                      return (
                        <TableCell
                          key={column.id}
                          style={{
                            width: column.width,
                            minWidth: column.minWidth,
                            maxWidth: column.maxWidth,
                            textAlign: column.align
                          }}
                          className={cn({
                            'sticky left-0 z-10 bg-background': column.sticky === 'left',
                            'sticky right-0 z-10 bg-background': column.sticky === 'right'
                          })}
                        >
                          {column.cell ? column.cell({ row, value }) : value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {onPaginationChange && pageCount > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, data.length)} of {pageCount * pageSize} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaginationChange({ pageIndex: pageIndex - 1, pageSize })}
              disabled={pageIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaginationChange({ pageIndex: pageIndex + 1, pageSize })}
              disabled={pageIndex >= pageCount - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { DataTable };