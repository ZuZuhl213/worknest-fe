import React from 'react';
import { CheckSquare } from 'lucide-react';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskSubtasksSectionProps {
  subtasks: Subtask[];
  // ponytail: canEdit kept for future backend support; currently always false (no persist endpoint)
  canEdit: boolean;
}

export const TaskSubtasksSection: React.FC<TaskSubtasksSectionProps> = ({ subtasks }) => {
  const completedCount = subtasks.filter((s) => s.completed).length;

  if (subtasks.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold text-zinc-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <CheckSquare className="h-3.5 w-3.5" /> Checklist (
          {`${completedCount}/${subtasks.length}`})
        </h3>
      </div>

      <div className="w-full bg-zinc-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-indigo-600 dark:bg-indigo-500 h-1.5 transition-all duration-300 rounded-full"
          style={{ width: `${(completedCount / subtasks.length) * 100}%` }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        {subtasks.map((st) => (
          <div
            key={st.id}
            className="flex items-center p-1.5 rounded-lg"
          >
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-slate-300 flex-1 select-none">
              <input
                type="checkbox"
                aria-label={`Subtask ${st.title}`}
                checked={st.completed}
                readOnly
                disabled
                className="rounded border-zinc-300 dark:border-slate-700 text-indigo-600"
              />
              <span className={st.completed ? 'line-through text-zinc-400 dark:text-slate-500' : ''}>
                {st.title}
              </span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskSubtasksSection;
