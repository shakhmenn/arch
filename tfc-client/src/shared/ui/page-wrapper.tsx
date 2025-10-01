import React, { ReactNode } from 'react';
import { cn } from '../lib/cn.ts';

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className = '' }) => {
  return (
    <div className={cn('p-6 max-w-[1200px] mx-auto w-full', className)}>
      {children}
    </div>
  );
};
