import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';
import { Check } from 'lucide-react';

export interface DropdownMenuProps {
  children: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === DropdownMenuTrigger) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onClick: () => setIsOpen(!isOpen)
            });
          }
          if (child.type === DropdownMenuContent) {
            return React.cloneElement(child as React.ReactElement<any>, {
              isOpen,
              onClose: () => setIsOpen(false)
            });
          }
        }
        return child;
      })}
    </div>
  );
};

export interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ className, asChild, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        ref,
        className: cn(children.props.className, className)
      });
    }
    
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
  onClose?: () => void;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, isOpen, onClose, align = 'center', side = 'bottom', children, ...props }, ref) => {
    if (!isOpen) return null;

    const alignmentClasses = {
      start: 'left-0',
      center: 'left-1/2 -translate-x-1/2',
      end: 'right-0'
    };

    const sideClasses = {
      top: 'bottom-full mb-2',
      right: 'left-full ml-2 top-0',
      bottom: 'top-full mt-2',
      left: 'right-full mr-2 top-0'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
          'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
          sideClasses[side],
          alignmentClasses[align],
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === DropdownMenuItem) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onClick: (e: React.MouseEvent) => {
                child.props.onClick?.(e);
                onClose?.();
              }
            });
          }
          return child;
        })}
      </div>
    );
  }
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

export interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
}

export const DropdownMenuItem = React.forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ className, inset, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
          'transition-colors focus:bg-accent focus:text-accent-foreground',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          'disabled:pointer-events-none disabled:opacity-50',
          inset && 'pl-8',
          className
        )}
        {...props}
      />
    );
  }
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

export interface DropdownMenuCheckboxItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const DropdownMenuCheckboxItem = React.forwardRef<HTMLButtonElement, DropdownMenuCheckboxItemProps>(
  ({ className, children, checked, onCheckedChange, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
          'transition-colors focus:bg-accent focus:text-accent-foreground',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          'disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        onClick={(e) => {
          onCheckedChange?.(!checked);
          props.onClick?.(e);
        }}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {checked && <Check className="h-4 w-4" />}
        </span>
        {children}
      </button>
    );
  }
);
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

export interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('-mx-1 my-1 h-px bg-muted bg-gray-200 dark:bg-gray-600', className)}
        {...props}
      />
    );
  }
);
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

export const DropdownMenuLabel = React.forwardRef<HTMLDivElement, DropdownMenuLabelProps>(
  ({ className, inset, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'px-2 py-1.5 text-sm font-semibold',
          inset && 'pl-8',
          className
        )}
        {...props}
      />
    );
  }
);
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export interface DropdownMenuSubProps {
  children: React.ReactNode;
}

export const DropdownMenuSub: React.FC<DropdownMenuSubProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const subMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subMenuRef.current && !subMenuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={subMenuRef} className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === DropdownMenuSubTrigger) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onClick: () => setIsOpen(!isOpen)
            });
          }
          if (child.type === DropdownMenuSubContent) {
            return React.cloneElement(child as React.ReactElement<any>, {
              isOpen,
              onClose: () => setIsOpen(false)
            });
          }
        }
        return child;
      })}
    </div>
  );
};

export interface DropdownMenuSubTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
}

export const DropdownMenuSubTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuSubTriggerProps>(
  ({ className, inset, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
          'transition-colors focus:bg-accent focus:text-accent-foreground',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          'disabled:pointer-events-none disabled:opacity-50',
          inset && 'pl-8',
          className
        )}
        {...props}
      >
        {children}
        <span className="ml-auto">›</span>
      </button>
    );
  }
);
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

export interface DropdownMenuSubContentProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
  onClose?: () => void;
}

export const DropdownMenuSubContent = React.forwardRef<HTMLDivElement, DropdownMenuSubContentProps>(
  ({ className, isOpen, onClose, children, ...props }, ref) => {
    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'absolute left-full top-0 z-50 ml-1 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
          'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === DropdownMenuItem) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onClick: (e: React.MouseEvent) => {
                child.props.onClick?.(e);
                onClose?.();
              }
            });
          }
          return child;
        })}
      </div>
    );
  }
);
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';