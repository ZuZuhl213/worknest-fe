import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { getApiErrorMessage } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { Project, PagedResponse, WorkspaceTask, TaskStatus, TaskPriority, Task } from '../../types';
import { useAuth } from '../auth/auth-context';
import { useToast } from '../../shared/components/toast';
import Card, { CardHeader, CardTitle, CardContent } from '../../shared/components/card';
import Badge from '../../shared/components/badge';
import TaskDetailModal from './task-detail-modal';
import EmptyState from '../../shared/components/empty-state';
import ErrorState from '../../shared/components/error-state';
import Input from '../../shared/components/input';
import Select from '../../shared/components/select';
import { CheckSquare, Calendar, ChevronRight, ClipboardList, Search, CheckCircle2, Circle } from 'lucide-react';

type GroupByOption = 'STATUS' | 'PRIORITY' | 'PROJECT';

export const MyTasksView: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const activeWorkspaceId = parseInt(workspaceId || '0', 10);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [activeProjId, setActiveProjId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<GroupByOption>('STATUS');

  // 1. Fetch projects in workspace
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: queryKeys.projects(activeWorkspaceId),
    queryFn: () => apiClient.get(`/api/workspaces/${activeWorkspaceId}/projects`).then((res) => res.data),
    enabled: !!activeWorkspaceId,
  });

  // 2. Fetch tasks assigned to current user across the workspace
  const {
    data: allUserTasks = [],
    isLoading: isTasksLoading,
    isError,
    refetch,
  } = useQuery<WorkspaceTask[]>({
    queryKey: queryKeys.myTasks(activeWorkspaceId, user?.id),
    queryFn: () =>
      apiClient
        .get<PagedResponse<WorkspaceTask>>(`/api/workspaces/${activeWorkspaceId}/tasks`, {
          params: { assigneeId: user?.id, size: 100 },
        })
        .then((res) => res.data.content)
        .catch((error) => {
          toast('Failed to load assigned tasks', 'error');
          throw error;
        }),
    enabled: !!activeWorkspaceId && !!user?.id,
  });

  // Toggle quick task completion mutation
  const toggleTaskStatusMutation = useMutation({
    mutationFn: (task: WorkspaceTask) => {
      const nextStatus: TaskStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
      const payload = {
        title: task.title,
        description: task.description || '',
        status: nextStatus,
        priority: task.priority,
        assigneeUserId: user?.id ?? null,
        dueDate: task.dueDate || null,
      };
      return apiClient
        .put<Task>(`/api/workspaces/${activeWorkspaceId}/projects/${task.projectId}/tasks/${task.id}`, payload)
        .then((res) => res.data);
    },
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.myTasks(activeWorkspaceId, user?.id) });
      const previousTasks = queryClient.getQueryData<WorkspaceTask[]>(queryKeys.myTasks(activeWorkspaceId, user?.id));
      const nextStatus: TaskStatus = task.status === 'DONE' ? 'TODO' : 'DONE';

      if (previousTasks) {
        queryClient.setQueryData<WorkspaceTask[]>(
          queryKeys.myTasks(activeWorkspaceId, user?.id),
          previousTasks.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
        );
      }

      return { previousTasks };
    },
    onError: (err, _task, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.myTasks(activeWorkspaceId, user?.id), context.previousTasks);
      }
      toast(getApiErrorMessage(err, 'Failed to update task status'), 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myTasks(activeWorkspaceId, user?.id) });
    },
  });

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'danger';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'success';
      case 'REVIEW':
        return 'warning';
      case 'IN_PROGRESS':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const isLoading = isProjectsLoading || isTasksLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load assigned tasks"
        message="An error occurred while fetching your assigned work items."
        onRetry={() => refetch()}
      />
    );
  }

  // Filter tasks by search query
  const filteredTasks = allUserTasks.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // Helper renderer for individual task row
  const renderTaskRow = (task: WorkspaceTask) => {
    const isDone = task.status === 'DONE';
    return (
      <div
        key={task.id}
        onClick={() => {
          setActiveTaskId(task.id);
          setActiveProjId(task.projectId);
        }}
        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-zinc-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer gap-2.5"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleTaskStatusMutation.mutate(task);
            }}
            title={isDone ? 'Mark as todo' : 'Mark as done'}
            aria-label={isDone ? 'Mark as todo' : 'Mark as done'}
            className="p-1 rounded text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
          >
            {isDone ? (
              <CheckCircle2 className="h-4.5 w-4.5 text-green-600 dark:text-green-500" aria-hidden="true" />
            ) : (
              <Circle className="h-4.5 w-4.5" aria-hidden="true" />
            )}
          </button>
          <span className="text-[10px] text-zinc-400 dark:text-slate-400 font-mono shrink-0 select-none">
            {task.projectKey}-{task.taskNumber}
          </span>
          <div className="flex flex-col text-left">
            <span
              className={`text-xs font-semibold line-clamp-1 ${
                isDone ? 'text-zinc-500 dark:text-slate-400 line-through' : 'text-zinc-900 dark:text-slate-100'
              }`}
            >
              {task.title}
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-slate-400">Project: {task.projectName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 ml-8 sm:ml-0">
          <Badge variant={getStatusBadgeVariant(task.status)} className="text-[9px] px-2 py-0">
            {task.status.replace('_', ' ')}
          </Badge>
          <Badge variant={getPriorityBadgeVariant(task.priority)} className="text-[9px] px-2 py-0">
            {task.priority}
          </Badge>
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-slate-400 font-medium">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            {isDone
              ? `Completed: ${task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'N/A'}`
              : task.dueDate
              ? new Date(task.dueDate).toLocaleDateString()
              : 'No due date'}
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-slate-600" aria-hidden="true" />
        </div>
      </div>
    );
  };

  // Build task groups based on groupBy state
  const buildGroups = () => {
    if (groupBy === 'STATUS') {
      const statusOrder: { label: string; value: TaskStatus; icon: typeof ClipboardList }[] = [
        { label: 'To Do', value: 'TODO', icon: ClipboardList },
        { label: 'In Progress', value: 'IN_PROGRESS', icon: ClipboardList },
        { label: 'In Review', value: 'REVIEW', icon: ClipboardList },
        { label: 'Done', value: 'DONE', icon: CheckSquare },
      ];
      return statusOrder.map((group) => ({
        key: group.value,
        title: group.label,
        icon: group.icon,
        tasks: filteredTasks.filter((t) => t.status === group.value),
      }));
    }

    if (groupBy === 'PRIORITY') {
      const priorityOrder: { label: string; value: TaskPriority }[] = [
        { label: 'Urgent', value: 'URGENT' },
        { label: 'High', value: 'HIGH' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'Low', value: 'LOW' },
      ];
      return priorityOrder.map((group) => ({
        key: group.value,
        title: group.label,
        icon: ClipboardList,
        tasks: filteredTasks.filter((t) => t.priority === group.value),
      }));
    }

    // PROJECT grouping
    const uniqueProjectNames = Array.from(new Set(allUserTasks.map((t) => t.projectName)));
    // Include any project in list or fallback
    return uniqueProjectNames.map((projName) => ({
      key: projName,
      title: projName,
      icon: ClipboardList,
      tasks: filteredTasks.filter((t) => t.projectName === projName),
    }));
  };

  const groups = buildGroups();

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Title Header & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-slate-100">My Tasks</h1>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1">
            Consolidated overview of tasks assigned to you in workspace #{activeWorkspaceId}
          </p>
        </div>

        {/* Toolbar: Search and Group By */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-slate-500" aria-hidden="true" />
            <Input
              type="text"
              placeholder="Filter tasks by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
              aria-label="Filter tasks"
            />
          </div>

          <div className="w-full sm:w-44">
            <Select
              aria-label="Group by"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
              options={[
                { value: 'STATUS', label: 'Group by Status' },
                { value: 'PRIORITY', label: 'Group by Priority' },
                { value: 'PROJECT', label: 'Group by Project' },
              ]}
              className="text-xs"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {groups.map((group) => {
          const GroupIcon = group.icon;
          return (
            <Card key={group.key}>
              <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-slate-800 p-5">
                <div className="flex items-center gap-2">
                  <GroupIcon className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                  <CardTitle className="text-sm font-semibold text-zinc-950 dark:text-slate-100">
                    {group.title} ({group.tasks.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 text-left">
                <div className="divide-y divide-zinc-200 dark:divide-slate-800">
                  {group.tasks.map(renderTaskRow)}

                  {group.tasks.length === 0 && (
                    <div className="p-4">
                      <EmptyState
                        icon={GroupIcon}
                        title={`No tasks in ${group.title}`}
                        description="Tasks matching this category will appear here."
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Task Drawer overlay view */}
      {activeTaskId && activeProjId && (
        <TaskDetailModal
          taskId={activeTaskId}
          workspaceId={activeWorkspaceId}
          projectId={activeProjId}
          projectKey={allUserTasks.find((t) => t.id === activeTaskId)?.projectKey || ''}
          project={projects.find((project) => project.id === activeProjId)}
          isOpen={!!activeTaskId}
          onClose={() => {
            setActiveTaskId(null);
            setActiveProjId(null);
            queryClient.invalidateQueries({
              queryKey: queryKeys.myTasks(activeWorkspaceId, user?.id),
            });
          }}
        />
      )}
    </div>
  );
};

export default MyTasksView;
