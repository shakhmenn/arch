import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}>({ open: false, setOpen: () => {} });

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className, value, onValueChange, placeholder, disabled, children, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const selectRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
        <div ref={selectRef} className={cn('relative', className)} {...props}>
          {children}
        </div>
      </SelectContext.Provider>
    );
  }
);
Select.displayName = 'Select';

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { value, open, setOpen } = React.useContext(SelectContext);
  
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform', open && 'rotate-180')} />
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';



const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open } = React.useContext(SelectContext);
  
  if (!open) return null;
  
  return (
    <div
      ref={ref}
      className={cn(
        'absolute top-full left-0 z-50 min-w-full mt-1 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
SelectContent.displayName = 'SelectContent';

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
  const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext);
  const isSelected = selectedValue === value;
  
  const handleClick = () => {
    onValueChange?.(value);
    setOpen(false);
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        isSelected && 'bg-accent text-accent-foreground',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
});
SelectItem.displayName = 'SelectItem';

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, placeholder, ...props }, ref) => {
  const { value } = React.useContext(SelectContext);
  
  return (
    <span
      ref={ref}
      className={cn('block truncate', !value && 'text-muted-foreground', className)}
      {...props}
    >
      {value || placeholder}
    </span>
  );
});
SelectValue.displayName = 'SelectValue';

const useSelect = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('useSelect must be used within a Select component');
  }
  return context;
};

export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useSelect,
};