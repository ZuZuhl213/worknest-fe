import React from 'react';
import Badge from '../../shared/components/badge';
import Avatar from '../../shared/components/avatar';
import { canEditTask, canCreateTask } from '../../shared/lib/permissions';
import { Clock, CheckSquare, Plus } from 'lucide-react';
import type { Project, Task, TaskStatus, TaskPriority, CurrentUser } from '../../types';

const STATUS_COLUMNS: { label: string; value: TaskStatus; bg: string; text: string }[] = [
  { label: 'Todo', value: 'TODO', bg: 'bg-zinc-100 dark:bg-slate-800', text: 'text-zinc-700 dark:text-slate-300' },
  { label: 'In Progress', value: 'IN_PROGRESS', bg: 'bg-indigo-50/50 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-300' },
  { label: 'Review', value: 'REVIEW', bg: 'bg-purple-50/50 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-300' },
  { label: 'Done', value: 'DONE', bg: 'bg-green-50/50 dark:bg-green-950/50', text: 'text-green-700 dark:text-green-300' },
];

interface TaskBoardProps {
  project?: Project;
  tasks: Task[];
  currentUser: CurrentUser | null;
  draggingTaskId: number | null;
  dragOverColumn: TaskStatus | null;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, status: TaskStatus) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  onTaskClick: (taskId: number) => void;
  onStatusChange: (taskId: number, status: TaskStatus, task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  project,
  tasks,
  currentUser,
  draggingTaskId,
  dragOverColumn,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onTaskClick,
  onStatusChange,
  onAddTask,
}) => {
  const canAddTask = canCreateTask(project);
  const draggingTask = tasks.find((task) => task.id === draggingTaskId);
  const tasksByStatus = tasks.reduce<Partial<Record<TaskStatus, Task[]>>>((grouped, task) => {
    (grouped[task.status] ??= []).push(task);
    return grouped;
  }, {});
  const getPriorityBadgeVariant = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'danger';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex-1 overflow-x-auto min-h-0 flex gap-4 pb-4 text-left">
      {STATUS_COLUMNS.map((col) => {
        const columnTasks = tasksByStatus[col.value] ?? [];
        const canDropDraggingTask = canEditTask(project, draggingTask, currentUser?.id);

        return (
          <div
            key={col.value}
            onDragOver={canDropDraggingTask ? (e) => onDragOver(e, col.value) : undefined}
            onDragLeave={onDragLeave}
            onDrop={canDropDraggingTask ? (e) => onDrop(e, col.value) : undefined}
            className={`flex-1 min-w-[280px] max-w-sm bg-zinc-50 dark:bg-slate-900/70 border rounded-lg flex flex-col h-full transition-all duration-200 ${
              dragOverColumn === col.value
                ? 'border-indigo-400 bg-indigo-50/15 dark:bg-indigo-950/30 ring-2 ring-indigo-500/10'
                : 'border-zinc-200 dark:border-slate-800'
            }`}
          >
            {/* Column Header */}
            <div className="p-3.5 border-b border-zinc-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900 rounded-t-lg">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    col.value === 'TODO'
                      ? 'bg-zinc-400'
                      : col.value === 'IN_PROGRESS'
                      ? 'bg-indigo-600'
                      : col.value === 'REVIEW'
                      ? 'bg-purple-600'
                      : 'bg-green-600'
                  }`}
                />
                <span className="text-xs font-semibold text-zinc-900 dark:text-slate-100">{col.label}</span>
                <Badge
                  variant="default"
                  className="text-[10px] px-1.5 py-0 bg-zinc-100 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-600 dark:text-slate-300"
                >
                  {columnTasks.length}
                </Badge>
              </div>
            </div>

            {/* Cards wrapper */}
            <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5">
              {columnTasks.map((task) => {
                const canDragTask = canEditTask(project, task, currentUser?.id);
                const completedSubtaskCount = task.subtasks?.filter((subtask) => subtask.completed).length ?? 0;
                return (
                  <div
                    key={task.id}
                    draggable={canDragTask}
                    onDragStart={canDragTask ? (e) => onDragStart(e, task) : undefined}
                    onDragEnd={canDragTask ? onDragEnd : undefined}
                    onClick={() => onTaskClick(task.id)}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
                      event.preventDefault();
                      onTaskClick(task.id);
                    }}
                    role="button"
                    tabIndex={0}
                    className={`p-3 bg-white dark:bg-slate-900 border rounded-lg shadow-xs transition-all duration-150 text-left flex flex-col gap-2 select-none ${
                      canDragTask ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                    } ${
                      draggingTaskId === task.id
                        ? 'opacity-60 dark:opacity-70 border-dashed border-indigo-300 dark:border-indigo-500 scale-95 shadow-none'
                        : 'border-zinc-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/60 hover:-translate-y-0.5 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-mono font-medium">
                        {project?.projectKey}-{task.taskNumber}
                      </span>
                      <Badge
                        variant={getPriorityBadgeVariant(task.priority)}
                        className="text-[9px] px-1.5 py-0 font-medium uppercase tracking-wider"
                      >
                        {task.priority}
                      </Badge>
                    </div>

                    <h4 className="text-sm font-medium text-zinc-900 dark:text-slate-100 leading-snug line-clamp-2">
                      {task.title}
                    </h4>

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map((tag) => {
                          const lower = tag.toLowerCase();
                          const badgeColor =
                            lower === 'bug' ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900' :
                            lower === 'feature' ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900' :
                            lower === 'frontend' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900' :
                            lower === 'backend' ? 'bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900' :
                            'bg-zinc-100 dark:bg-slate-800 text-zinc-700 dark:text-slate-300 border-zinc-200 dark:border-slate-700';

                          return (
                            <span key={tag} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {task.description && (
                      <p className="text-[11px] text-zinc-500 dark:text-slate-400 line-clamp-2 leading-relaxed mt-0.5">{task.description}</p>
                    )}

                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-slate-400 font-medium">
                          <div className="flex items-center gap-1.5">
                            <CheckSquare className="h-3.5 w-3.5 text-zinc-400 dark:text-slate-500" aria-hidden="true" />
                            <span>Subtasks</span>
                          </div>
                          <span>{completedSubtaskCount}/{task.subtasks.length}</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${(completedSubtaskCount / task.subtasks.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Card Footer Info */}
                    <div className="flex items-center justify-between gap-2 pt-1 mt-2 shrink-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-slate-400">
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {task.dueDate ? (
                          <span
                            className={
                              new Date(task.dueDate) < new Date() && task.status !== 'DONE'
                                ? 'text-red-500 font-semibold'
                                : ''
                            }
                          >
                            {new Date(task.dueDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span>No due date</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {/* Keyboard & touch fallback select for D2.4 */}
                        {canDragTask && (
                          <select
                            aria-label={`Status for task ${task.title}`}
                            value={task.status}
                            onChange={(e) =>
                              onStatusChange(task.id, e.target.value as TaskStatus, task)
                            }
                            className="text-[10px] rounded border border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-slate-800 px-1 py-0.5 text-zinc-600 dark:text-slate-300 dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                          >
                            <option value="TODO">Todo</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="REVIEW">Review</option>
                            <option value="DONE">Done</option>
                          </select>
                        )}

                        {task.assignee ? (
                          <Avatar
                            name={task.assignee.fullName}
                            size="sm"
                            title={`Assignee: ${task.assignee.fullName}`}
                          />
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full border border-dashed border-zinc-300 dark:border-slate-600 bg-zinc-50 dark:bg-slate-800 flex items-center justify-center text-[10px] text-zinc-400 dark:text-slate-400"
                            title="Unassigned"
                          >
                            +
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {columnTasks.length === 0 && (
                <div className="text-center py-8 text-[11px] text-zinc-400 dark:text-slate-400 italic">
                  No tasks in {col.label}
                </div>
              )}
            </div>

            {/* Quick Add Task Button at bottom of column */}
            {canAddTask && onAddTask && (
              <div className="p-2 border-t border-zinc-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => onAddTask(col.value)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-100 hover:bg-zinc-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Add Task</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TaskBoard;
