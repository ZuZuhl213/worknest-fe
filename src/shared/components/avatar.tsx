import React from 'react';
import { cn } from '../lib/utils';

export interface AvatarProps {
  name: string;
  url?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, url, size = 'md', className }) => {
  const getInitials = (fullName: string) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-indigo-50 text-indigo-700 font-medium overflow-hidden select-none shrink-0 border border-indigo-100',
        sizeClasses[size],
        className
      )}
    >
      {url ? (
        <img
          src={url}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : null}
      <span>{getInitials(name)}</span>
    </div>
  );
};
export default Avatar;
