import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={clsx('animate-pulse rounded-md bg-zinc-200 dark:bg-slate-800', className)}
      {...props}
    />
  );
};

export default Skeleton;
