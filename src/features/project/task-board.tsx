import React from 'react';
import Badge from '../../shared/components/badge';
import Avatar from '../../shared/components/avatar';
import { canEditTask } from '../../shared/lib/permissions';
import { Clock, CheckSquare } from 'lucide-react';
import type { Project, Task, TaskStatus, TaskPriority, CurrentUser } from '../../types';

const STATUS_COLUMNS: { label: string; value: TaskStatus; bg: string; text: string }[] = [
  { label: 'Todo', value: 'TODO', bg: 'bg-zinc-100', text: 'text-zinc-700' },
  { label: 'In Progress', value: 'IN_PROGRESS', bg: 'bg-indigo-50/50', text: 'text-indigo-700' },
  { label: 'Review', value: 'REVIEW', bg: 'bg-purple-50/50', text: 'text-purple-700' },
  { label: 'Done', value: 'DONE', bg: 'bg-green-50/50', text: 'text-green-700' },
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
}) => {
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
    }
  };

  return (
    <div className="flex-1 overflow-x-auto min-h-0 flex gap-4 pb-4 text-left">
      {STATUS_COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.value);
        const draggingTask = tasks.find((t) => t.id === draggingTaskId);
        const canDropDraggingTask = canEditTask(project, draggingTask, currentUser?.id);

        return (
          <div
            key={col.value}
            onDragOver={canDropDraggingTask ? (e) => onDragOver(e, col.value) : undefined}
            onDragLeave={onDragLeave}
            onDrop={canDropDraggingTask ? (e) => onDrop(e, col.value) : undefined}
            className={`flex-1 min-w-[280px] max-w-sm bg-zinc-50 border rounded-lg flex flex-col h-full transition-all duration-200 ${
              dragOverColumn === col.value
                ? 'border-indigo-400 bg-indigo-50/15 ring-2 ring-indigo-500/10'
                : 'border-zinc-200'
            }`}
          >
            {/* Column Header */}
            <div className="p-3.5 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-white rounded-t-lg">
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
                <span className="text-xs font-semibold text-zinc-900">{col.label}</span>
                <Badge
                  variant="default"
                  className="text-[10px] px-1.5 py-0 bg-zinc-100 border border-zinc-200 text-zinc-600"
                >
                  {columnTasks.length}
                </Badge>
              </div>
            </div>

            {/* Cards wrapper */}
            <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5">
              {columnTasks.map((task) => {
                const canDragTask = canEditTask(project, task, currentUser?.id);
                return (
                  <div
                    key={task.id}
                    draggable={canDragTask}
                    onDragStart={canDragTask ? (e) => onDragStart(e, task) : undefined}
                    onDragEnd={canDragTask ? onDragEnd : undefined}
                    onClick={() => onTaskClick(task.id)}
                    className={`p-3 bg-white border rounded-lg shadow-xs transition-all text-left flex flex-col gap-2 select-none ${
                      canDragTask ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                    } ${
                      draggingTaskId === task.id
                        ? 'opacity-40 border-dashed border-indigo-300 scale-95 shadow-none'
                        : 'border-zinc-200 hover:border-zinc-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {project?.projectKey}-{task.taskNumber}
                      </span>
                      <Badge
                        variant={getPriorityBadgeVariant(task.priority)}
                        className="text-[9px] px-1.5 py-0 font-medium"
                      >
                        {task.priority}
                      </Badge>
                    </div>

                    <h4 className="text-xs font-semibold text-zinc-900 line-clamp-2">
                      {task.title}
                    </h4>

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map((tag) => {
                          const lower = tag.toLowerCase();
                          const badgeColor =
                            lower === 'bug' ? 'bg-red-50 text-red-700 border-red-200' :
                            lower === 'feature' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            lower === 'frontend' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            lower === 'backend' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-zinc-100 text-zinc-700 border-zinc-200';
                          return (
                            <span key={tag} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {task.description && (
                      <p className="text-[11px] text-zinc-500 line-clamp-2">{task.description}</p>
                    )}

                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                        <CheckSquare className="h-3 w-3 text-indigo-600" aria-hidden="true" />
                        <span>{task.subtasks.filter((s) => s.completed).length} / {task.subtasks.length} subtasks</span>
                      </div>
                    )}

                    {/* Card Footer Info */}
                    <div className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-2.5 mt-1 shrink-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
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
                            className="text-[10px] rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 text-zinc-600 focus:outline-none cursor-pointer"
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
                            className="w-6 h-6 rounded-full border border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center text-[10px] text-zinc-400"
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
                <div className="text-center py-8 text-[11px] text-zinc-400 italic">
                  No tasks in {col.label}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskBoard;
