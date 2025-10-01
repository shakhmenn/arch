import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { TaskStatus, TaskPriority } from '@/entities/task';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border border-primary/20',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive/10 text-destructive border border-destructive/20',
        success: 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
        info: 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        outline: 'text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground'
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        default: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  status?: TaskStatus;
  priority?: TaskPriority;
  withDot?: boolean;
}

// Status color mapping
const getStatusVariant = (status: TaskStatus): VariantProps<typeof statusBadgeVariants>['variant'] => {
  switch (status) {
    case TaskStatus.TODO:
      return 'outline';
    case TaskStatus.PENDING:
      return 'secondary';
    case TaskStatus.IN_PROGRESS:
      return 'info';
    case TaskStatus.IN_REVIEW:
      return 'warning';
    case TaskStatus.DONE:
      return 'success';
    case TaskStatus.CANCELLED:
      return 'destructive';
    default:
      return 'default';
  }
};

// Priority color mapping
const getPriorityVariant = (priority: TaskPriority): VariantProps<typeof statusBadgeVariants>['variant'] => {
  switch (priority) {
    case TaskPriority.LOW:
      return 'success';
    case TaskPriority.MEDIUM:
      return 'warning';
    case TaskPriority.HIGH:
      return 'destructive';
    case TaskPriority.URGENT:
      return 'destructive';
    default:
      return 'default';
  }
};

// Status dot colors
const getStatusDotColor = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.TODO:
      return 'bg-gray-400';
    case TaskStatus.PENDING:
      return 'bg-gray-500';
    case TaskStatus.IN_PROGRESS:
      return 'bg-blue-500';
    case TaskStatus.IN_REVIEW:
      return 'bg-yellow-500';
    case TaskStatus.DONE:
      return 'bg-green-500';
    case TaskStatus.CANCELLED:
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
};

// Priority dot colors
const getPriorityDotColor = (priority: TaskPriority): string => {
  switch (priority) {
    case TaskPriority.LOW:
      return 'bg-green-500';
    case TaskPriority.MEDIUM:
      return 'bg-yellow-500';
    case TaskPriority.HIGH:
      return 'bg-orange-500';
    case TaskPriority.URGENT:
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
};

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, variant, size, status, priority, withDot = false, children, ...props }, ref) => {
    // Determine variant based on status or priority if not explicitly provided
    const computedVariant = variant || 
      (status ? getStatusVariant(status) : undefined) ||
      (priority ? getPriorityVariant(priority) : undefined) ||
      'default';

    // Determine dot color
    const dotColor = status ? getStatusDotColor(status) : 
                    priority ? getPriorityDotColor(priority) : 
                    'bg-gray-400';

    return (
      <div
        ref={ref}
        className={cn(statusBadgeVariants({ variant: computedVariant, size }), className)}
        {...props}
      >
        {withDot && (
          <div className={cn('h-2 w-2 rounded-full', dotColor)} />
        )}
        {children}
      </div>
    );
  }
);
StatusBadge.displayName = 'StatusBadge';

// Predefined status badges
const TaskStatusBadge: React.FC<{
  status: TaskStatus;
  withDot?: boolean;
  size?: VariantProps<typeof statusBadgeVariants>['size'];
}> = ({ status, withDot = true, size = 'default' }) => {
  const getStatusLabel = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.TODO:
        return 'To Do';
      case TaskStatus.PENDING:
        return 'Pending';
      case TaskStatus.IN_PROGRESS:
        return 'In Progress';
      case TaskStatus.IN_REVIEW:
        return 'In Review';
      case TaskStatus.DONE:
        return 'Done';
      case TaskStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <StatusBadge status={status} withDot={withDot} size={size}>
      {getStatusLabel(status)}
    </StatusBadge>
  );
};

const TaskPriorityBadge: React.FC<{
  priority: TaskPriority;
  withDot?: boolean;
  size?: VariantProps<typeof statusBadgeVariants>['size'];
}> = ({ priority, withDot = true, size = 'default' }) => {
  const getPriorityLabel = (priority: TaskPriority): string => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'Low';
      case TaskPriority.MEDIUM:
        return 'Medium';
      case TaskPriority.HIGH:
        return 'High';
      case TaskPriority.URGENT:
        return 'Urgent';
      default:
        return priority;
    }
  };

  return (
    <StatusBadge priority={priority} withDot={withDot} size={size}>
      {getPriorityLabel(priority)}
    </StatusBadge>
  );
};

export {
  StatusBadge,
  TaskStatusBadge,
  TaskPriorityBadge,
  statusBadgeVariants,
  getStatusVariant,
  getPriorityVariant
};