import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';

export interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

export const TooltipProvider: React.FC<TooltipProviderProps> = ({ children }) => {
  return <div>{children}</div>;
};

export interface TooltipProps {
  children: React.ReactNode;
  delayDuration?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = (e: MouseEvent) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8
      });
      setIsVisible(true);
    }, 500);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative inline-block">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === TooltipTrigger) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onMouseEnter: showTooltip,
              onMouseLeave: hideTooltip,
              ref: triggerRef
            });
          }
          if (child.type === TooltipContent) {
            return React.cloneElement(child as React.ReactElement<any>, {
              isVisible,
              position
            });
          }
        }
        return child;
      })}
    </div>
  );
};

export interface TooltipTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

export const TooltipTrigger = React.forwardRef<HTMLElement, TooltipTriggerProps>(
  ({ asChild, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        ref
      });
    }
    
    return (
      <span ref={ref as React.RefObject<HTMLSpanElement>} {...props}>
        {children}
      </span>
    );
  }
);
TooltipTrigger.displayName = 'TooltipTrigger';

export interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  isVisible?: boolean;
  position?: { x: number; y: number };
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, isVisible, position, side = 'top', align = 'center', children, ...props }, ref) => {
    if (!isVisible || !position) return null;

    const sideClasses = {
      top: '-translate-y-full -translate-x-1/2',
      right: 'translate-x-full -translate-y-1/2',
      bottom: 'translate-y-full -translate-x-1/2',
      left: '-translate-x-full -translate-y-1/2'
    };

    return (
      <>
        <div
          className="fixed inset-0 z-40 pointer-events-none"
          style={{
            left: position.x,
            top: position.y
          }}
        >
          <div
            ref={ref}
            className={cn(
              'absolute z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md',
              'bg-gray-900 text-white border-gray-700',
              'animate-in fade-in-0 zoom-in-95',
              sideClasses[side],
              className
            )}
            {...props}
          >
            {children}
            {/* Arrow */}
            <div
              className={cn(
                'absolute h-2 w-2 rotate-45 bg-gray-900 border-gray-700',
                side === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2 border-r border-b',
                side === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2 border-l border-b',
                side === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2 border-l border-t',
                side === 'left' && 'right-[-4px] top-1/2 -translate-y-1/2 border-r border-t'
              )}
            />
          </div>
        </div>
      </>
    );
  }
);
TooltipContent.displayName = 'TooltipContent';