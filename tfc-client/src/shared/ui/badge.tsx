import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge };

// Task-specific badge components
interface TaskStatusBadgeProps {
  status: string;
  className?: string;
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'todo':
        return { label: 'To Do', variant: 'outline' as const, className: 'border-gray-300 text-gray-700' };
      case 'in_progress':
        return { label: 'In Progress', variant: 'default' as const, className: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'completed':
        return { label: 'Completed', variant: 'default' as const, className: 'bg-green-100 text-green-800 border-green-200' };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'destructive' as const };
      default:
        return { label: status, variant: 'outline' as const };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
};

interface TaskPriorityBadgeProps {
  priority: string;
  className?: string;
}

export const TaskPriorityBadge: React.FC<TaskPriorityBadgeProps> = ({ priority, className }) => {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'low':
        return { label: 'Low', variant: 'outline' as const, className: 'border-gray-300 text-gray-600' };
      case 'medium':
        return { label: 'Medium', variant: 'default' as const, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      case 'high':
        return { label: 'High', variant: 'default' as const, className: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'urgent':
        return { label: 'Urgent', variant: 'destructive' as const };
      default:
        return { label: priority, variant: 'outline' as const };
    }
  };

  const config = getPriorityConfig(priority);
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
};