import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient, { getApiErrorMessage } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { Workspace } from '../../types';
import Button from '../../shared/components/button';
import Input from '../../shared/components/input';
import Modal from '../../shared/components/modal';
import Avatar from '../../shared/components/avatar';
import Badge from '../../shared/components/badge';
import EmptyState from '../../shared/components/empty-state';
import { useToast } from '../../shared/components/toast';
import { ThemeToggle } from '../../shared/theme/theme-toggle';
import { 
  Building2, 
  Plus, 
  ArrowRight, 
  LogOut, 
  User, 
  Search, 
  Layers, 
  Sparkles
} from 'lucide-react';
import { useAuth } from '../auth/auth-context';
import UserProfile from '../auth/user-profile';

export const WorkspacesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logout, user } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  };

  // Fetch workspaces list
  const { data: workspaces = [], isLoading } = useQuery<Workspace[]>({
    queryKey: queryKeys.workspaces(),
    queryFn: () => apiClient.get('/api/workspaces').then((res) => res.data),
  });

  // Create workspace mutation
  const createWorkspaceMutation = useMutation({
    mutationFn: (data: { name: string; slug: string; description: string }) =>
      apiClient.post<Workspace>('/api/workspaces', data).then((res) => res.data),
    onSuccess: (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() });
      toast('Workspace created successfully!', 'success');
      setModalOpen(false);
      setName('');
      setSlug('');
      setDescription('');
      navigate(`/workspaces/${newWorkspace.id}/dashboard`);
    },
    onError: (error: unknown) => {
      toast(getApiErrorMessage(error, 'Failed to create workspace'), 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    createWorkspaceMutation.mutate({ name, slug, description });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredWorkspaces = workspaces.filter(
    (ws) =>
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ws.description && ws.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading workspaces...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/50 via-slate-50 to-slate-100 dark:from-indigo-950/40 dark:via-slate-950 dark:to-slate-900 flex flex-col p-4 sm:p-8 font-sans antialiased text-slate-800 dark:text-slate-100 relative overflow-hidden transition-colors duration-200">
      {/* Ambient background blur spots for visual warmth */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-violet-400/10 dark:bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 py-4 px-3 sm:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm relative z-50">
        {/* Prominent Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 border border-indigo-400/30">
            <Layers className="h-5.5 w-5.5" aria-hidden="true" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">WorkNest</span>
              <span className="hidden md:inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-100/80 dark:border-indigo-800/80">
                <Sparkles className="w-2.5 h-2.5" /> Workspace Hub
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">Collaborative Team Management</span>
          </div>
        </div>

        {/* Right Actions: Theme Toggle + Profile Button + Logout Button */}
        <div className="flex items-center gap-2.5 w-full justify-end sm:w-auto">
          {/* Theme Selector (Light / Dark / System) */}
          <ThemeToggle variant="dropdown" />

          {/* Profile Button */}
          <button
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 text-xs font-medium transition-all shadow-2xs group cursor-pointer"
            title="View & Edit Profile"
          >
            <Avatar name={user?.fullName || 'User'} url={user?.avatarUrl} size="sm" />
            <div className="flex flex-col text-left hidden sm:flex">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {user?.fullName || 'My Account'}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal">View Profile</span>
            </div>
            <User className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ml-0.5" aria-hidden="true" />
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/40 hover:bg-rose-100/80 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-medium transition-all shadow-2xs cursor-pointer"
            title="Sign out of your account"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area - Unified Workspace Panel */}
      <main className="max-w-6xl w-full mx-auto flex-1 flex flex-col my-6 relative z-10">
        <div className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-black/50 overflow-hidden flex flex-col">
          {/* Panel Header */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/90 via-white to-indigo-50/30 dark:from-slate-900/90 dark:via-slate-900 dark:to-indigo-950/20">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white">Your Workspaces</h1>
                  <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800/60 text-xs font-semibold px-2.5 py-0.5">
                    {workspaces.length} {workspaces.length === 1 ? 'Workspace' : 'Workspaces'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select a workspace to enter your dashboard or create a new team space.
                </p>
              </div>
            </div>

            {/* Panel Controls: Search + New Workspace Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
              {workspaces.length > 0 && (
                <div className="relative w-full min-w-0 sm:min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                  <input
                    type="text"
                    aria-label="Search workspaces"
                    placeholder="Search workspaces..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              )}
              <Button
                onClick={() => setModalOpen(true)}
                className="flex items-center justify-center gap-2 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-500/20 rounded-xl px-4 py-2 cursor-pointer border-0"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New Workspace
              </Button>
            </div>
          </div>

          {/* Panel Body: Grid of Workspaces */}
          <div className="p-6 bg-slate-50/50 dark:bg-slate-950/50 min-h-[340px] flex flex-col justify-center">
            {workspaces.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No workspaces found"
                description="You are not registered in any workspaces yet. Build your first workspace to start organizing projects and tasks."
                actionLabel="Create First Workspace"
                onAction={() => setModalOpen(true)}
              />
            ) : filteredWorkspaces.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                No workspaces match "<span className="font-semibold text-slate-700 dark:text-slate-200">{searchQuery}</span>".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                {filteredWorkspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    onClick={() => navigate(`/workspaces/${workspace.id}/dashboard`)}
                    className="group relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 transition-all duration-200 flex flex-col justify-between cursor-pointer text-left overflow-hidden"
                  >
                    {/* Top gradient highlight strip on hover */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div>
                      {/* Workspace Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-slate-800 dark:to-slate-800 border border-indigo-100/80 dark:border-slate-700/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:from-indigo-600 group-hover:to-violet-600 group-hover:text-white dark:group-hover:from-indigo-600 dark:group-hover:to-violet-600 dark:group-hover:text-white transition-all duration-200 shadow-2xs">
                          <Building2 className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-700/60">
                          {workspace.slug}
                        </span>
                      </div>

                      {/* Workspace Name & Description */}
                      <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {workspace.name}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 mb-4 leading-relaxed min-h-[2.25rem]">
                        {workspace.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Workspace Footer */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Avatar name={workspace.owner?.fullName || 'System'} url={workspace.owner?.avatarUrl} size="sm" />
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                          {workspace.owner?.fullName || 'System'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 text-xs font-semibold transition-colors">
                        <span>Open</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      <Modal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} title="My Profile & Settings">
        <UserProfile />
      </Modal>

      {/* New Workspace Creation Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Workspace">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <Input
            label="Workspace Name"
            placeholder="e.g. Engineering, Design, Marketing"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSlug(slugify(e.target.value));
            }}
          />
          <Input
            label="Workspace Web Address (Slug)"
            placeholder="e.g. acme-engineering"
            required
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="workspace-description" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              id="workspace-description"
              aria-label="Description"
              className="flex w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[85px]"
              placeholder="Describe the purpose of this workspace..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer rounded-xl"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="cursor-pointer rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
              isLoading={createWorkspaceMutation.isPending}
            >
              Create Workspace
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WorkspacesPage;
