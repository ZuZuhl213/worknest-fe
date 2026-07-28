import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { getApiErrorMessage } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { Project, Task, WorkspaceMember, TaskComment, TaskStatus, TaskPriority, Attachment, PagedResponse } from '../../types';
import Button from '../../shared/components/button';
import Avatar from '../../shared/components/avatar';
import { useToast } from '../../shared/components/toast';
import { useAuth } from '../auth/auth-context';
import {
  canAssignTask,
  canCommentOnProject,
  canDeleteTask,
  canEditTask,
} from '../../shared/lib/permissions';
import {
  X, Edit2, Check, Paperclip, Download, Send,
  MessageSquare, Calendar, ZoomIn, FileText,
  Trash2, Clock, Flag, User, Plus, Tag, CheckSquare,
} from 'lucide-react';

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
  LOW:    { label: 'Low',    color: 'text-slate-500',  dot: 'bg-slate-400' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600',   dot: 'bg-blue-500' },
  HIGH:   { label: 'High',   color: 'text-orange-500', dot: 'bg-orange-500' },
  URGENT: { label: 'Urgent', color: 'text-red-600',    dot: 'bg-red-500' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  TODO:        { label: 'To Do',       bg: 'bg-zinc-100',   text: 'text-zinc-700' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-100',   text: 'text-blue-700' },
  REVIEW:      { label: 'In Review',   bg: 'bg-purple-100', text: 'text-purple-700' },
  DONE:        { label: 'Done',        bg: 'bg-green-100',  text: 'text-green-700' },
};

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId, workspaceId, projectId, projectKey, project, isOpen, onClose,
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

  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagText, setNewTagText] = useState('');

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    const item = { id: Date.now().toString(), title: newSubtaskText.trim(), completed: false };
    setSubtasks((prev) => [...prev, item]);
    setNewSubtaskText('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTagText.trim();
    if (!tag || tags.includes(tag)) return;
    setTags((prev) => [...prev, tag]);
    setNewTagText('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const { data: task, isLoading } = useQuery<Task>({
    queryKey: queryKeys.task(workspaceId, projectId, taskId),
    queryFn: () => apiClient.get(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`).then(r => r.data),
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
    queryFn: () => apiClient
      .get<PagedResponse<WorkspaceMember>>(`/api/workspaces/${workspaceId}/members`, { params: { size: 100 } })
      .then(r => r.data.content),
    enabled: isOpen,
  });

  const { data: comments = [] } = useQuery<TaskComment[]>({
    queryKey: queryKeys.comments(workspaceId, projectId, taskId),
    queryFn: () => apiClient
      .get<PagedResponse<TaskComment>>(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`, { params: { size: 100 } })
      .then(r => r.data.content),
    enabled: isOpen && !!taskId,
  });

  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey: queryKeys.attachments(taskId),
    queryFn: () => apiClient.get(`/api/tasks/${taskId}/attachments`).then(r => r.data),
    enabled: isOpen && !!taskId,
  });

  const updateTask = useMutation({
    mutationFn: (updates: Partial<Task> & { assigneeUserId?: number | null }) => {
      const payload = {
        title: updates.title ?? task?.title ?? '',
        description: updates.description ?? task?.description ?? '',
        status: updates.status ?? task?.status ?? 'TODO',
        priority: updates.priority ?? task?.priority ?? 'MEDIUM',
        assigneeUserId: updates.assigneeUserId !== undefined ? updates.assigneeUserId : (task?.assignee?.id ?? null),
        dueDate: updates.dueDate !== undefined ? updates.dueDate : (task?.dueDate ?? null),
      };
      return apiClient.put<Task>(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`, payload).then(r => r.data);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.task(workspaceId, projectId, taskId), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(workspaceId, projectId) });
      toast('Task updated', 'success');
    },
    onError: (error: unknown) => toast(getApiErrorMessage(error, 'Failed to update'), 'error'),
  });

  const deleteTask = useMutation({
    mutationFn: () => apiClient.delete(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(workspaceId, projectId) });
      toast('Task deleted', 'success');
      onClose();
    },
    onError: (error: unknown) => toast(getApiErrorMessage(error, 'Failed to delete'), 'error'),
  });

  const createComment = useMutation({
    mutationFn: (content: string) =>
      apiClient.post<TaskComment>(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`, { content }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(workspaceId, projectId, taskId) });
      setCommentText('');
    },
    onError: (error: unknown) => toast(getApiErrorMessage(error, 'Failed to post comment'), 'error'),
  });

  const updateComment = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      apiClient.put(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(workspaceId, projectId, taskId) });
      setEditingCommentId(null);
    },
    onError: (error: unknown) => toast(getApiErrorMessage(error, 'Failed to update comment'), 'error'),
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: number) =>
      apiClient.delete(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.comments(workspaceId, projectId, taskId) }),
    onError: (error: unknown) => toast(getApiErrorMessage(error, 'Failed to delete comment'), 'error'),
  });

  const uploadAttachment = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return apiClient.post<Attachment>(`/api/tasks/${taskId}/attachments`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments(taskId) });
      toast('File uploaded', 'success');
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (error: unknown) => toast(getApiErrorMessage(error, 'Upload failed'), 'error'),
  });

  const isImage = (ct: string, name: string) =>
    ct?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(name);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canEditCurrentTask) return;
    if (file.size > 10 * 1024 * 1024) { toast('Max file size is 10 MB', 'error'); return; }
    uploadAttachment.mutate(file);
  };

  const saveTitle = () => {
    if (!canEditCurrentTask) return;
    if (editedTitle.trim() && editedTitle !== task?.title) updateTask.mutate({ title: editedTitle });
    setIsEditingTitle(false);
  };

  const saveDesc = () => {
    if (!canEditCurrentTask) return;
    if (editedDesc !== task?.description) updateTask.mutate({ description: editedDesc });
    setIsEditingDesc(false);
  };

  if (!isOpen) return null;

  const statusCfg = STATUS_CONFIG[task?.status ?? 'TODO'];
  const priorityCfg = PRIORITY_CONFIG[task?.priority ?? 'MEDIUM'];
  const canEditCurrentTask = canEditTask(project, task, user?.id);
  const canAssignCurrentTask = canAssignTask(project);
  const canDeleteCurrentTask = canDeleteTask(project, task, user?.id);
  const canComment = canCommentOnProject(project);

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
        style={{ animation: 'tdmFadeIn 0.15s ease' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto relative w-full bg-white rounded-xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden"
          style={{ maxWidth: '960px', maxHeight: '90vh', animation: 'tdmModalIn 0.18s cubic-bezier(0.16,1,0.3,1)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 bg-zinc-50/60 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5">
                {projectKey}-{task?.taskNumber}
              </span>
              {task && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
                  {statusCfg.label}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          {isLoading || !task ? (
            <div className="flex flex-1 items-center justify-center py-20">
              <div className="animate-spin rounded-full h-7 w-7 border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : (
            <div className="flex flex-1 min-h-0 overflow-hidden">

              {/* LEFT: main content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

                {/* Title */}
                <div className="group">
                  {isEditingTitle ? (
                    <div className="flex items-start gap-2">
                      <input
                        autoFocus
                        aria-label="Edit task title"
                        value={editedTitle}
                        onChange={e => setEditedTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setIsEditingTitle(false); }}
                        className="flex-1 text-lg font-bold text-zinc-900 border border-indigo-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                      <button onClick={saveTitle} aria-label="Save title" className="p-1.5 text-green-600 hover:text-green-700 cursor-pointer"><Check className="h-4 w-4" aria-hidden="true" /></button>
                      <button onClick={() => setIsEditingTitle(false)} aria-label="Cancel title edit" className="p-1.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="h-4 w-4" aria-hidden="true" /></button>
                    </div>
                  ) : (
                    <div
                      className={`flex items-start gap-2 rounded-lg p-1 -ml-1 transition-colors ${
                        canEditCurrentTask ? 'cursor-pointer hover:bg-zinc-50' : ''
                      }`}
                      onClick={() => {
                        if (!canEditCurrentTask) return;
                        setEditedTitle(task.title);
                        setIsEditingTitle(true);
                      }}
                    >
                      <h1 className="flex-1 text-xl font-bold text-zinc-900 leading-snug">{task.title}</h1>
                      {canEditCurrentTask && (
                        <Edit2 className="h-3.5 w-3.5 text-zinc-300 opacity-0 group-hover:opacity-100 mt-1.5 shrink-0 transition-opacity" />
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Description</h3>
                  {isEditingDesc ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        autoFocus
                        aria-label="Edit description"
                        value={editedDesc}
                        onChange={e => setEditedDesc(e.target.value)}
                        rows={6}
                        className="w-full text-sm text-zinc-700 border border-indigo-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                        placeholder="Add a description..."
                      />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setIsEditingDesc(false)} className="text-xs cursor-pointer">Cancel</Button>
                        <Button size="sm" onClick={saveDesc} className="text-xs cursor-pointer">Save</Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        if (!canEditCurrentTask) return;
                        setEditedDesc(task.description || '');
                        setIsEditingDesc(true);
                      }}
                      className={`text-sm text-zinc-700 rounded-lg border border-zinc-200 p-3.5 transition-all min-h-[80px] whitespace-pre-line ${
                        canEditCurrentTask ? 'cursor-pointer hover:border-zinc-300 hover:bg-zinc-50/50' : ''
                      }`}
                    >
                      {task.description
                        ? task.description
                        : <span className="text-zinc-400 italic text-sm">No description. Click to add details...</span>
                      }
                    </div>
                  )}
                </div>

                {/* Custom Tags Section */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" aria-hidden="true" /> Tags ({tags.length})
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {tags.map((t) => {
                      const lower = t.toLowerCase();
                      const badgeColor =
                        lower === 'bug' ? 'bg-red-50 text-red-700 border-red-200' :
                        lower === 'feature' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        lower === 'frontend' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        lower === 'backend' ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-zinc-100 text-zinc-700 border-zinc-200';
                      return (
                        <span key={t} className={`text-xs font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${badgeColor}`}>
                          {t}
                          {canEditCurrentTask && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(t)}
                              aria-label={`Remove tag ${t}`}
                              className="hover:text-red-600 cursor-pointer ml-0.5"
                            >
                              <X className="h-3 w-3" aria-hidden="true" />
                            </button>
                          )}
                        </span>
                      );
                    })}

                    {canEditCurrentTask && (
                      <form onSubmit={handleAddTag} className="flex items-center gap-1">
                        <input
                          type="text"
                          aria-label="Add new tag"
                          placeholder="+ Add Tag"
                          value={newTagText}
                          onChange={(e) => setNewTagText(e.target.value)}
                          className="text-xs border border-dashed border-zinc-300 rounded-md px-2 py-0.5 bg-white text-zinc-700 focus:outline-none focus:border-indigo-500 w-20"
                        />
                      </form>
                    )}
                  </div>
                </div>

                {/* Subtasks Checklist Section */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" /> Subtasks Checklist ({subtasks.filter(s => s.completed).length}/{subtasks.length})
                    </h3>
                    {subtasks.length > 0 && (
                      <span className="text-[11px] font-medium text-zinc-500">
                        {Math.round((subtasks.filter(s => s.completed).length / subtasks.length) * 100)}%
                      </span>
                    )}
                  </div>

                  {subtasks.length > 0 && (
                    <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(subtasks.filter(s => s.completed).length / subtasks.length) * 100}%` }}
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    {subtasks.map((st) => (
                      <div key={st.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50">
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={st.completed}
                            onChange={() => handleToggleSubtask(st.id)}
                            disabled={!canEditCurrentTask}
                            aria-label={st.title}
                            className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                          />
                          <span className={`text-xs text-zinc-800 truncate ${st.completed ? 'line-through text-zinc-400' : ''}`}>
                            {st.title}
                          </span>
                        </label>
                        {canEditCurrentTask && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSubtask(st.id)}
                            aria-label={`Delete subtask ${st.title}`}
                            className="text-zinc-400 hover:text-red-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    ))}

                    {canEditCurrentTask && (
                      <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          aria-label="Add subtask"
                          placeholder="Add a new subtask..."
                          value={newSubtaskText}
                          onChange={(e) => setNewSubtaskText(e.target.value)}
                          className="flex-1 text-xs border border-zinc-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                        <Button type="submit" size="sm" variant="outline" className="text-xs cursor-pointer">
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add
                        </Button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Attachments */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5" /> Attachments ({attachments.length})
                    </h3>
                    {canEditCurrentTask && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadAttachment.isPending}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {uploadAttachment.isPending
                          ? <span className="animate-spin rounded-full h-3 w-3 border border-indigo-500 border-t-transparent inline-block" />
                          : '+ Add File'}
                      </button>
                    )}
                    <input type="file" ref={fileInputRef} aria-label="Upload attachment file" className="hidden" onChange={handleFileChange} />
                  </div>

                  {attachments.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {attachments.map(att => (
                        <div key={att.id} className="group relative rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 hover:border-indigo-300 transition-all shadow-sm">
                          {isImage(att.contentType, att.fileName) ? (
                            <>
                              <div className="relative cursor-zoom-in" onClick={() => { setLightboxUrl(att.url); setLightboxName(att.fileName); }}>
                                <img
                                  src={att.url} alt={att.fileName}
                                  className="w-full h-20 object-cover transition-transform duration-200 group-hover:scale-105"
                                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                                  <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
                                </div>
                              </div>
                              <div className="px-2 py-1 flex items-center justify-between gap-1">
                                <span className="text-[10px] text-zinc-500 truncate" title={att.fileName}>{att.fileName}</span>
                                <a href={att.url} download={att.fileName} target="_blank" rel="noopener noreferrer"
                                  className="shrink-0 text-zinc-400 hover:text-indigo-600 transition-colors"
                                  onClick={e => e.stopPropagation()}
                                ><Download className="h-3 w-3" /></a>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col gap-1 p-2">
                              <div className="flex items-center gap-1.5">
                                <div className="w-7 h-7 rounded bg-indigo-100 flex items-center justify-center shrink-0">
                                  <FileText className="h-3.5 w-3.5 text-indigo-600" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                  <span className="text-[10px] font-medium text-zinc-700 truncate" title={att.fileName}>{att.fileName}</span>
                                  <span className="text-[9px] text-zinc-400">{(att.fileSize / 1024).toFixed(1)} KB</span>
                                </div>
                              </div>
                              <a href={att.url} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              ><Download className="h-3 w-3" /> Download</a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-100" />

                {/* Comments */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Activity ({comments.length})
                  </h3>

                  {canComment && (
                    <div className="flex items-start gap-2.5">
                      <Avatar name={user?.fullName || 'U'} size="sm" />
                      <form className="flex-1 flex gap-2"
                        onSubmit={e => { e.preventDefault(); if (commentText.trim()) createComment.mutate(commentText); }}>
                        <input
                          type="text"
                          aria-label="Write a comment"
                          placeholder="Write a comment..."
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          className="flex-1 text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 bg-zinc-50/50"
                        />
                        <Button type="submit" size="sm" className="cursor-pointer shrink-0" isLoading={createComment.isPending}>
                          <Send className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </form>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    {comments.map(comm => {
                      const isAuthor = comm.author.id === user?.id;
                      const isEditing = editingCommentId === comm.id;
                      return (
                        <div key={comm.id} className="flex items-start gap-2.5">
                          <Avatar name={comm.author.fullName} size="sm" />
                          <div className="flex-1 flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-zinc-800">{comm.author.fullName}</span>
                              <span className="text-[10px] text-zinc-400">
                                {new Date(comm.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </div>
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input autoFocus type="text" aria-label="Edit comment content" value={editingCommentText}
                                  onChange={e => setEditingCommentText(e.target.value)}
                                  className="flex-1 text-sm border border-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                />
                                <button onClick={() => updateComment.mutate({ commentId: comm.id, content: editingCommentText })}
                                  aria-label="Save comment"
                                  className="p-1 text-green-600 hover:text-green-700 cursor-pointer"><Check className="h-4 w-4" aria-hidden="true" /></button>
                                <button onClick={() => setEditingCommentId(null)}
                                  aria-label="Cancel comment edit"
                                  className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="h-4 w-4" aria-hidden="true" /></button>
                              </div>
                            ) : (
                              <p className="text-sm text-zinc-700 bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2">{comm.content}</p>
                            )}
                            {isAuthor && !isEditing && (
                              <div className="flex gap-3 text-[10px] text-zinc-400 font-medium mt-0.5">
                                <button onClick={() => { setEditingCommentText(comm.content); setEditingCommentId(comm.id); }}
                                  className="hover:text-indigo-600 cursor-pointer">Edit</button>
                                <button onClick={() => { if (confirm('Delete this comment?')) deleteComment.mutate(comm.id); }}
                                  className="hover:text-red-600 cursor-pointer">Delete</button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {comments.length === 0 && (
                      <p className="text-center text-[11px] text-zinc-400 italic py-4">No comments yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT: sidebar properties */}
              <div className="w-56 shrink-0 border-l border-zinc-100 bg-zinc-50/40 px-4 py-5 flex flex-col gap-5 overflow-y-auto">

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest">Status</label>
                  <select
                    value={task.status}
                    onChange={e => updateTask.mutate({ status: e.target.value as TaskStatus })}
                    disabled={!canEditCurrentTask}
                    className={`w-full text-xs font-semibold border-0 rounded-lg px-2.5 py-1.5 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 ${
                      canEditCurrentTask ? 'cursor-pointer' : ''
                    } ${statusCfg.bg} ${statusCfg.text}`}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                    <Flag className="h-3 w-3" /> Priority
                  </label>
                  <select
                    value={task.priority}
                    onChange={e => updateTask.mutate({ priority: e.target.value as TaskPriority })}
                    disabled={!canEditCurrentTask}
                    className="w-full text-xs font-medium border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none cursor-pointer text-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${priorityCfg.dot}`} />
                    <span className={`text-[10px] font-semibold ${priorityCfg.color}`}>{priorityCfg.label} Priority</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                    <User className="h-3 w-3" /> Assignee
                  </label>
                  <select
                    value={task.assignee?.id || ''}
                    onChange={e => {
                      const val = e.target.value;
                      updateTask.mutate({ assigneeUserId: val ? parseInt(val) : null });
                    }}
                    disabled={!canAssignCurrentTask}
                    className="w-full text-xs font-medium border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none cursor-pointer text-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.user.id} value={m.user.id}>{m.user.fullName}</option>
                    ))}
                  </select>
                  {task.assignee && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <Avatar name={task.assignee.fullName} size="sm" />
                      <span className="text-[10px] text-zinc-600 font-medium">{task.assignee.fullName}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Due Date
                  </label>
                  <input
                    type="date"
                    aria-label="Due Date"
                    value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                    onChange={e => {
                      const val = e.target.value;
                      updateTask.mutate({ dueDate: val ? new Date(val).toISOString() : undefined });
                    }}
                    disabled={!canEditCurrentTask}
                    className="w-full text-xs font-medium border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none cursor-pointer text-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
                  />
                  {task.dueDate && (
                    <span className={`text-[10px] font-medium flex items-center gap-1 ${
                      new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-red-500' : 'text-zinc-400'
                    }`}>
                      <Clock className="h-3 w-3" />
                      {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>

                <div className="border-t border-zinc-200" />

                <div className="flex flex-col gap-3 text-[10px] text-zinc-500">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest">Reporter</span>
                    <span className="font-medium text-zinc-700">{task.reporter?.fullName || 'System'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest">Created</span>
                    <span className="font-medium text-zinc-700">{new Date(task.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                  </div>
                  {task.completedAt && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest">Completed</span>
                      <span className="font-medium text-green-600">{new Date(task.completedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    </div>
                  )}
                </div>

                {canDeleteCurrentTask && (
                  <div className="mt-auto pt-2">
                    <Button
                      variant="danger" size="sm"
                      className="w-full flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                      isLoading={deleteTask.isPending}
                      onClick={() => { if (confirm('Delete this task permanently?')) deleteTask.mutate(); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Task
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative max-w-5xl max-h-full flex flex-col items-center gap-3"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'tdmLightboxIn 0.18s ease' }}
          >
            <div className="flex items-center justify-between w-full px-1">
              <span className="text-white/80 text-sm font-medium truncate max-w-xs">{lightboxName}</span>
              <div className="flex items-center gap-2">
                <a href={lightboxUrl} download={lightboxName} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-md px-3 py-1.5 transition-colors"
                  onClick={e => e.stopPropagation()}
                ><Download className="h-3.5 w-3.5" /> Download</a>
                <button onClick={() => setLightboxUrl(null)}
                  className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-md p-1.5 transition-colors cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <img src={lightboxUrl} alt={lightboxName}
              className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain" />
            <p className="text-white/30 text-xs">Click outside to close</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes tdmFadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes tdmModalIn  {
          from { opacity:0; transform:scale(0.95) translateY(10px) }
          to   { opacity:1; transform:scale(1)    translateY(0) }
        }
        @keyframes tdmLightboxIn {
          from { opacity:0; transform:scale(0.92) }
          to   { opacity:1; transform:scale(1) }
        }
      `}</style>
    </>,
    document.body
  );
};

export default TaskDetailModal;
