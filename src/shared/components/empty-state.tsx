import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import Button from './button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 border border-zinc-100 dark:border-slate-800 rounded-xl ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-slate-800 text-zinc-500 dark:text-slate-400 mb-3">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-slate-100 mb-1">{title}</h3>
      {description && <p className="text-xs text-zinc-500 dark:text-slate-400 max-w-sm mb-4 leading-relaxed">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="cursor-pointer">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
