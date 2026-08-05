import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../../shared/api/client';
import EmptyState from '../../shared/components/empty-state';
import ErrorState from '../../shared/components/error-state';
import type { AdminOverview } from '../../types';

const AdminOverviewPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery<AdminOverview>({
    queryKey: ['admin-overview'],
    queryFn: () => apiClient.get('/api/admin/overview').then((response) => response.data),
  });
  if (isLoading) return <div className="p-8 text-center text-sm text-zinc-500">Loading overview...</div>;
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />;
  const cards = [['Total accounts', data.totalAccounts], ['Active accounts', data.activeAccounts], ['Disabled accounts', data.disabledAccounts], ['Verified email', data.emailVerifiedAccounts]];
  return <section><h1 className="text-xl font-semibold">Admin console</h1><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <div key={String(label)} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-sm text-zinc-500">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</div><div className="mt-6 rounded-xl border border-zinc-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-slate-800"><h2 className="font-medium">Recently created accounts</h2><Link to="/admin/users" className="text-sm text-indigo-600">View all</Link></div>{data.recentUsers.length === 0 ? <EmptyState title="No accounts" /> : <div className="divide-y divide-zinc-100 dark:divide-slate-800">{data.recentUsers.map((user) => <Link key={user.id} to={`/admin/users/${user.id}`} className="flex justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-slate-800"><span><span className="block font-medium">{user.fullName}</span><span className="text-sm text-zinc-500">{user.email}</span></span><span className="text-sm text-zinc-500">{new Date(user.createdAt).toLocaleDateString()}</span></Link>)}</div>}</div></section>;
};

export default AdminOverviewPage;
