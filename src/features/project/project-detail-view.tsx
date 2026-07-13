import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../shared/api/client';
import { Project, Task, WorkspaceMember, TaskStatus, TaskPriority, PagedResponse } from '../../types';
import Button from '../../shared/components/button';
import Input from '../../shared/components/input';
import Modal from '../../shared/components/modal';
import Badge from '../../shared/components/badge';
import Avatar from '../../shared/components/avatar';
import { useToast } from '../../shared/components/toast';
import TaskDetailDrawer from '../task/task-detail-drawer';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ListFilter,
  UserCheck
} from 'lucide-react';

const STATUS_COLUMNS: { label: string; value: TaskStatus; bg: string; text: string }[] = [
  { label: 'Todo', value: 'TODO', bg: 'bg-zinc-100', text: 'text-zinc-700' },
  { label: 'In Progress', value: 'IN_PROGRESS', bg: 'bg-indigo-50/50', text: 'text-indigo-700' },
  { label: 'Review', value: 'REVIEW', bg: 'bg-purple-50/50', text: 'text-purple-700' },
  { label: 'Done', value: 'DONE', bg: 'bg-green-50/50', text: 'text-green-700' },
];

export const ProjectDetailView: React.FC = () => {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const activeWorkspaceId = parseInt(workspaceId || '0');
  const activeProjectId = parseInt(projectId || '0');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  
  // Selected task for detail drawer
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  // Drag and drop state
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Task creation state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('MEDIUM');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // 1. Fetch project meta
  const { data: project } = useQuery<Project>({
    queryKey: ['project', activeWorkspaceId, activeProjectId],
    queryFn: () => apiClient.get(`/api/workspaces/${activeWorkspaceId}/projects/${activeProjectId}`).then(res => res.data),
    enabled: !!activeWorkspaceId && !!activeProjectId,
  });

  // 2. Fetch workspace members for assignee listing
  const { data: members = [] } = useQuery<WorkspaceMember[]>({
    queryKey: ['workspace-members', activeWorkspaceId],
    queryFn: () => apiClient.get(`/api/workspaces/${activeWorkspaceId}/members`).then(res => res.data),
    enabled: !!activeWorkspaceId,
  });

  // 3. Fetch tasks (larger page size to render Kanban layout)
  const { data: taskResponse, isLoading: isTasksLoading } = useQuery<PagedResponse<Task>>({
    queryKey: ['tasks', activeWorkspaceId, activeProjectId, search, selectedPriority, selectedAssignee],
    queryFn: () => {
      const params: Record<string, any> = {
        size: 100, // Fetch up to 100 tasks for board display
        search: search.trim() || undefined,
        priority: selectedPriority || undefined,
        assigneeId: selectedAssignee || undefined,
      };
      return apiClient.get(`/api/workspaces/${activeWorkspaceId}/projects/${activeProjectId}/tasks`, { params })
        .then(res => res.data);
    },
    enabled: !!activeWorkspaceId && !!activeProjectId,
  });

  const tasks = taskResponse?.content || [];

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: { title: string; description: string; priority: TaskPriority; assigneeUserId?: number; dueDate?: string }) => 
      apiClient.post<Task>(`/api/workspaces/${activeWorkspaceId}/projects/${activeProjectId}/tasks`, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', activeWorkspaceId, activeProjectId] });
      toast('Task created successfully!', 'success');
      setCreateModalOpen(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskPriority('MEDIUM');
      setNewTaskAssignee('');
      setNewTaskDueDate('');
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Failed to create task', 'error');
    }
  });

  // Update task status mutation (for drag & drop)
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
      return apiClient.put<Task>(
        `/api/workspaces/${activeWorkspaceId}/projects/${activeProjectId}/tasks/${variables.taskId}`,
        payload
      ).then(res => res.data);
    },
    onMutate: async (variables) => {
      // Cancel refetches to prevent overwriting optimistic updates
      await queryClient.cancelQueries({ queryKey: ['tasks', activeWorkspaceId, activeProjectId] });

      // Snapshot the current cache
      const queryKey = ['tasks', activeWorkspaceId, activeProjectId, search, selectedPriority, selectedAssignee];
      const previousTasksResponse = queryClient.getQueryData<PagedResponse<Task>>(queryKey);

      // Optimistically update status
      if (previousTasksResponse) {
        queryClient.setQueryData<PagedResponse<Task>>(queryKey, {
          ...previousTasksResponse,
          content: previousTasksResponse.content.map(t => 
            t.id === variables.taskId ? { ...t, status: variables.status } : t
          )
        });
      }

      return { previousTasksResponse, queryKey };
    },
    onError: (err: any, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousTasksResponse && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousTasksResponse);
      }
      toast(err.response?.data?.message || 'Failed to update task status', 'error');
    },
    onSuccess: () => {
      toast('Task status updated successfully!', 'success');
    },
    onSettled: () => {
      // Refetch after success/error to ensure local state matches server
      queryClient.invalidateQueries({ queryKey: ['tasks', activeWorkspaceId, activeProjectId] });
    }
  });

  // Drag and drop event handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggingTaskId(task.id);
    e.dataTransfer.setData('text/plain', task.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    // Reset only if mouse actually leaves the column container area
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = parseInt(taskIdStr);
    if (isNaN(taskId)) return;

    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (taskToUpdate && taskToUpdate.status !== targetStatus) {
      updateTaskStatusMutation.mutate({ taskId, status: targetStatus, task: taskToUpdate });
    }
    setDraggingTaskId(null);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    createTaskMutation.mutate({
      title: newTaskTitle,
      description: newTaskDesc,
      priority: newTaskPriority,
      assigneeUserId: newTaskAssignee ? parseInt(newTaskAssignee) : undefined,
      dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
    });
  };

  const getPriorityBadgeVariant = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT': return 'danger';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'default';
    }
  };

  return (
    <div className="flex flex-col gap-5 h-full overflow-hidden">
      {/* Title Header */}
      <div className="flex items-center justify-between text-left shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{project?.name || 'Kanban Board'}</h1>
          <p className="text-xs text-zinc-500 mt-1">Manage, sort, and organize task tickets inside Project #{project?.projectKey}</p>
        </div>
        <Button 
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-zinc-200 rounded-lg p-3 shrink-0">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-zinc-200 bg-white text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Priority & Assignee filters */}
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-600">
            <ListFilter className="h-3.5 w-3.5 text-zinc-400" />
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="bg-transparent border-0 outline-none p-0 text-xs text-zinc-700 cursor-pointer font-medium"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-600">
            <UserCheck className="h-3.5 w-3.5 text-zinc-400" />
            <select
              value={selectedAssignee}
              onChange={e => setSelectedAssignee(e.target.value)}
              className="bg-transparent border-0 outline-none p-0 text-xs text-zinc-700 cursor-pointer font-medium max-w-[120px] truncate"
            >
              <option value="">All Assignees</option>
              {members.map(member => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban columns Grid */}
      <div className="flex-1 overflow-x-auto min-h-0 flex gap-4 pb-4">
        {STATUS_COLUMNS.map((col) => {
          const columnTasks = tasks.filter(t => t.status === col.value);
          
          return (
            <div 
              key={col.value}
              onDragOver={(e) => handleDragOver(e, col.value)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.value)}
              className={`flex-1 min-w-[280px] max-w-sm bg-zinc-50 border rounded-lg flex flex-col h-full transition-all duration-200 ${
                dragOverColumn === col.value 
                  ? 'border-indigo-400 bg-indigo-50/15 ring-2 ring-indigo-500/10' 
                  : 'border-zinc-200'
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-white rounded-t-lg">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.value === 'TODO' ? 'bg-zinc-400' : col.value === 'IN_PROGRESS' ? 'bg-indigo-600' : col.value === 'REVIEW' ? 'bg-purple-600' : 'bg-green-600'}`} />
                  <span className="text-xs font-semibold text-zinc-900">{col.label}</span>
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-zinc-100 border border-zinc-200 text-zinc-600">
                    {columnTasks.length}
                  </Badge>
                </div>
              </div>

              {/* Cards wrapper */}
              <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setActiveTaskId(task.id)}
                    className={`p-3 bg-white border rounded-lg shadow-xs transition-all cursor-grab active:cursor-grabbing text-left flex flex-col gap-2 select-none ${
                      draggingTaskId === task.id 
                        ? 'opacity-40 border-dashed border-indigo-300 scale-95 shadow-none' 
                        : 'border-zinc-200 hover:border-zinc-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {project?.projectKey}-{task.taskNumber}
                      </span>
                      <Badge variant={getPriorityBadgeVariant(task.priority)} className="text-[9px] px-1.5 py-0 font-medium">
                        {task.priority}
                      </Badge>
                    </div>

                    <h4 className="text-xs font-semibold text-zinc-900 line-clamp-2">
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-[11px] text-zinc-500 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Card Footer Info */}
                    <div className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-2.5 mt-1 shrink-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        {task.dueDate ? (
                          <span className={new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-red-500 font-semibold' : ''}>
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        ) : (
                          <span>No due date</span>
                        )}
                      </div>

                      {task.assignee ? (
                        <Avatar name={task.assignee.fullName} size="sm" title={`Assignee: ${task.assignee.fullName}`} />
                      ) : (
                        <div 
                          className="w-6 h-6 rounded-full border border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center text-[10px] text-zinc-400"
                          title="Unassigned"
                        >
                          +
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-[11px] text-zinc-400 italic">
                    Drop items here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-out Task Detail Drawer panel */}
      {activeTaskId && (
        <TaskDetailDrawer
          taskId={activeTaskId}
          workspaceId={activeWorkspaceId}
          projectId={activeProjectId}
          projectKey={project?.projectKey || ''}
          isOpen={!!activeTaskId}
          onClose={() => {
            setActiveTaskId(null);
            // Refresh tasks listing
            queryClient.invalidateQueries({ queryKey: ['tasks', activeWorkspaceId, activeProjectId] });
          }}
        />
      )}

      {/* New Task Creation Dialog */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Task"
      >
        <form onSubmit={handleCreateTask} className="flex flex-col gap-4 text-left">
          <Input
            label="Task Title"
            placeholder="Summarize this task..."
            required
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">Description</label>
            <textarea
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
              placeholder="Describe the tasks requirements..."
              value={newTaskDesc}
              onChange={e => setNewTaskDesc(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500">Priority</label>
              <select
                value={newTaskPriority}
                onChange={e => setNewTaskPriority(e.target.value as TaskPriority)}
                className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500">Assignee</label>
              <select
                value={newTaskAssignee}
                onChange={e => setNewTaskAssignee(e.target.value)}
                className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Input
            label="Due Date"
            type="datetime-local"
            value={newTaskDueDate}
            onChange={e => setNewTaskDueDate(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="cursor-pointer"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="cursor-pointer"
              isLoading={createTaskMutation.isPending}
            >
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default ProjectDetailView;
