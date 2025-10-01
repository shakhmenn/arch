import { TaskPriority } from '@/entities/task/model/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';

interface PrioritySelectProps {
  value: TaskPriority;
  onValueChange: (value: TaskPriority) => void;
  disabled?: boolean;
}

const priorityConfig = {
  [TaskPriority.LOW]: {
    label: 'Низкий',
    variant: 'secondary' as const,
    color: 'bg-gray-100 text-gray-800',
  },
  [TaskPriority.MEDIUM]: {
    label: 'Средний',
    variant: 'default' as const,
    color: 'bg-blue-100 text-blue-800',
  },
  [TaskPriority.HIGH]: {
    label: 'Высокий',
    variant: 'destructive' as const,
    color: 'bg-orange-100 text-orange-800',
  },
  [TaskPriority.URGENT]: {
    label: 'Срочный',
    variant: 'destructive' as const,
    color: 'bg-red-100 text-red-800',
  },
};

export const PrioritySelect = ({ value, onValueChange, disabled }: PrioritySelectProps) => {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue>
          <div className="flex items-center gap-2">
            <Badge 
              variant={priorityConfig[value].variant}
              className={priorityConfig[value].color}
            >
              {priorityConfig[value].label}
            </Badge>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(priorityConfig).map(([priority, config]) => (
          <SelectItem key={priority} value={priority}>
            <div className="flex items-center gap-2">
              <Badge 
                variant={config.variant}
                className={config.color}
              >
                {config.label}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};