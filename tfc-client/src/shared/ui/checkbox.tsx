import * as React from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked = false, indeterminate = false, onCheckedChange, disabled = false, id, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    const isChecked = indeterminate ? 'mixed' : checked;

    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={isChecked}
        id={id}
        ref={ref}
        className={cn(
          'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          (checked || indeterminate) ? 'bg-primary text-primary-foreground' : 'bg-background',
          className
        )}
        disabled={disabled}
        onClick={handleClick}
        {...props}
      >
        {indeterminate ? (
          <Minus className="h-3 w-3" />
        ) : checked ? (
          <Check className="h-3 w-3" />
        ) : null}
      </button>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };