import React from 'react';
import Button from '../../shared/components/button';
import type { PagedResponse } from '../../types';

interface AdminPaginationProps {
  data: PagedResponse<unknown>;
  page: number;
  label: string;
  onPageChange: (page: number) => void;
}

const pageItems = (page: number, total: number) => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const items: Array<number | '...'> = [1];
  if (page > 4) items.push('...');
  for (let value = Math.max(2, page - 1); value <= Math.min(total - 1, page + 1); value++) items.push(value);
  if (page < total - 3) items.push('...');
  items.push(total);
  return items;
};

const AdminPagination: React.FC<AdminPaginationProps> = ({ data, page, label, onPageChange }) => {
  const totalPages = Math.max(1, data.totalPages);
  const start = data.totalElements === 0 ? 0 : (page - 1) * data.size + 1;
  const end = Math.min(page * data.size, data.totalElements);
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-zinc-500 dark:text-slate-400">{start}-{end} / {data.totalElements} {label}</span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={data.first} onClick={() => onPageChange(page - 1)}>Previous</Button>
        {pageItems(page, totalPages).map((item, index) => item === '...' ? <span key={`ellipsis-${index}`} className="px-1 text-zinc-400">...</span> : <Button key={item} variant={item === page ? 'primary' : 'outline'} size="sm" onClick={() => onPageChange(item)}>{item}</Button>)}
        <Button variant="outline" size="sm" disabled={data.last} onClick={() => onPageChange(page + 1)}>Next</Button>
      </div>
    </div>
  );
};

export default AdminPagination;
