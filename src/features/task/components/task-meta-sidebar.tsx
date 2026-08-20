import React from 'react';
import Avatar from '../../../shared/components/avatar';
import Button from '../../../shared/components/button';
import { TaskStatus, TaskPriority, WorkspaceMember, Task, Project, CurrentUser } from '../../../types';
import { canEditTask, canAssignTask, canDeleteTask } from '../../../shared/lib/permissions';
import { Clock, User, Flag, Tag, Trash2, Calendar } from 'lucide-react';

interface TaskMetaSidebarProps {
  task: Task | undefined;
  user: CurrentUser | null;
  project: Project | undefined;
  members: WorkspaceMember[];
  statusConfig: Record<string, { label: string; bg: string; text: string }>;
  priorityConfig: Record<string, { label: string; color: string; dot: string }>;
  tags: string[];
  // ponytail: newTagText/setNewTagText/onAddTag/onRemoveTag removed — backend has no tags persist endpoint
  onUpdateStatus: (status: TaskStatus) => void;
  onUpdatePriority: (priority: TaskPriority) => void;
  onUpdateAssignee: (assigneeId: number | null) => void;
  onUpdateDueDate: (dueDate: string | null) => void;
  onDeleteTask: () => void;
}

export const TaskMetaSidebar: React.FC<TaskMetaSidebarProps> = ({
  task,
  user,
  project,
  members,
  statusConfig,
  priorityConfig,
  tags,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateAssignee,
  onUpdateDueDate,
  onDeleteTask,
}) => {
  const canEdit = canEditTask(project, task, user?.id);
  const canAssign = canAssignTask(project);
  const canDelete = canDeleteTask(project, task, user?.id);

  const statusCfg = statusConfig[task?.status ?? 'TODO'];

  return (
    <div className="flex flex-col gap-5 p-5 bg-zinc-50/50 dark:bg-slate-900/50 border-l border-zinc-200 dark:border-slate-800">
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-semibold text-zinc-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Status
        </label>
        {canEdit ? (
          <select
            value={task?.status ?? 'TODO'}
            onChange={(e) => onUpdateStatus(e.target.value as TaskStatus)}
            className={`w-full text-xs font-semibold px-3 py-2 rounded-lg border-0 ${statusCfg.bg} ${statusCfg.text} focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer`}
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>
        ) : (
          <span className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg ${statusCfg.bg} ${statusCfg.text}`}>
            {statusCfg.label}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-semibold text-zinc-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" /> Assignee
        </label>
        {canAssign ? (
          <div className="flex items-center gap-2">
            <Avatar name={task?.assignee?.fullName || '?'} size="sm" />
            <select
              value={task?.assignee?.id ?? ''}
              onChange={(e) => onUpdateAssignee(e.target.value ? Number(e.target.value) : null)}
              className="flex-1 text-xs font-medium text-zinc-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.fullName}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Avatar name={task?.assignee?.fullName || '?'} size="sm" />
            <span className="text-xs font-medium text-zinc-800 dark:text-slate-200">
              {task?.assignee?.fullName || 'Unassigned'}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-semibold text-zinc-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Flag className="h-3.5 w-3.5" /> Priority
        </label>
        {canEdit ? (
          <select
            value={task?.priority ?? 'MEDIUM'}
            onChange={(e) => onUpdatePriority(e.target.value as TaskPriority)}
            className="w-full text-xs font-medium text-zinc-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        ) : (
          <span className={`text-xs font-semibold ${priorityConfig[task?.priority ?? 'MEDIUM']?.color}`}>
            {priorityConfig[task?.priority ?? 'MEDIUM']?.label}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-semibold text-zinc-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" /> Due Date
        </label>
        {canEdit ? (
            <input
              type="date"
              aria-label="Due date"
              value={task?.dueDate ? task.dueDate.split('T')[0] : ''}
            onChange={(e) => onUpdateDueDate(e.target.value || null)}
            className="w-full text-xs font-medium text-zinc-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
          />
        ) : (
          <span className="text-xs text-zinc-700 dark:text-slate-300 font-medium">
            {task?.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-semibold text-zinc-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5" /> Tags
        </label>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center text-[10px] font-medium bg-zinc-100 dark:bg-slate-800 text-zinc-700 dark:text-slate-300 px-2 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-zinc-400 dark:text-slate-500 italic">No tags</span>
        )}
      </div>

      {canDelete && (
        <div className="pt-4 border-t border-zinc-200 dark:border-slate-800 mt-auto">
          <Button
            variant="danger"
            size="sm"
            onClick={onDeleteTask}
            className="w-full flex items-center justify-center gap-1.5 cursor-pointer text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Task
          </Button>
        </div>
      )}
    </div>
  );
};

export default TaskMetaSidebar;
