import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { getApiErrorMessage } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { useToast } from '../../shared/components/toast';
import { useAuth } from '../auth/auth-context';
import { canCreateTask, canManageProjectMembers as canManageProjectMembersForProject, canEditTask } from '../../shared/lib/permissions';
import type {
  Project,
  Task,
  WorkspaceMember,
  TaskStatus,
  TaskPriority,
  PagedResponse,
  ProjectMember,
  ProjectRole,
} from '../../types';

export function useProjectBoard(activeWorkspaceId: number, activeProjectId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');

  // Selected task detail modal
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  // Drag and drop state
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalInitialStatus, setCreateModalInitialStatus] = useState<TaskStatus | undefined>(undefined);
  const [membersModalOpen, setMembersModalOpen] = useState(false);

  // 1. Fetch project meta
  const { data: project } = useQuery<Project>({
    queryKey: queryKeys.project(activeWorkspaceId, activeProjectId),
    queryFn: () =>
      apiClient
        .get(`/api/workspaces/${activeWorkspaceId}/projects/${activeProjectId}`)
        .then((res) => res.data),
    enabled: !!activeWorkspaceId && !!activeProjectId,
  });

  // 2. Fetch workspace members for assignee listing
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

  // 3. Fetch tasks
  const filterObj = {
    search: search.trim() || undefined,
    priority: selectedPriority || undefined,
    assigneeId: selectedAssignee || undefined,
  };

  const { data: taskResponse, isLoading: isTasksLoading } = useQuery<PagedResponse<Task>>({
    queryKey: queryKeys.tasks(activeWorkspaceId, activeProjectId, filterObj),
    queryFn: () => {
      const params: {
        size: number;
        search?: string;
        priority?: string;
        assigneeId?: string;
      } = {
        size: 100,
        search: search.trim() || undefined,
        priority: selectedPriority || undefined,
        assigneeId: selectedAssignee || undefined,
      };
      return apiClient
        .get(`/api/workspaces/${activeWorkspaceId}/projects/${activeProjectId}/tasks`, { params })
        .then((res) => res.data);
    },
    enabled: !!activeWorkspaceId && !!activeProjectId,
  });

  const tasks = taskResponse?.content || [];

  // 4. Fetch project members
  const { data: projectMembers = [] } = useQuery<ProjectMember[]>({
    queryKey: queryKeys.projectMembers(activeWorkspaceId, activeProjectId),
    queryFn: () =>
      apiClient
        .get<PagedResponse<ProjectMember>>(
          `/api/workspaces/${activeWorkspaceId}/projects/${activeProjectId}/members`,
          { params: { size: 100 } }
        )
        .then((res) => res.data.content),
    enabled: !!activeWorkspaceId && !!activeProjectId,
  });

  const canCreateProjectTask = canCreateTask(project);
  const canManageProjectMembers = canManageProjectMembersForProject(project);

  // Add project member mutation
  const addProjectMemberMutation = useMutation({
    mutationFn: (data: { email: string; role: ProjectRole }) =>
      apiClient
        .post<ProjectMember>(
          `/api/workspaces/${activeWorkspaceId}/projects/${activeProjectId}/members`,
          data
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectMembers(activeWorkspaceId, activeProjectId),
      });
      toast('Member added to project successfully!', 'success');
    },
    onError: (error: unknown) => {
      toast(getApiErrorMessage(error, 'Failed to add member to project'), 'error');
    },
  });

  // Update project member role mutation
  const updateProjectRoleMutation = useMutation({
    mutationFn: (data: { memberId: number; role: ProjectRole }) =>
      apiClient
        .patch<ProjectMember>(
          `/api/workspaces/${activeWorkspaceId}/projects/${activeProjectId}/members/${data.memberId}/role`,
          { role: data.role }
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectMembers(activeWorkspaceId, activeProjectId),
      });
      toast('Project member role updated!', 'success');
    },
    onError: (error: unknown) => {
      toast(getApiErrorMessage(error, 'Failed to update project role'), 'error');
    },
  });

  // Remove project member mutation
  const removeProjectMemberMutation = useMutation({
    mutationFn: (memberId: number) =>
      apiClient.delete(
        `/api/workspaces/${activeWorkspaceId}/projects/${activeProjectId}/members/${memberId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectMembers(activeWorkspaceId, activeProjectId),
      });
      toast('Member removed from project', 'success');
    },
    onError: (error: unknown) => {
      toast(getApiErrorMessage(error, 'Failed to remove member from project'), 'error');
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      priority: TaskPriority;
      status: TaskStatus;
      assigneeUserId?: number;
      dueDate?: string;
    }) =>
      apiClient
        .post<Task>(
          `/api/workspaces/${activeWorkspaceId}/projects/${activeProjectId}/tasks`,
          data
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks(activeWorkspaceId, activeProjectId),
      });
      toast('Task created successfully!', 'success');
      setCreateModalOpen(false);
    },
    onError: (error: unknown) => {
      toast(getApiErrorMessage(error, 'Failed to create task'), 'error');
    },
  });

  // Update task status mutation with optimistic update & rollback
  const updateTaskStatusMutation = useMutation({
    mutationFn: (variables: { taskId: number; status: TaskStatus; task: Task }) => {
      const payload = {
        title: variables.task.title,
        description: variables.task.description || '',
        status: variables.status,
        priority: variables.task.priority,
        assigneeUserId: variables.task.assignee?.id || null,
        dueDate: variables.task.dueDate || null,
      };
      return apiClient
        .put<Task>(
          `/api/workspaces/${activeWorkspaceId}/projects/${activeProjectId}/tasks/${variables.taskId}`,
          payload
        )
        .then((res) => res.data);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.tasks(activeWorkspaceId, activeProjectId),
      });

      const currentQueryKey = queryKeys.tasks(activeWorkspaceId, activeProjectId, filterObj);
      const previousTasksResponse =
        queryClient.getQueryData<PagedResponse<Task>>(currentQueryKey);

      if (previousTasksResponse) {
        queryClient.setQueryData<PagedResponse<Task>>(currentQueryKey, {
          ...previousTasksResponse,
          content: previousTasksResponse.content.map((t) =>
            t.id === variables.taskId ? { ...t, status: variables.status } : t
          ),
        });
      }

      return { previousTasksResponse, currentQueryKey };
    },
    onError: (error: unknown, _variables, context) => {
      if (context?.previousTasksResponse && context?.currentQueryKey) {
        queryClient.setQueryData(context.currentQueryKey, context.previousTasksResponse);
      }
      toast(getApiErrorMessage(error, 'Failed to update task status'), 'error');
    },
    onSuccess: () => {
      toast('Task status updated successfully!', 'success');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks(activeWorkspaceId, activeProjectId),
      });
    },
  });

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (!canEditTask(project, task, user?.id)) {
      e.preventDefault();
      return;
    }
    setDraggingTaskId(task.id);
    e.dataTransfer.setData('text/plain', task.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    const task = tasks.find((t) => t.id === draggingTaskId);
    if (!canEditTask(project, task, user?.id)) return;
    e.preventDefault();
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = parseInt(taskIdStr, 10);
    if (isNaN(taskId)) return;

    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (!canEditTask(project, taskToUpdate, user?.id)) return;
    if (taskToUpdate && taskToUpdate.status !== targetStatus) {
      updateTaskStatusMutation.mutate({ taskId, status: targetStatus, task: taskToUpdate });
    }
    setDraggingTaskId(null);
  };

  return {
    user,
    project,
    members,
    tasks,
    projectMembers,
    isTasksLoading,
    canCreateProjectTask,
    canManageProjectMembers,
    search,
    setSearch,
    selectedPriority,
    setSelectedPriority,
    selectedAssignee,
    setSelectedAssignee,
    activeTaskId,
    setActiveTaskId,
    draggingTaskId,
    dragOverColumn,
    createModalOpen,
    setCreateModalOpen,
    createModalInitialStatus,
    setCreateModalInitialStatus,
    membersModalOpen,
    setMembersModalOpen,
    addProjectMemberMutation,
    updateProjectRoleMutation,
    removeProjectMemberMutation,
    createTaskMutation,
    updateTaskStatusMutation,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}

export default useProjectBoard;
