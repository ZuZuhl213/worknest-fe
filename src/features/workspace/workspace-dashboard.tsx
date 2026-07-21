import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { getApiErrorMessage } from '../../shared/api/client';
import { Workspace, Project, WorkspaceMember, Role } from '../../types';
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
  Mail, 
  Trash2, 
  UserPlus, 
  TrendingUp, 
  ShieldCheck 
} from 'lucide-react';

export const WorkspaceDashboard: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const activeWorkspaceId = parseInt(workspaceId || '0');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('MEMBER');

  // 1. Fetch workspace details
  const { data: workspace } = useQuery<Workspace>({
    queryKey: ['workspace', activeWorkspaceId],
    queryFn: () => apiClient.get(`/api/workspaces/${activeWorkspaceId}`).then(res => res.data),
    enabled: !!activeWorkspaceId,
  });

  // 2. Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects', activeWorkspaceId],
    queryFn: () => apiClient.get(`/api/workspaces/${activeWorkspaceId}/projects`).then(res => res.data),
    enabled: !!activeWorkspaceId,
  });

  // 3. Fetch workspace members
  const { data: members = [] } = useQuery<WorkspaceMember[]>({
    queryKey: ['workspace-members', activeWorkspaceId],
    queryFn: () => apiClient.get(`/api/workspaces/${activeWorkspaceId}/members`).then(res => res.data),
    enabled: !!activeWorkspaceId,
  });

  // Identify current user's membership and role in this workspace
  const currentMember = members.find(m => m.user.id === user?.id);
  const userRole = currentMember?.role || (workspace?.owner.id === user?.id ? 'OWNER' : 'MEMBER');
  const canManageMembers = userRole === 'OWNER' || userRole === 'ADMIN';

  // Member invitation mutation
  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; role: Role }) => 
      apiClient.post<WorkspaceMember>(`/api/workspaces/${activeWorkspaceId}/members`, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', activeWorkspaceId] });
      toast('Member invited successfully!', 'success');
      setInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
    },
    onError: (error: unknown) => {
      toast(getApiErrorMessage(error, 'Failed to invite member'), 'error');
    }
  });

  // Member role adjustment mutation
  const updateRoleMutation = useMutation({
    mutationFn: (data: { memberId: number; role: Role }) => 
      apiClient.patch<WorkspaceMember>(`/api/workspaces/${activeWorkspaceId}/members/${data.memberId}/role`, { role: data.role }).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', activeWorkspaceId] });
      toast('Member role updated!', 'success');
    },
    onError: (error: unknown) => {
      toast(getApiErrorMessage(error, 'Failed to update role'), 'error');
    }
  });

  // Member deletion mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: number) => 
      apiClient.delete(`/api/workspaces/${activeWorkspaceId}/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', activeWorkspaceId] });
      toast('Member removed from workspace', 'success');
    },
    onError: (error: unknown) => {
      toast(getApiErrorMessage(error, 'Failed to remove member'), 'error');
    }
  });

  // Delete workspace mutation
  const navigate = useNavigate();
  const deleteWorkspaceMutation = useMutation({
    mutationFn: () => apiClient.delete(`/api/workspaces/${activeWorkspaceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast('Workspace deleted successfully!', 'success');
      navigate('/workspaces');
    },
    onError: (error: unknown) => {
      toast(getApiErrorMessage(error, 'Failed to delete workspace'), 'error');
    }
  });

  const handleDeleteWorkspace = () => {
    if (confirm(`Are you absolutely sure you want to delete workspace "${workspace?.name}"?\nThis action cannot be undone and will delete all projects, tasks, and comments within this workspace.`)) {
      deleteWorkspaceMutation.mutate();
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Dashboard Headline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-xl font-semibold text-zinc-900">{workspace?.name || 'Workspace'}</h1>
            <p className="text-xs text-zinc-500">{workspace?.description || 'Workspace overview and settings panel.'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1 font-medium text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            Workspace {userRole}
          </Badge>
        </div>
      </div>

      {/* Grid Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center p-5 gap-4">
          <div className="w-10 h-10 rounded bg-indigo-50 flex items-center justify-center shrink-0">
            <FolderKanban className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs text-zinc-500 font-medium">Projects Created</span>
            <span className="text-lg font-semibold text-zinc-900">{projects.length}</span>
          </div>
        </Card>

        <Card className="flex items-center p-5 gap-4">
          <div className="w-10 h-10 rounded bg-green-50 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs text-zinc-500 font-medium">Workspace Members</span>
            <span className="text-lg font-semibold text-zinc-900">{members.length}</span>
          </div>
        </Card>

        <Card className="flex items-center p-5 gap-4">
          <div className="w-10 h-10 rounded bg-amber-50 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs text-zinc-500 font-medium">Workspace Status</span>
            <span className="text-lg font-semibold text-zinc-900">
              {workspace?.archived ? 'Archived' : 'Active'}
            </span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects panel column */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 p-5">
            <CardTitle className="text-sm font-semibold text-zinc-950">Active Projects</CardTitle>
            <Link 
              to={`/workspaces/${activeWorkspaceId}/projects`} 
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              View directory
            </Link>
          </CardHeader>
          <CardContent className="p-5 flex-1 max-h-[350px] overflow-y-auto flex flex-col gap-3">
            {projects.slice(0, 5).map(proj => (
              <div 
                key={proj.id} 
                className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-all bg-white"
              >
                <div className="flex items-start gap-2.5 truncate text-left">
                  <span className="text-zinc-400 font-mono mt-0.5 text-xs">[{proj.projectKey}]</span>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-semibold text-zinc-900 truncate">{proj.name}</span>
                    <span className="text-[10px] text-zinc-500 truncate">{proj.description || 'No description.'}</span>
                  </div>
                </div>
                <Link 
                  to={`/workspaces/${activeWorkspaceId}/projects/${proj.id}`}
                  className="text-xs border border-zinc-200 px-2.5 py-1 rounded bg-white hover:bg-zinc-50 font-medium text-zinc-700 shrink-0"
                >
                  Open Board
                </Link>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-10 text-zinc-400 text-xs italic">
                No projects created in this workspace yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workspace Members Column */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 p-5">
            <CardTitle className="text-sm font-semibold text-zinc-950 flex items-center gap-1.5">
              Members
            </CardTitle>
            {canManageMembers && (
              <Button 
                onClick={() => setInviteModalOpen(true)}
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 text-[10px] py-1 cursor-pointer"
              >
                <UserPlus className="h-3 w-3" />
                Invite
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-5 flex-1 max-h-[350px] overflow-y-auto flex flex-col gap-3">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2 truncate">
                  <Avatar name={member.user.fullName} size="sm" />
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-semibold text-zinc-900 truncate">{member.user.fullName}</span>
                    <span className="text-[10px] text-zinc-500 truncate">{member.user.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {canManageMembers && member.user.id !== user?.id && member.role !== 'OWNER' ? (
                    <select
                      value={member.role}
                      onChange={e => updateRoleMutation.mutate({ memberId: member.id, role: e.target.value as Role })}
                      className="text-[10px] rounded border border-zinc-200 bg-white p-0.5 text-zinc-700 focus:outline-none cursor-pointer"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MEMBER">MEMBER</option>
                    </select>
                  ) : (
                    <Badge variant={member.role === 'OWNER' ? 'secondary' : 'default'} className="text-[9px] px-1.5 py-0">
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
                      className="text-zinc-400 hover:text-red-600 p-0.5 rounded cursor-pointer transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
        <Card className="border-red-200 bg-red-50/10 p-5 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
              <p className="text-xs text-zinc-500">
                Once you delete a workspace, there is no going back. All projects, tasks, and members will be removed.
              </p>
            </div>
            <Button
              variant="danger"
              onClick={handleDeleteWorkspace}
              isLoading={deleteWorkspaceMutation.isPending}
              className="shrink-0 text-xs font-medium cursor-pointer"
            >
              Delete Workspace
            </Button>
          </div>
        </Card>
      )}

      {/* Member Invitation Modal Dialog */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Member to Workspace"
      >
        <form onSubmit={handleInvite} className="flex flex-col gap-4 text-left">
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@company.com"
            required
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">Workspace Role</label>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as Role)}
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            >
              <option value="MEMBER">MEMBER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="cursor-pointer"
              onClick={() => setInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="cursor-pointer"
              isLoading={inviteMutation.isPending}
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default WorkspaceDashboard;
