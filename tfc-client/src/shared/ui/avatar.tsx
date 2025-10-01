import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        default: 'h-10 w-10',
        lg: 'h-12 w-12 text-lg',
        xl: 'h-16 w-16 text-xl'
      }
    },
    defaultVariants: {
      size: 'default'
    }
  }
);

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof avatarVariants>
>(({ className, size, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(avatarVariants({ size }), className)}
    {...props}
  />
));
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted font-medium text-muted-foreground',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = 'AvatarFallback';

// Avatar Group for multiple avatars
const AvatarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    max?: number;
    spacing?: 'tight' | 'normal' | 'loose';
  }
>(({ className, max = 3, spacing = 'normal', children, ...props }, ref) => {
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = max ? childrenArray.slice(0, max) : childrenArray;
  const remainingCount = childrenArray.length - max;

  const spacingClasses = {
    tight: '-space-x-1',
    normal: '-space-x-2',
    loose: '-space-x-3'
  };

  return (
    <div
      ref={ref}
      className={cn('flex items-center', spacingClasses[spacing], className)}
      {...props}
    >
      {visibleChildren.map((child, index) => (
        <div key={index} className="ring-2 ring-background">
          {child}
        </div>
      ))}
      {remainingCount > 0 && (
        <Avatar size="sm" className="ring-2 ring-background">
          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
            +{remainingCount}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
});
AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, avatarVariants };