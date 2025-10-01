import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';

export interface PopoverProps {
  children: React.ReactNode;
}

export const Popover: React.FC<PopoverProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={popoverRef} className="relative inline-block">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === PopoverTrigger) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onClick: () => setIsOpen(!isOpen),
              'aria-expanded': isOpen
            });
          }
          if (child.type === PopoverContent) {
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

export interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
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
PopoverTrigger.displayName = 'PopoverTrigger';

export interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
  onClose?: () => void;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  alignOffset?: number;
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ 
    className, 
    isOpen, 
    onClose, 
    align = 'center', 
    side = 'bottom', 
    sideOffset = 4,
    alignOffset = 0,
    children, 
    ...props 
  }, ref) => {
    if (!isOpen) return null;

    const alignmentClasses = {
      start: 'left-0',
      center: 'left-1/2 -translate-x-1/2',
      end: 'right-0'
    };

    const sideClasses = {
      top: `bottom-full mb-${sideOffset}`,
      right: `left-full ml-${sideOffset} top-0`,
      bottom: `top-full mt-${sideOffset}`,
      left: `right-full mr-${sideOffset} top-0`
    };

    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 z-40" onClick={onClose} />
        
        {/* Content */}
        <div
          ref={ref}
          className={cn(
            'absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
            'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
            'animate-in data-[side=bottom]:slide-in-from-top-2',
            'data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2',
            'data-[side=top]:slide-in-from-bottom-2',
            sideClasses[side],
            alignmentClasses[align],
            className
          )}
          data-side={side}
          data-align={align}
          style={{
            [align === 'start' ? 'left' : align === 'end' ? 'right' : 'left']: 
              align === 'center' ? '50%' : alignOffset
          }}
          {...props}
        >
          {children}
          
          {/* Arrow */}
          <div
            className={cn(
              'absolute h-2 w-2 rotate-45 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
              side === 'top' && 'bottom-[-5px] left-1/2 -translate-x-1/2 border-l-0 border-t-0',
              side === 'right' && 'left-[-5px] top-1/2 -translate-y-1/2 border-r-0 border-t-0',
              side === 'bottom' && 'top-[-5px] left-1/2 -translate-x-1/2 border-r-0 border-b-0',
              side === 'left' && 'right-[-5px] top-1/2 -translate-y-1/2 border-l-0 border-b-0'
            )}
          />
        </div>
      </>
    );
  }
);
PopoverContent.displayName = 'PopoverContent';