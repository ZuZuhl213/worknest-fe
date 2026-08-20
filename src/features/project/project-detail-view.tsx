import React from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Button from '../../shared/components/button';
import TaskDetailModal from '../task/task-detail-modal';
import useProjectBoard from './use-project-board';
import ProjectMembersPanel from './project-members-panel';
import CreateTaskModal from './create-task-modal';
import TaskBoard from './task-board';
import EmptyState from '../../shared/components/empty-state';
import ErrorState from '../../shared/components/error-state';
import Skeleton from '../../shared/components/skeleton';
import { queryKeys } from '../../shared/api/query-keys';
import { Plus, Search, ListFilter, UserCheck, Users, FolderKanban } from 'lucide-react';

export const ProjectDetailView: React.FC = () => {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const activeWorkspaceId = parseInt(workspaceId || '0', 10);
  const activeProjectId = parseInt(projectId || '0', 10);

  const queryClient = useQueryClient();

  const {
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
  } = useProjectBoard(activeWorkspaceId, activeProjectId);

  return (
    <div className="flex flex-col gap-5 h-full overflow-hidden">
      {/* Title Header */}
      <div className="flex items-center justify-between text-left shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-slate-100">{project?.name || 'Kanban Board'}</h1>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1">
            Manage, sort, and organize task tickets inside Project #{project?.projectKey}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setMembersModalOpen(true)}
            variant="outline"
            className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            Project Members
          </Button>
          {canCreateProjectTask && (
            <Button
              onClick={() => {
                setCreateModalInitialStatus('TODO');
                setCreateModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-lg p-3 shrink-0">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-slate-500" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search tasks..."
            aria-label="Search tasks in board"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-zinc-900 dark:text-slate-100 text-xs placeholder:text-zinc-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Priority & Assignee filters */}
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs text-zinc-600 dark:text-slate-300">
            <ListFilter className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
            <select
              value={selectedPriority}
              aria-label="Filter tasks by priority"
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 p-0 text-xs text-zinc-700 dark:text-slate-200 dark:[color-scheme:dark] cursor-pointer font-medium"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs text-zinc-600 dark:text-slate-300">
            <UserCheck className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
            <select
              value={selectedAssignee}
              aria-label="Filter tasks by assignee"
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 p-0 text-xs text-zinc-700 dark:text-slate-200 dark:[color-scheme:dark] cursor-pointer font-medium max-w-[120px] truncate"
            >
              <option value="">All Assignees</option>
              {members.map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Board content or Empty/Loading state */}
      {isTasksLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
          {[1, 2, 3, 4].map((col) => (
            <div key={col} className="flex flex-col gap-3 p-3 rounded-xl bg-zinc-50/50 dark:bg-slate-900/50 border border-zinc-200/60 dark:border-slate-800/60">
              <div className="flex justify-between items-center pb-2">
                <Skeleton className="w-24 h-5" />
                <Skeleton className="w-6 h-5 rounded-full" />
              </div>
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 && (search || selectedPriority || selectedAssignee) ? (
        <EmptyState
          icon={FolderKanban}
          title="No tasks match your filters"
          description="Try resetting your search query or clearing the priority and assignee filters."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setSelectedPriority('');
            setSelectedAssignee('');
          }}
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No tasks in this project yet"
          description="Get started by creating the first task for your team."
          actionLabel={canCreateProjectTask ? 'Create Task' : undefined}
          onAction={canCreateProjectTask ? () => {
            setCreateModalInitialStatus('TODO');
            setCreateModalOpen(true);
          } : undefined}
        />
      ) : (
        <TaskBoard
          project={project}
          tasks={tasks}
          currentUser={user}
          draggingTaskId={draggingTaskId}
          dragOverColumn={dragOverColumn}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onTaskClick={(id) => setActiveTaskId(id)}
          onStatusChange={(taskId, status, task) =>
            updateTaskStatusMutation.mutate({ taskId, status, task })
          }
          onAddTask={(status) => {
            setCreateModalInitialStatus(status);
            setCreateModalOpen(true);
          }}
        />
      )}

      {/* Slide-out Task Detail Drawer panel */}
      {activeTaskId && (
        <TaskDetailModal
          taskId={activeTaskId}
          workspaceId={activeWorkspaceId}
          projectId={activeProjectId}
          projectKey={project?.projectKey || ''}
          project={project}
          isOpen={!!activeTaskId}
          onClose={() => {
            setActiveTaskId(null);
            queryClient.invalidateQueries({
              queryKey: queryKeys.tasks(activeWorkspaceId, activeProjectId),
            });
          }}
        />
      )}

      {/* Task Creation Dialog */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        workspaceMembers={members}
        initialStatus={createModalInitialStatus}
        onCreateTask={(data) => createTaskMutation.mutate(data)}
        isPending={createTaskMutation.isPending}
      />

      {/* Project Members Dialog */}
      <ProjectMembersPanel
        isOpen={membersModalOpen}
        onClose={() => setMembersModalOpen(false)}
        canManageMembers={canManageProjectMembers}
        currentUser={user}
        workspaceMembers={members}
        projectMembers={projectMembers}
        onAddMember={(data) => addProjectMemberMutation.mutate(data)}
        onUpdateRole={(data) => updateProjectRoleMutation.mutate(data)}
        onRemoveMember={(id) => removeProjectMemberMutation.mutate(id)}
        isAddPending={addProjectMemberMutation.isPending}
      />
    </div>
  );
};

export default ProjectDetailView;
