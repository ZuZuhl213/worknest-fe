import React, { useState, useEffect, useRef, useId } from 'react';
import ReactDOM from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { getApiErrorMessage } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import {
  Project,
  Task,
  WorkspaceMember,
  TaskComment,
  TaskStatus,
  TaskPriority,
  Attachment,
  PagedResponse,
} from '../../types';
import Button from '../../shared/components/button';
import { useToast } from '../../shared/components/toast';
import { useAuth } from '../auth/auth-context';
import {
  canAssignTask,
  canCommentOnProject,
  canDeleteTask,
  canEditTask,
} from '../../shared/lib/permissions';
import { X, Edit2, Check, ZoomIn } from 'lucide-react';

import TaskMetaSidebar from './components/task-meta-sidebar';
import TaskSubtasksSection from './components/task-subtasks-section';
import TaskCommentsSection from './components/task-comments-section';
import TaskAttachmentsSection from './components/task-attachments-section';

interface TaskDetailModalProps {
  taskId: number;
  workspaceId: number;
  projectId: number;
  projectKey: string;
  project?: Project;
  isOpen: boolean;
  onClose: () => void;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  LOW: { label: 'Low', color: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  HIGH: { label: 'High', color: 'text-orange-500 dark:text-orange-400', dot: 'bg-orange-500' },
  URGENT: { label: 'Urgent', color: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  TODO: { label: 'To Do', bg: 'bg-zinc-100 dark:bg-slate-800', text: 'text-zinc-700 dark:text-slate-300' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300' },
  REVIEW: { label: 'In Review', bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300' },
  DONE: { label: 'Done', bg: 'bg-green-100 dark:bg-green-950/60', text: 'text-green-700 dark:text-green-300' },
};

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  workspaceId,
  projectId,
  projectKey,
  project,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState('');
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxName, setLightboxName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Restore focus to the element that opened this modal on close
  const triggerRef = useRef<Element | null>(null);

  // Body scroll lock + focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the dialog container on open
    dialogRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      // Restore focus to trigger element
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  // ponytail: subtasks/tags are display-only — backend TaskUpdateRequest has no field for them.
  // Remove add/remove handlers if backend adds support.
  const [tags, setTags] = useState<string[]>([]);

  const { data: task, isLoading } = useQuery<Task>({
    queryKey: queryKeys.task(workspaceId, projectId, taskId),
    queryFn: () =>
      apiClient
        .get(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`)
        .then((r) => r.data),
    enabled: isOpen && !!taskId,
  });

  useEffect(() => {
    if (task) {
      setSubtasks(task.subtasks || []);
      setTags(task.tags || []);
    }
  }, [task]);

  const { data: members = [] } = useQuery<WorkspaceMember[]>({
    queryKey: queryKeys.workspaceMembers(workspaceId),
    queryFn: () =>
      apiClient
        .get<PagedResponse<WorkspaceMember>>(`/api/workspaces/${workspaceId}/members`, {
          params: { size: 100 },
        })
        .then((r) => r.data.content),
    enabled: isOpen,
  });

  const { data: comments = [] } = useQuery<TaskComment[]>({
    queryKey: queryKeys.comments(workspaceId, projectId, taskId),
    queryFn: () =>
      apiClient
        .get<PagedResponse<TaskComment>>(
          `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`,
          { params: { size: 100 } }
        )
        .then((r) => r.data.content),
    enabled: isOpen && !!taskId,
  });

  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey: queryKeys.attachments(taskId),
    queryFn: () =>
      apiClient
        .get<Attachment[]>(
          `/api/tasks/${taskId}/attachments`
        )
        .then((r) => r.data),
    enabled: isOpen && !!taskId,
  });

  const canEditCurrentTask = canEditTask(project, task, user?.id);
  const canComment = canCommentOnProject(project);

  const invalidateBoard = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.tasks(workspaceId, projectId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.task(workspaceId, projectId, taskId),
    });
  };

  const updateTask = useMutation({
    mutationFn: (updates: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeUserId?: number | null;
      dueDate?: string | null;
    }) =>
      apiClient
        .put<Task>(
          `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
          {
            title: updates.title ?? task?.title,
            description: updates.description ?? task?.description,
            status: updates.status ?? task?.status ?? 'TODO',
            priority: updates.priority ?? task?.priority ?? 'MEDIUM',
            assigneeUserId:
              updates.assigneeUserId !== undefined
                ? updates.assigneeUserId
                : task?.assignee?.id ?? null,
            dueDate:
              updates.dueDate !== undefined
                ? updates.dueDate
                : task?.dueDate ?? null,
          }
        )
        .then((r) => r.data),
    onSuccess: () => {
      invalidateBoard();
      toast('Task updated', 'success');
      setIsEditingTitle(false);
      setIsEditingDesc(false);
    },
    onError: (err) => toast(getApiErrorMessage(err, 'Failed to update task'), 'error'),
  });

  const saveTitle = () => {
    if (!editedTitle.trim() || editedTitle === task?.title) {
      setIsEditingTitle(false);
      return;
    }
    updateTask.mutate({ title: editedTitle.trim() });
  };

  const saveDesc = () => {
    updateTask.mutate({ description: editedDesc });
  };

  const deleteTask = useMutation({
    mutationFn: () =>
      apiClient.delete(
        `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`
      ),
    onSuccess: () => {
      invalidateBoard();
      toast('Task deleted', 'success');
      onClose();
    },
    onError: (err) => toast(getApiErrorMessage(err, 'Failed to delete task'), 'error'),
  });

  const createComment = useMutation({
    mutationFn: (content: string) =>
      apiClient
        .post<TaskComment>(
          `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`,
          { content }
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments(workspaceId, projectId, taskId),
      });
      setCommentText('');
      toast('Comment added', 'success');
    },
    onError: (err) => toast(getApiErrorMessage(err, 'Failed to add comment'), 'error'),
  });

  const updateComment = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      apiClient
        .put<TaskComment>(
          `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
          { content }
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments(workspaceId, projectId, taskId),
      });
      setEditingCommentId(null);
      toast('Comment updated', 'success');
    },
    onError: (err) => toast(getApiErrorMessage(err, 'Failed to update comment'), 'error'),
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: number) =>
      apiClient.delete(
        `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments(workspaceId, projectId, taskId),
      });
      toast('Comment deleted', 'success');
    },
    onError: (err) => toast(getApiErrorMessage(err, 'Failed to delete comment'), 'error'),
  });

  const uploadAttachment = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient
        .post<Attachment>(
          `/api/tasks/${taskId}/attachments`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )
        .then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attachments(taskId),
      });
      toast('File uploaded successfully', 'success');
    },
    onError: (err) => toast(getApiErrorMessage(err, 'Failed to upload file'), 'error'),
  });

  const deleteAttachment = useMutation({
    mutationFn: (attachmentId: number) =>
      apiClient.delete(
        `/api/tasks/${taskId}/attachments/${attachmentId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attachments(taskId),
      });
      toast('Attachment deleted', 'success');
    },
    onError: (err) => toast(getApiErrorMessage(err, 'Failed to delete attachment'), 'error'),
  });

  if (!isOpen) return null;

  const statusCfg = STATUS_CONFIG[task?.status ?? 'TODO'];

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="pointer-events-auto relative w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-slate-700 flex flex-col overflow-hidden focus:outline-none"
        style={{ maxWidth: '960px', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-slate-800 bg-zinc-50/60 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <span id={titleId} className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 rounded px-2 py-0.5">
              {projectKey}-{task?.taskNumber}
            </span>
            {task && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}
              >
                {statusCfg.label}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close task detail"
            className="p-1.5 rounded-md text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-200 hover:bg-zinc-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        {isLoading || !task ? (
          <div className="flex flex-1 min-h-0 overflow-hidden animate-pulse p-6">
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-zinc-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-20 bg-zinc-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* LEFT: main content (~65%) */}
            <div
              className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5"
              style={{ flexBasis: '65%' }}
            >
              {/* Title */}
              <div className="group">
                {isEditingTitle ? (
                  <div className="flex items-start gap-2">
                    <input
                      autoFocus
                      aria-label="Edit task title"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTitle();
                        if (e.key === 'Escape') setIsEditingTitle(false);
                      }}
                      className="flex-1 text-lg font-bold text-zinc-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <button
                      onClick={saveTitle}
                      aria-label="Save title"
                      className="p-1.5 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 cursor-pointer"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setIsEditingTitle(false)}
                      aria-label="Cancel title edit"
                      className="p-1.5 text-zinc-400 dark:text-slate-500 hover:text-zinc-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`flex items-start gap-2 rounded-lg p-1 -ml-1 transition-colors ${
                      canEditCurrentTask
                        ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-slate-800/70'
                        : ''
                    }`}
                    onClick={() => {
                      if (!canEditCurrentTask) return;
                      setEditedTitle(task.title);
                      setIsEditingTitle(true);
                    }}
                    {...(canEditCurrentTask && {
                      role: 'button',
                      tabIndex: 0,
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setEditedTitle(task.title);
                          setIsEditingTitle(true);
                        }
                      },
                      'aria-label': 'Edit task title',
                    })}
                  >
                    <h1 className="flex-1 text-xl font-bold text-zinc-900 dark:text-slate-100 leading-snug">
                      {task.title}
                    </h1>
                    {canEditCurrentTask && (
                      <Edit2 className="h-3.5 w-3.5 text-zinc-300 dark:text-slate-400 opacity-0 group-hover:opacity-100 mt-1.5 shrink-0 transition-opacity" />
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <h3 className="text-[10px] font-semibold text-zinc-400 dark:text-slate-400 uppercase tracking-widest">
                  Description
                </h3>
                {isEditingDesc ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      autoFocus
                      aria-label="Edit description"
                      value={editedDesc}
                      onChange={(e) => setEditedDesc(e.target.value)}
                      rows={6}
                      className="w-full text-sm text-zinc-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-800 rounded-lg p-3 placeholder:text-zinc-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                      placeholder="Add a description..."
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditingDesc(false)}
                        className="text-xs cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={saveDesc} className="text-xs cursor-pointer">
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      if (!canEditCurrentTask) return;
                      setEditedDesc(task.description || '');
                      setIsEditingDesc(true);
                    }}
                    className={`text-sm text-zinc-700 dark:text-slate-300 p-3 rounded-lg border border-transparent transition-colors whitespace-pre-wrap ${
                      canEditCurrentTask
                        ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-slate-800/60 hover:border-zinc-200 dark:hover:border-slate-700'
                        : ''
                    }`}
                    {...(canEditCurrentTask && {
                      role: 'button',
                      tabIndex: 0,
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setEditedDesc(task.description || '');
                          setIsEditingDesc(true);
                        }
                      },
                      'aria-label': 'Edit task description',
                    })}
                  >
                    {task.description ? (
                      task.description
                    ) : (
                      <span className="text-zinc-400 dark:text-slate-500 italic">
                        No description provided.
                      </span>
                    )}
                  </div>
                )}
              </div>

              <TaskSubtasksSection
                subtasks={subtasks}
                canEdit={false}
              />

              <TaskAttachmentsSection
                attachments={attachments}
                canEdit={canEditCurrentTask}
                fileInputRef={fileInputRef}
                onFileUpload={(file) => uploadAttachment.mutate(file)}
                onDeleteAttachment={(id) => deleteAttachment.mutate(id)}
                onOpenLightbox={(url, name) => {
                  setLightboxUrl(url);
                  setLightboxName(name);
                }}
                isUploading={uploadAttachment.isPending}
              />

              <TaskCommentsSection
                comments={comments}
                user={user}
                canComment={canComment}
                commentText={commentText}
                setCommentText={setCommentText}
                editingCommentId={editingCommentId}
                editingCommentText={editingCommentText}
                setEditingCommentText={setEditingCommentText}
                setEditingCommentId={setEditingCommentId}
                onCreateComment={(content) => createComment.mutate(content)}
                onUpdateComment={(id, content) => updateComment.mutate({ commentId: id, content })}
                onDeleteComment={(id) => deleteComment.mutate(id)}
                isSubmittingComment={createComment.isPending}
              />
            </div>

            {/* RIGHT: sidebar metadata (~35%) */}
            <div className="w-72 shrink-0 flex flex-col" style={{ flexBasis: '35%' }}>
              <TaskMetaSidebar
                task={task}
                user={user}
                project={project}
                members={members}
                statusConfig={STATUS_CONFIG}
                priorityConfig={PRIORITY_CONFIG}
                tags={tags}
                onUpdateStatus={(status) => updateTask.mutate({ status })}
                onUpdatePriority={(priority) => updateTask.mutate({ priority })}
                onUpdateAssignee={(assigneeUserId) => updateTask.mutate({ assigneeUserId })}
                onUpdateDueDate={(dueDate) => updateTask.mutate({ dueDate })}
                onDeleteTask={() => {
                  if (confirm(`Delete task "${task.title}"?`)) deleteTask.mutate();
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal for Images */}
      {lightboxUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxUrl(null)}
          onKeyDown={(e) => { if (e.key === 'Escape') setLightboxUrl(null); }}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={-1}
          ref={(el) => { if (el && lightboxUrl) el.focus(); }}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxUrl}
              alt={lightboxName}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setLightboxUrl(null)}
              aria-label="Close image preview"
              className="absolute -top-3 -right-3 bg-white text-zinc-900 rounded-full p-1.5 shadow-lg hover:bg-zinc-200 cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default TaskDetailModal;
