import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import Badge from '../../shared/components/badge';
import EmptyState from '../../shared/components/empty-state';
import ErrorState from '../../shared/components/error-state';
import Select from '../../shared/components/select';
import AdminPagination from './admin-pagination';
import type { PagedResponse, SecurityAuditLog } from '../../types';

const SecurityAuditLogs: React.FC = () => {
  const [params, setParams] = useSearchParams(); const page = Math.max(1, Number(params.get('page')) || 1); const size = Number(params.get('size')) || 20;
  const filters = { page: page - 1, size };
  const { data, isLoading, isError, refetch } = useQuery<PagedResponse<SecurityAuditLog>>({ queryKey: queryKeys.securityAuditLogs(filters), queryFn: () => apiClient.get('/api/admin/security-audit-logs', { params: filters }).then((response) => response.data) });
  useEffect(() => { if (data && data.totalPages > 0 && page > data.totalPages) { const next = new URLSearchParams(params); next.set('page', String(data.totalPages)); setParams(next, { replace: true }); } }, [data, page, params, setParams]);
  const update = (key: string, value: string, reset = true) => { const next = new URLSearchParams(params); next.set(key, value); if (reset) next.set('page', '1'); setParams(next); };
  const logs = data?.content ?? [];
  return <section><h1 className="text-xl font-semibold">Administrative audit logs</h1><div className="mt-5"><Select aria-label="Page size" value={String(size)} onChange={(event) => update('size', event.target.value)} options={[{ value: '20', label: '20 per page' }, { value: '50', label: '50 per page' }, { value: '100', label: '100 per page' }]} /></div><div className="mt-5 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-slate-800 dark:bg-slate-900">{isLoading ? <div className="p-8 text-center text-sm text-zinc-500">Loading audit logs...</div> : isError ? <ErrorState onRetry={() => void refetch()} /> : logs.length === 0 ? <EmptyState title="No audit logs" /> : <table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-zinc-200 text-zinc-500 dark:border-slate-800"><th className="px-4 py-3">Time</th><th>Actor</th><th>Action</th><th>Target account</th><th>Outcome</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id} className="border-b border-zinc-100 last:border-0 dark:border-slate-800"><td className="px-4 py-3">{new Date(log.createdAt).toLocaleString()}</td><td>{log.actor?.fullName ?? log.actor?.email ?? 'System'}</td><td>{log.action}</td><td>{log.target?.fullName ?? log.target?.email ?? '-'}</td><td><Badge variant={log.outcome === 'SUCCESS' ? 'success' : 'danger'}>{log.outcome}</Badge></td></tr>)}</tbody></table>}</div>{data && <AdminPagination data={data} page={page} label="events" onPageChange={(value) => update('page', String(value), false)} />}</section>;
};
export default SecurityAuditLogs;
