import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useParams } from 'react-router-dom';
import apiClient, { getApiErrorMessage } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import Avatar from '../../shared/components/avatar';
import Badge from '../../shared/components/badge';
import Button from '../../shared/components/button';
import ErrorState from '../../shared/components/error-state';
import Modal from '../../shared/components/modal';
import { useToast } from '../../shared/components/toast';
import { useAuth } from '../auth/auth-context';
import type { User } from '../../types';

const date = (value?: string) => value ? new Date(value).toLocaleString() : 'Never';

const AdminUserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const id = Number(userId);
  const location = useLocation();
  const [confirmAccount, setConfirmAccount] = useState(false);
  const [confirmWorkspaceCreation, setConfirmWorkspaceCreation] = useState(false);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError, refetch } = useQuery<User>({
    queryKey: queryKeys.adminUser(id),
    queryFn: () => apiClient.get(`/api/admin/users/${id}`).then((response) => response.data),
    enabled: Number.isInteger(id) && id > 0,
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.adminUser(id) });
    queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
  };
  const accountMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/admin/users/${id}/${user?.isActive ? 'disable' : 'enable'}`),
    onSuccess: () => { refresh(); toast('Account updated', 'success'); setConfirmAccount(false); },
    onError: (error: unknown) => toast(getApiErrorMessage(error, 'Unable to update account'), 'error'),
  });
  const workspaceCreationMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/admin/users/${id}/workspace-creation/${user?.canCreateWorkspace ? 'disable' : 'enable'}`),
    onSuccess: () => { refresh(); toast('Workspace creation updated', 'success'); setConfirmWorkspaceCreation(false); },
    onError: (error: unknown) => toast(getApiErrorMessage(error, 'Unable to update workspace creation'), 'error'),
  });

  if (!Number.isInteger(id) || id <= 0) return <ErrorState title="Invalid account" />;
  if (isLoading) return <div className="p-8 text-center text-sm text-zinc-500">Loading account...</div>;
  if (isError || !user) return <ErrorState onRetry={() => void refetch()} />;

  const self = user.id === currentUser?.id;
  const back = location.search ? `/admin/users${location.search}` : '/admin/users';
  const workspaceCreationAction = user.canCreateWorkspace ? 'Disable' : 'Enable';
  return <section>
    <Link to={back} className="text-sm text-indigo-600">Back to accounts</Link>
    <div className="mt-4 flex items-start justify-between gap-4">
      <div className="flex items-center gap-3"><Avatar name={user.fullName} url={user.avatarUrl} size="lg" /><div><h1 className="text-xl font-semibold">{user.fullName}</h1><p className="text-sm text-zinc-500">{user.email}</p></div></div>
      <div className="flex gap-2">
        <Button variant={user.canCreateWorkspace ? 'outline' : 'primary'} onClick={() => setConfirmWorkspaceCreation(true)}>{workspaceCreationAction} workspace creation</Button>
        {!self && <Button variant={user.isActive ? 'danger' : 'primary'} onClick={() => setConfirmAccount(true)}>{user.isActive ? 'Disable' : 'Enable'}</Button>}
      </div>
    </div>
    <dl className="mt-6 grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 text-sm sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-900">
      <div><dt>System role</dt><dd className="mt-1"><Badge variant={user.systemRole === 'SYSTEM_ADMIN' ? 'info' : 'default'}>{user.systemRole}</Badge></dd></div>
      <div><dt>Workspace creation</dt><dd className="mt-1"><Badge variant={user.canCreateWorkspace ? 'success' : 'default'}>{user.canCreateWorkspace ? 'Granted' : 'Not granted'}</Badge></dd></div>
      <div><dt>Account status</dt><dd className="mt-1"><Badge variant={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Active' : 'Disabled'}</Badge></dd></div>
      <div><dt>Email verification</dt><dd className="mt-1">{user.emailVerified ? 'Verified' : 'Unverified'}</dd></div>
      <div><dt>Last login</dt><dd className="mt-1">{date(user.lastLoginAt)}</dd></div>
      <div><dt>Created</dt><dd className="mt-1">{date(user.createdAt)}</dd></div>
      <div><dt>Updated</dt><dd className="mt-1">{date(user.updatedAt)}</dd></div>
      <div><dt>Deactivated</dt><dd className="mt-1">{date(user.deactivatedAt)}</dd></div>
    </dl>
    <Modal isOpen={confirmAccount} onClose={() => setConfirmAccount(false)} title={`${user.isActive ? 'Disable' : 'Enable'} account`}><p className="text-sm text-zinc-600">{user.isActive ? `Disable ${user.fullName}'s account? Existing sessions will be revoked.` : `Enable ${user.fullName}'s account?`}</p><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setConfirmAccount(false)}>Cancel</Button><Button variant={user.isActive ? 'danger' : 'primary'} isLoading={accountMutation.isPending} onClick={() => accountMutation.mutate()}>{user.isActive ? 'Disable' : 'Enable'}</Button></div></Modal>
    <Modal isOpen={confirmWorkspaceCreation} onClose={() => setConfirmWorkspaceCreation(false)} title={`${workspaceCreationAction} workspace creation`}><p className="text-sm text-zinc-600">{workspaceCreationAction} workspace creation for {user.fullName}?</p><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setConfirmWorkspaceCreation(false)}>Cancel</Button><Button variant={user.canCreateWorkspace ? 'danger' : 'primary'} isLoading={workspaceCreationMutation.isPending} onClick={() => workspaceCreationMutation.mutate()}>{workspaceCreationAction}</Button></div></Modal>
  </section>;
};

export default AdminUserDetail;
