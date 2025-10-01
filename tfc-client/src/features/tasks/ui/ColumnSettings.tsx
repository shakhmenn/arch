import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  Switch,
  Input,
  Label,
  Separator,
} from '@/shared/ui';
import { Settings, GripVertical, Eye, EyeOff } from 'lucide-react';
import { TableColumn } from './VirtualizedTasksTable';
import { cn } from '@/shared/lib/utils';

interface SortableColumnItemProps {
  column: TableColumn;
  onVisibilityToggle: (columnKey: string) => void;
  onWidthChange: (columnKey: string, width: number) => void;
}

const SortableColumnItem: React.FC<SortableColumnItemProps> = ({
  column,
  onVisibilityToggle,
  onWidthChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'flex items-center gap-3 p-3 border rounded-lg bg-background',
        isDragging && 'shadow-lg opacity-50'
      )}
    >
      <div
        {...listeners}
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Switch
          checked={column.visible !== false}
          onCheckedChange={() => onVisibilityToggle(column.key.toString())}
          disabled={column.key === 'select' || column.key === 'actions'}
        />
        
        <div className="flex items-center gap-1 text-sm">
          {column.visible !== false ? (
            <Eye className="h-3 w-3 text-green-600" />
          ) : (
            <EyeOff className="h-3 w-3 text-muted-foreground" />
          )}
          <span className="font-medium">{column.label}</span>
        </div>
      </div>
      
      {column.resizable !== false && (
        <div className="flex items-center gap-2">
          <Label htmlFor={`width-${column.key}`} className="text-xs text-muted-foreground">
            Ширина:
          </Label>
          <Input
            id={`width-${column.key}`}
            type="number"
            value={column.width}
            onChange={(e) => onWidthChange(
              column.key.toString(),
              parseInt(e.target.value) || 100
            )}
            className="w-20 h-8 text-xs"
            min={50}
            max={500}
          />
          <span className="text-xs text-muted-foreground">px</span>
        </div>
      )}
    </div>
  );
};

interface ColumnSettingsProps {
  columns: TableColumn[];
  onColumnsChange: (columns: TableColumn[]) => void;
  className?: string;
}

export const ColumnSettings: React.FC<ColumnSettingsProps> = ({
  columns,
  onColumnsChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState(columns);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = localColumns.findIndex(col => col.key.toString() === active.id);
    const newIndex = localColumns.findIndex(col => col.key.toString() === over.id);

    setLocalColumns(arrayMove(localColumns, oldIndex, newIndex));
  };

  const handleVisibilityToggle = (columnKey: string) => {
    const updatedColumns = localColumns.map(col =>
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    );
    setLocalColumns(updatedColumns);
  };

  const handleWidthChange = (columnKey: string, width: number) => {
    const updatedColumns = localColumns.map(col =>
      col.key === columnKey ? { ...col, width: Math.max(50, width) } : col
    );
    setLocalColumns(updatedColumns);
  };

  const handleSave = () => {
    onColumnsChange(localColumns);
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalColumns(columns);
  };

  const visibleColumnsCount = localColumns.filter(col => col.visible !== false).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2', className)}
        >
          <Settings className="h-4 w-4" />
          Колонки
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Настройка колонок</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Перетащите колонки для изменения порядка. Видимых колонок: {visibleColumnsCount}
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localColumns.map(col => col.key.toString())}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {localColumns.map((column) => (
                  <SortableColumnItem
                    key={column.key}
                    column={column}
                    onVisibilityToggle={handleVisibilityToggle}
                    onWidthChange={handleWidthChange}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          <Separator />
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Сбросить
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave}>
                Применить
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnSettings;