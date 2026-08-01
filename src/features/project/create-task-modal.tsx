import React, { useState } from 'react';
import Modal from '../../shared/components/modal';
import Input from '../../shared/components/input';
import Button from '../../shared/components/button';
import type { WorkspaceMember, TaskPriority } from '../../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceMembers: WorkspaceMember[];
  onCreateTask: (data: {
    title: string;
    description: string;
    priority: TaskPriority;
    assigneeUserId?: number;
    dueDate?: string;
  }) => void;
  isPending: boolean;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  workspaceMembers,
  onCreateTask,
  isPending,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('MEDIUM');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onCreateTask({
      title: newTaskTitle,
      description: newTaskDesc,
      priority: newTaskPriority,
      assigneeUserId: newTaskAssignee ? parseInt(newTaskAssignee, 10) : undefined,
      dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
    });

    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskPriority('MEDIUM');
    setNewTaskAssignee('');
    setNewTaskDueDate('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
        <Input
          label="Task Title"
          placeholder="Summarize this task..."
          required
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-description" className="text-xs font-medium text-zinc-500 dark:text-slate-400">
            Description
          </label>
          <textarea
            id="task-description"
            aria-label="Description"
            className="flex w-full rounded-md border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-slate-100 placeholder:text-zinc-400 dark:placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
            placeholder="Describe the task's requirements..."
            value={newTaskDesc}
            onChange={(e) => setNewTaskDesc(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-priority" className="text-xs font-medium text-zinc-500 dark:text-slate-400">
              Priority
            </label>
            <select
              id="task-priority"
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
              className="flex w-full rounded-md border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-slate-100 dark:[color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-assignee" className="text-xs font-medium text-zinc-500 dark:text-slate-400">
              Assignee
            </label>
            <select
              id="task-assignee"
              value={newTaskAssignee}
              onChange={(e) => setNewTaskAssignee(e.target.value)}
              className="flex w-full rounded-md border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-slate-100 dark:[color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            >
              <option value="">Unassigned</option>
              {workspaceMembers.map((m) => (
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
          className="dark:[color-scheme:dark]"
          value={newTaskDueDate}
          onChange={(e) => setNewTaskDueDate(e.target.value)}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" className="cursor-pointer" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="cursor-pointer" isLoading={isPending}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
