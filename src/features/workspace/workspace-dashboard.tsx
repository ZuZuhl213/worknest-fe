import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { getApiErrorMessage } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { Workspace, Project, WorkspaceMember, WorkspaceRole, PagedResponse } from '../../types';
import { useAuth } from '../auth/auth-context';
import { useToast } from '../../shared/components/toast';
import Button from '../../shared/components/button';
import Input from '../../shared/components/input';
import Modal from '../../shared/components/modal';
import Card, { CardHeader, CardTitle, CardContent } from '../../shared/components/card';
import Badge from '../../shared/components/badge';
import Avatar from '../../shared/components/avatar';
import { 
  Building2, 
  FolderKanban, 
  Users, 
  Trash2, 
  UserPlus, 
  TrendingUp, 
  ShieldCheck 
} from 'lucide-react';

export const WorkspaceDashboard: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const activeWorkspaceId = parseInt(workspaceId || '0', 10);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('MEMBER');

  // 1. Fetch workspace details
  const { data: workspace } = useQuery<Workspace>({
    queryKey: queryKeys.workspace(activeWorkspaceId),
    queryFn: () => apiClient.get(`/api/workspaces/${activeWorkspaceId}`).then((res) => res.data),
    enabled: !!activeWorkspaceId,
  });

  // 2. Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: queryKeys.projects(activeWorkspaceId),
    queryFn: () => apiClient.get(`/api/workspaces/${activeWorkspaceId}/projects`).then((res) => res.data),
    enabled: !!activeWorkspaceId,
  });

  // 3. Fetch workspace members
  const { data: members = [] } = useQuery<WorkspaceMember[]>({
    queryKey: queryKeys.workspaceMembers(activeWorkspaceId),
    queryFn: () =>
      apiClient
        .get<PagedResponse<WorkspaceMember>>(`/api/workspaces/${activeWorkspaceId}/members`, {
          params: { size: 100 },
        })
        .then((res) => res.data.content),
    enabled: !!activeWorkspaceId,
  });

  // Identify current user's membership and role in this workspace
  const currentMember = members.find((m) => m.user.id === user?.id);
  const userRole = currentMember?.role || (workspace?.owner.id === user?.id ? 'OWNER' : 'MEMBER');
  const canManageMembers = userRole === 'OWNER' || userRole === 'ADMIN';

  // Member invitation mutation
  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; role: WorkspaceRole }) =>
      apiClient.post<WorkspaceMember>(`/api/workspaces/${activeWorkspaceId}/members`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaceMembers(activeWorkspaceId) });
      toast('Member invited successfully!', 'success');
      setInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
    },
    onError: (error: unknown) => {
      toast(getApiErrorMessage(error, 'Failed to invite member'), 'error');
    },
  });

  // Member role adjustment mutation
  const updateRoleMutation = useMutation({
    mutationFn: (data: { memberId: number; role: WorkspaceRole }) =>
      apiClient
        .patch<WorkspaceMember>(`/api/workspaces/${activeWorkspaceId}/members/${data.memberId}/role`, {
          role: data.role,
        })
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaceMembers(activeWorkspaceId) });
      toast('Member role updated!', 'success');
    },
    onError: (error: unknown) => {
      toast(getApiErrorMessage(error, 'Failed to update role'), 'error');
    },
  });

  // Member deletion mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: number) =>
      apiClient.delete(`/api/workspaces/${activeWorkspaceId}/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaceMembers(activeWorkspaceId) });
      toast('Member removed from workspace', 'success');
    },
    onError: (error: unknown) => {
      toast(getApiErrorMessage(error, 'Failed to remove member'), 'error');
    },
  });

  // Delete workspace mutation
  const deleteWorkspaceMutation = useMutation({
    mutationFn: () => apiClient.delete(`/api/workspaces/${activeWorkspaceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() });
      toast('Workspace deleted successfully!', 'success');
      navigate('/workspaces');
    },
    onError: (error: unknown) => {
      toast(getApiErrorMessage(error, 'Failed to delete workspace'), 'error');
    },
  });

  const handleDeleteWorkspace = () => {
    if (
      confirm(
        `Are you absolutely sure you want to delete workspace "${workspace?.name}"?\nThis action cannot be undone and will delete all projects, tasks, and comments within this workspace.`
      )
    ) {
      deleteWorkspaceMutation.mutate();
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Dashboard Headline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center shrink-0">
            <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{workspace?.name || 'Workspace'}</h1>
            <p className="text-xs text-zinc-500 dark:text-slate-400">{workspace?.description || 'Workspace overview and settings panel.'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1 font-semibold text-xs bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/60">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Workspace {userRole}
          </Badge>
        </div>
      </div>

      {/* Grid Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center p-5 gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 flex items-center justify-center shrink-0">
            <FolderKanban className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs text-zinc-500 dark:text-slate-400 font-medium">Projects Created</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">{projects.length}</span>
          </div>
        </Card>

        <Card className="flex items-center p-5 gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs text-zinc-500 dark:text-slate-400 font-medium">Workspace Members</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">{members.length}</span>
          </div>
        </Card>

        <Card className="flex items-center p-5 gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs text-zinc-500 dark:text-slate-400 font-medium">Workspace Status</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">
              {workspace?.archived ? 'Archived' : 'Active'}
            </span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects panel column */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-slate-800 p-5">
            <CardTitle className="text-sm font-bold text-zinc-950 dark:text-white">Active Projects</CardTitle>
            <Link
              to={`/workspaces/${activeWorkspaceId}/projects`}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors"
            >
              View directory
            </Link>
          </CardHeader>
          <CardContent className="p-5 flex-1 max-h-[350px] overflow-y-auto flex flex-col gap-3">
            {projects.slice(0, 5).map((proj) => (
              <div
                key={proj.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-slate-800 hover:border-zinc-300 dark:hover:border-slate-700 transition-all bg-white dark:bg-slate-900/90"
              >
                <div className="flex items-start gap-2.5 truncate text-left">
                  <span className="text-zinc-400 dark:text-slate-400 font-mono mt-0.5 text-xs">[{proj.projectKey}]</span>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-slate-100 truncate">{proj.name}</span>
                    <span className="text-[10px] text-zinc-500 dark:text-slate-400 truncate">
                      {proj.description || 'No description.'}
                    </span>
                  </div>
                </div>
                <Link
                  to={`/workspaces/${activeWorkspaceId}/projects/${proj.id}`}
                  className="text-xs border border-zinc-200 dark:border-slate-700 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-zinc-50 dark:hover:bg-slate-700 font-medium text-zinc-700 dark:text-slate-200 shrink-0 transition-colors"
                >
                  Open Board
                </Link>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-10 text-zinc-400 dark:text-slate-400 text-xs italic">
                No projects created in this workspace yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workspace Members Column */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-slate-800 p-5">
            <CardTitle className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
              Members
            </CardTitle>
            {canManageMembers && (
              <Button
                onClick={() => setInviteModalOpen(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-[10px] py-1 cursor-pointer rounded-xl"
              >
                <UserPlus className="h-3 w-3" aria-hidden="true" />
                Invite
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-5 flex-1 max-h-[350px] overflow-y-auto flex flex-col gap-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2 truncate">
                  <Avatar name={member.user.fullName} size="sm" />
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-slate-100 truncate">
                      {member.user.fullName}
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-slate-400 truncate">{member.user.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {canManageMembers && member.user.id !== user?.id && member.role !== 'OWNER' ? (
                    <select
                      aria-label={`Role for ${member.user.fullName}`}
                      value={member.role}
                      onChange={(e) =>
                        updateRoleMutation.mutate({
                          memberId: member.id,
                          role: e.target.value as WorkspaceRole,
                        })
                      }
                      className="text-[10px] rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-zinc-700 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:[color-scheme:dark] cursor-pointer"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MEMBER">MEMBER</option>
                    </select>
                  ) : (
                    <Badge
                      variant={member.role === 'OWNER' ? 'secondary' : 'default'}
                      className="text-[9px] px-1.5 py-0"
                    >
                      {member.role}
                    </Badge>
                  )}

                  {canManageMembers && member.user.id !== user?.id && member.role !== 'OWNER' && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${member.user.fullName} from this workspace?`)) {
                          removeMemberMutation.mutate(member.id);
                        }
                      }}
                      aria-label={`Remove ${member.user.fullName} from workspace`}
                      className="text-zinc-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 p-0.5 rounded cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone - Only visible to Workspace Owner */}
      {userRole === 'OWNER' && (
        <Card className="border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/20 p-5 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Danger Zone</h3>
              <p className="text-xs text-zinc-500 dark:text-slate-400">
                Once you delete a workspace, there is no going back. All projects, tasks, and members will be removed.
              </p>
            </div>
            <Button
              variant="danger"
              onClick={handleDeleteWorkspace}
              isLoading={deleteWorkspaceMutation.isPending}
              className="shrink-0 text-xs font-medium cursor-pointer rounded-xl"
            >
              Delete Workspace
            </Button>
          </div>
        </Card>
      )}

      {/* Member Invitation Modal Dialog */}
      <Modal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Invite Member to Workspace">
        <form onSubmit={handleInvite} className="flex flex-col gap-4 text-left">
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@company.com"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="invite-role" className="text-xs font-medium text-zinc-500 dark:text-slate-400">
              Workspace Role
            </label>
            <select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
              className="flex w-full rounded-xl border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            >
              <option value="MEMBER">MEMBER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer rounded-xl"
              onClick={() => setInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="cursor-pointer rounded-xl" isLoading={inviteMutation.isPending}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WorkspaceDashboard;
