import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../shared/api/client';
import { Workspace } from '../../types';
import Button from '../../shared/components/button';
import Input from '../../shared/components/input';
import Modal from '../../shared/components/modal';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../../shared/components/card';
import { useToast } from '../../shared/components/toast';
import { Building2, Plus, ArrowRight, LogOut } from 'lucide-react';
import { useAuth } from '../auth/auth-context';

export const WorkspacesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logout, user } = useAuth();
  
  const [modalOpen, setModalOpen] = useState(false);
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
    queryKey: ['workspaces'],
    queryFn: () => apiClient.get('/api/workspaces').then(res => res.data),
  });

  // Create workspace mutation
  const createWorkspaceMutation = useMutation({
    mutationFn: (data: { name: string; slug: string; description: string }) => 
      apiClient.post<Workspace>('/api/workspaces', data).then(res => res.data),
    onSuccess: (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast('Workspace created successfully!', 'success');
      setModalOpen(false);
      setName('');
      setSlug('');
      setDescription('');
      navigate(`/workspaces/${newWorkspace.id}/dashboard`);
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Failed to create workspace', 'error');
    }
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

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 flex flex-col p-6 font-sans">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-900 text-sm">WorkNest</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">Logged in as {user?.fullName}</span>
          <Button variant="ghost" size="sm" className="flex items-center gap-1.5 cursor-pointer" onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-center py-10 text-left">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Your Workspaces</h1>
            <p className="text-xs text-zinc-500 mt-1">Select a workspace to view dashboard or create a new one.</p>
          </div>
          <Button 
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Workspace
          </Button>
        </div>

        {workspaces.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-lg p-10 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-zinc-900">No workspaces found</h3>
              <p className="text-xs text-zinc-500 max-w-sm">
                You are not registered in any workspaces yet. Build your first workspace to start organizing projects and tasks.
              </p>
            </div>
            <Button 
              onClick={() => setModalOpen(true)}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Build Workspace
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workspaces.map((workspace) => (
              <Card 
                key={workspace.id}
                className="hover:border-zinc-300 transition-all flex flex-col justify-between"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-4 p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex flex-col gap-0.5 text-left">
                      <CardTitle className="text-sm font-semibold text-zinc-900">{workspace.name}</CardTitle>
                      <span className="text-[10px] text-zinc-400 font-mono">slug: {workspace.slug}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <p className="text-xs text-zinc-600 line-clamp-2 h-8">
                    {workspace.description || 'No description provided.'}
                  </p>
                </CardContent>
                <CardFooter 
                  className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 flex justify-between items-center cursor-pointer"
                  onClick={() => navigate(`/workspaces/${workspace.id}/dashboard`)}
                >
                  <span className="text-[10px] font-medium text-zinc-500">
                    Owner: {workspace.owner?.fullName || 'System'}
                  </span>
                  <div className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-xs font-medium transition-colors">
                    Open
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* New Workspace Creation Dialog */}
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title="Create New Workspace"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <Input
            label="Workspace Name"
            placeholder="e.g. engineering, design, marketing"
            required
            value={name}
            onChange={e => {
              setName(e.target.value);
              setSlug(slugify(e.target.value));
            }}
          />
          <Input
            label="Workspace Web Address (Slug)"
            placeholder="e.g. acme-engineering"
            required
            value={slug}
            onChange={e => setSlug(slugify(e.target.value))}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">Description</label>
            <textarea
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
              placeholder="Describe this workspace..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="cursor-pointer"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="cursor-pointer"
              isLoading={createWorkspaceMutation.isPending}
            >
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default WorkspacesPage;
