import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../shared/api/client';
import { Project, Task, PagedResponse } from '../../types';
import { useAuth } from '../auth/auth-context';
import { useToast } from '../../shared/components/toast';
import Card, { CardHeader, CardTitle, CardContent } from '../../shared/components/card';
import Badge from '../../shared/components/badge';
import TaskDetailDrawer from './task-detail-drawer';
import { CheckSquare, Calendar, ChevronRight, AlertCircle, PlayCircle, ClipboardList } from 'lucide-react';

export const MyTasksView: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const activeWorkspaceId = parseInt(workspaceId || '0');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [activeProjId, setActiveProjId] = useState<number | null>(null);

  // 1. Fetch projects in workspace
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ['projects', activeWorkspaceId],
    queryFn: () => apiClient.get(`/api/workspaces/${activeWorkspaceId}/projects`).then(res => res.data),
    enabled: !!activeWorkspaceId,
  });

  // 2. Fetch tasks assigned to current user across all projects in workspace
  const { data: allUserTasks = [], isLoading: isTasksLoading } = useQuery<Task[]>({
    queryKey: ['my-tasks', activeWorkspaceId, projects],
    queryFn: async () => {
      if (projects.length === 0) return [];
      const fetchPromises = projects.map(async (proj) => {
        try {
          const res = await apiClient.get<PagedResponse<Task>>(
            `/api/workspaces/${activeWorkspaceId}/projects/${proj.id}/tasks`, 
            { params: { assigneeId: user?.id, size: 50 } }
          );
          // Append project info to each task for display convenience
          return res.data.content.map(task => ({
            ...task,
            projectName: proj.name,
            projectKey: proj.projectKey
          }));
        } catch (e) {
          return [];
        }
      });
      const results = await Promise.all(fetchPromises);
      return results.flat();
    },
    enabled: !!activeWorkspaceId && projects.length > 0 && !!user?.id,
  });

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'danger';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      default: return 'default';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'DONE': return 'success';
      case 'REVIEW': return 'warning';
      case 'IN_PROGRESS': return 'secondary';
      default: return 'default';
    }
  };

  const isLoading = isProjectsLoading || isTasksLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const openTasks = allUserTasks.filter(t => t.status !== 'DONE');
  const doneTasks = allUserTasks.filter(t => t.status === 'DONE');

  return (
    <div className="flex flex-col gap-6">
      {/* Title Header */}
      <div className="flex items-center justify-between text-left">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">My Tasks</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Consolidated overview of tasks assigned to you in workspace #{activeWorkspaceId}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Open Tasks List */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 border-b border-zinc-100 p-5">
            <ClipboardList className="h-4.5 w-4.5 text-indigo-600" />
            <CardTitle className="text-sm font-semibold text-zinc-950">Active Work Items ({openTasks.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-left">
            <div className="divide-y divide-zinc-150">
              {openTasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => {
                    setActiveTaskId(task.id);
                    setActiveProjId(task.projectId);
                  }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-zinc-50/50 transition-colors cursor-pointer gap-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-[10px] text-zinc-400 font-mono shrink-0 select-none">
                      {(task as any).projectKey}-{task.taskNumber}
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-semibold text-zinc-900 line-clamp-1">{task.title}</span>
                      <span className="text-[10px] text-zinc-500">Project: {(task as any).projectName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <Badge variant={getStatusBadgeVariant(task.status)} className="text-[9px] px-2 py-0">
                      {task.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant={getPriorityBadgeVariant(task.priority)} className="text-[9px] px-2 py-0">
                      {task.priority}
                    </Badge>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                      <Calendar className="h-3.5 w-3.5" />
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-300" />
                  </div>
                </div>
              ))}

              {openTasks.length === 0 && (
                <div className="text-center py-10 text-zinc-400 text-xs italic">
                  All caught up! You have no active tasks assigned.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completed Tasks List */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 border-b border-zinc-100 p-5">
            <CheckSquare className="h-4.5 w-4.5 text-green-600" />
            <CardTitle className="text-sm font-semibold text-zinc-950">Completed Items ({doneTasks.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-left">
            <div className="divide-y divide-zinc-150">
              {doneTasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => {
                    setActiveTaskId(task.id);
                    setActiveProjId(task.projectId);
                  }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-zinc-50/50 transition-colors cursor-pointer gap-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-[10px] text-zinc-400 font-mono shrink-0 select-none">
                      {(task as any).projectKey}-{task.taskNumber}
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-semibold text-zinc-900 line-through text-zinc-500 line-clamp-1">{task.title}</span>
                      <span className="text-[10px] text-zinc-400">Project: {(task as any).projectName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <Badge variant="success" className="text-[9px] px-2 py-0">
                      DONE
                    </Badge>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                      Completed: {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'N/A'}
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-300" />
                  </div>
                </div>
              ))}

              {doneTasks.length === 0 && (
                <div className="text-center py-10 text-zinc-400 text-xs italic">
                  No completed tasks.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Drawer overlay view */}
      {activeTaskId && activeProjId && (
        <TaskDetailDrawer
          taskId={activeTaskId}
          workspaceId={activeWorkspaceId}
          projectId={activeProjId}
          projectKey={(allUserTasks.find(t => t.id === activeTaskId) as any)?.projectKey || ''}
          isOpen={!!activeTaskId}
          onClose={() => {
            setActiveTaskId(null);
            setActiveProjId(null);
            queryClient.invalidateQueries({ queryKey: ['my-tasks', activeWorkspaceId] });
          }}
        />
      )}
    </div>
  );
};
export default MyTasksView;
