import React from 'react';
import { cn } from '../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ children, className, variant = 'default', ...props }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        {
          'bg-zinc-100 text-zinc-800 border-zinc-200': variant === 'default',
          'bg-indigo-50 text-indigo-700 border-indigo-200': variant === 'secondary',
          'bg-green-50 text-green-700 border-green-200': variant === 'success',
          'bg-amber-50 text-amber-800 border-amber-200': variant === 'warning',
          'bg-red-50 text-red-700 border-red-200': variant === 'danger',
          'bg-blue-50 text-blue-700 border-blue-200': variant === 'info',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
export default Badge;
