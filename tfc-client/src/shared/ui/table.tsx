import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const tableVariants = cva(
  'w-full caption-bottom text-sm border-separate border-spacing-0',
  {
    variants: {
      variant: {
        default: 'border border-border rounded-lg overflow-hidden',
        minimal: 'border-0',
        striped: 'border border-border rounded-lg overflow-hidden [&_tbody_tr:nth-child(even)]:bg-muted/30'
      },
      size: {
        sm: 'text-xs',
        default: 'text-sm',
        lg: 'text-base'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & VariantProps<typeof tableVariants>
>(({ className, variant, size, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn(tableVariants({ variant, size }), className)}
      {...props}
    />
  </div>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      'bg-muted/50 [&_tr]:border-b [&_tr]:border-border/50 sticky top-0 z-10',
      className
    )}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    selected?: boolean;
    clickable?: boolean;
  }
>(({ className, selected, clickable, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-border/50 transition-colors',
      {
        'bg-muted/50': selected,
        'hover:bg-muted/30 cursor-pointer': clickable,
        'data-[state=selected]:bg-muted': selected
      },
      className
    )}
    data-state={selected ? 'selected' : undefined}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

const tableCellVariants = cva(
  'px-4 py-3 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
  {
    variants: {
      variant: {
        default: '',
        header: 'font-medium text-muted-foreground bg-muted/50',
        numeric: 'text-right tabular-nums',
        action: 'text-right'
      },
      size: {
        sm: 'px-2 py-2 text-xs',
        default: 'px-4 py-3',
        lg: 'px-6 py-4'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & 
  VariantProps<typeof tableCellVariants> & {
    sortable?: boolean;
    sortDirection?: 'asc' | 'desc' | null;
  }
>(({ className, variant = 'header', size, sortable, sortDirection, children, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      tableCellVariants({ variant, size }),
      {
        'cursor-pointer select-none hover:bg-muted/70': sortable,
        'relative': sortDirection
      },
      className
    )}
    {...props}
  >
    <div className={cn('flex items-center gap-2', {
      'justify-between': sortable
    })}>
      {children}
      {sortable && (
        <div className="flex flex-col">
          <svg
            className={cn('h-3 w-3 transition-colors', {
              'text-foreground': sortDirection === 'asc',
              'text-muted-foreground': sortDirection !== 'asc'
            })}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      )}
    </div>
  </th>
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & VariantProps<typeof tableCellVariants>
>(({ className, variant, size, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(tableCellVariants({ variant, size }), className)}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  tableVariants,
  tableCellVariants
};