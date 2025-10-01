import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Separator,
  Badge,
} from '@/shared/ui';
import { Filter, X, Calendar, User, Tag } from 'lucide-react';
import { TaskStatus, TaskPriority } from '@/entities/task';
import { cn } from '@/shared/lib/utils';

export interface FilterValue {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'between' | 'greaterThan' | 'lessThan';
  value: any;
  label?: string;
}

export interface TableFiltersProps {
  filters: FilterValue[];
  onFiltersChange: (filters: FilterValue[]) => void;
  availableUsers?: Array<{ id: string; name: string; avatar?: string }>;
  className?: string;
}

const FILTER_OPERATORS = {
  text: [
    { value: 'contains', label: 'Содержит' },
    { value: 'equals', label: 'Равно' },
    { value: 'startsWith', label: 'Начинается с' },
    { value: 'endsWith', label: 'Заканчивается на' },
  ],
  select: [
    { value: 'equals', label: 'Равно' },
    { value: 'in', label: 'В списке' },
  ],
  date: [
    { value: 'equals', label: 'Равно' },
    { value: 'greaterThan', label: 'После' },
    { value: 'lessThan', label: 'До' },
    { value: 'between', label: 'Между' },
  ],
};

const FILTER_FIELDS = [
  { value: 'title', label: 'Название', type: 'text' },
  { value: 'description', label: 'Описание', type: 'text' },
  { value: 'status', label: 'Статус', type: 'select', options: TaskStatus ? Object.values(TaskStatus) : [] },
  { value: 'priority', label: 'Приоритет', type: 'select', options: TaskPriority ? Object.values(TaskPriority) : [] },
  { value: 'assigneeId', label: 'Исполнитель', type: 'user' },
  { value: 'dueDate', label: 'Срок выполнения', type: 'date' },
  { value: 'createdAt', label: 'Дата создания', type: 'date' },
  { value: 'updatedAt', label: 'Дата обновления', type: 'date' },
];

const STATUS_LABELS = TaskStatus ? {
  [TaskStatus.TODO]: 'К выполнению',
  [TaskStatus.IN_PROGRESS]: 'В работе',
  [TaskStatus.IN_REVIEW]: 'На проверке',
  [TaskStatus.DONE]: 'Выполнено',
} : {};

const PRIORITY_LABELS = TaskPriority ? {
  [TaskPriority.LOW]: 'Низкий',
  [TaskPriority.MEDIUM]: 'Средний',
  [TaskPriority.HIGH]: 'Высокий',
  [TaskPriority.URGENT]: 'Критический',
} : {};

export const TableFilters: React.FC<TableFiltersProps> = ({
  filters,
  onFiltersChange,
  availableUsers = [],
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newFilter, setNewFilter] = useState<Partial<FilterValue>>({
    field: '',
    operator: 'equals',
    value: '',
  });

  const addFilter = () => {
    if (!newFilter.field || newFilter.value === '' || newFilter.value === undefined) return;

    const field = FILTER_FIELDS.find(f => f.value === newFilter.field);
    let label = `${field?.label}: `;
    
    if (newFilter.field === 'status') {
      label += STATUS_LABELS[newFilter.value as TaskStatus] || newFilter.value;
    } else if (newFilter.field === 'priority') {
      label += PRIORITY_LABELS[newFilter.value as TaskPriority] || newFilter.value;
    } else if (newFilter.field === 'assigneeId') {
      const user = availableUsers.find(u => u.id === newFilter.value);
      label += user?.name || 'Неизвестный пользователь';
    } else {
      label += newFilter.value;
    }

    const filter: FilterValue = {
      field: newFilter.field!,
      operator: newFilter.operator!,
      value: newFilter.value,
      label,
    };

    onFiltersChange([...filters, filter]);
    setNewFilter({ field: '', operator: 'equals', value: '' });
  };

  const removeFilter = (index: number) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    onFiltersChange(updatedFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange([]);
  };

  const selectedField = FILTER_FIELDS.find(f => f.value === newFilter.field);
  const availableOperators = selectedField ? FILTER_OPERATORS[selectedField.type as keyof typeof FILTER_OPERATORS] || [] : [];

  const renderValueInput = () => {
    if (!selectedField) return null;

    switch (selectedField.type) {
      case 'select':
        return (
          <Select
            value={newFilter.value}
            onValueChange={(value) => setNewFilter({ ...newFilter, value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите значение" />
            </SelectTrigger>
            <SelectContent>
              {selectedField.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {selectedField.value === 'status' ? STATUS_LABELS[option as TaskStatus] :
                   selectedField.value === 'priority' ? PRIORITY_LABELS[option as TaskPriority] :
                   option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'user':
        return (
          <Select
            value={newFilter.value}
            onValueChange={(value) => setNewFilter({ ...newFilter, value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите пользователя" />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map((user) => (
                <SelectItem key={user.id} value={user.id} className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={newFilter.value}
            onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
          />
        );
      
      default:
        return (
          <Input
            type="text"
            placeholder="Введите значение"
            value={newFilter.value}
            onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
          />
        );
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Active Filters */}
      {filters.map((filter, index) => (
        <Badge key={index} variant="secondary" className="gap-1">
          {filter.label}
          <button
            onClick={() => removeFilter(index)}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      
      {/* Clear All Button */}
      {filters.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          Очистить все
        </Button>
      )}
      
      {/* Add Filter Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Фильтры
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить фильтр</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Поле</Label>
              <Select
                value={newFilter.field}
                onValueChange={(value) => setNewFilter({ ...newFilter, field: value, operator: 'equals', value: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите поле" />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_FIELDS.map((field) => (
                    <SelectItem key={field.value} value={field.value} className="flex items-center gap-2">
                      {field.type === 'date' && <Calendar className="h-4 w-4" />}
                      {field.type === 'user' && <User className="h-4 w-4" />}
                      {field.type === 'select' && <Tag className="h-4 w-4" />}
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedField && (
              <div className="space-y-2">
                <Label>Условие</Label>
                <Select
                  value={newFilter.operator}
                  onValueChange={(value) => setNewFilter({ ...newFilter, operator: value as FilterValue['operator'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOperators.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {selectedField && (
              <div className="space-y-2">
                <Label>Значение</Label>
                {renderValueInput()}
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Отмена
              </Button>
              <Button 
                onClick={() => {
                  addFilter();
                  setIsOpen(false);
                }}
                disabled={!newFilter.field || newFilter.value === '' || newFilter.value === undefined}
              >
                Добавить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableFilters;