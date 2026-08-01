import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { getApiErrorMessage } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { Project } from '../../types';
import Button from '../../shared/components/button';
import Input from '../../shared/components/input';
import Modal from '../../shared/components/modal';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../../shared/components/card';
import EmptyState from '../../shared/components/empty-state';
import { useToast } from '../../shared/components/toast';
import { FolderKanban, Plus, Clock, User, ArrowRight } from 'lucide-react';

export const ProjectsList: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const activeWorkspaceId = parseInt(workspaceId || '0', 10);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');

  // Fetch projects in workspace
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: queryKeys.projects(activeWorkspaceId),
    queryFn: () => apiClient.get(`/api/workspaces/${activeWorkspaceId}/projects`).then((res) => res.data),
    enabled: !!activeWorkspaceId,
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data: { name: string; projectKey: string; description: string }) =>
      apiClient.post<Project>(`/api/workspaces/${activeWorkspaceId}/projects`, data).then((res) => res.data),
    onSuccess: (newProj) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects(activeWorkspaceId) });
      toast('Project created successfully!', 'success');
      setModalOpen(false);
      setName('');
      setKey('');
      setDescription('');
      navigate(`/workspaces/${activeWorkspaceId}/projects/${newProj.id}`);
    },
    onError: (error: unknown) => {
      toast(getApiErrorMessage(error, 'Failed to create project'), 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;
    createProjectMutation.mutate({
      name,
      projectKey: key.toUpperCase().trim(),
      description,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Title Header */}
      <div className="flex items-center justify-between text-left">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-slate-100">Projects Directory</h1>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1">Manage and launch projects configured within this workspace.</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Workspaces need projects to house tasks. Create your first project below to start scheduling."
          actionLabel="Build Project"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <Card key={proj.id} className="hover:border-zinc-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between">
              <CardHeader className="flex flex-row items-start justify-between gap-4 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center font-mono font-bold text-xs text-indigo-600 dark:text-indigo-300 shrink-0 select-none">
                    {proj.projectKey}
                  </div>
                  <div className="flex flex-col text-left">
                    <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-slate-100">{proj.name}</CardTitle>
                    <span className="text-[10px] text-zinc-400 dark:text-slate-400 font-medium">Key: {proj.projectKey}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0 text-left">
                <p className="text-xs text-zinc-600 dark:text-slate-300 line-clamp-2 h-8">
                  {proj.description || 'No project description provided.'}
                </p>
              </CardContent>
              <CardFooter
                className="px-5 py-3 border-t border-zinc-100 dark:border-slate-800 bg-zinc-50/50 dark:bg-slate-800/40 flex justify-between items-center cursor-pointer"
                onClick={() => navigate(`/workspaces/${workspaceId}/projects/${proj.id}`)}
              >
                <div className="flex items-center gap-3 text-zinc-500 dark:text-slate-400 text-[10px]">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-zinc-400 dark:text-slate-500" aria-hidden="true" />
                    {proj.createdBy?.fullName || 'System'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-zinc-400 dark:text-slate-500" aria-hidden="true" />
                    {new Date(proj.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-medium transition-colors">
                  Open Board
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* New Project Creation Dialog */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Project">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <Input
            label="Project Name"
            placeholder="e.g. Website Redesign"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Project Key (Short Prefix, Max 20 Characters)"
            placeholder="e.g. ENG, DES, RED"
            required
            maxLength={20}
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-description" className="text-xs font-medium text-zinc-500 dark:text-slate-400">
              Description
            </label>
            <textarea
              id="project-description"
              aria-label="Description"
              className="flex w-full rounded-md border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-slate-100 placeholder:text-zinc-400 dark:placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
              placeholder="Describe this project's target objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
            <Button type="submit" className="cursor-pointer" isLoading={createProjectMutation.isPending}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectsList;
