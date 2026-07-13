import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../shared/api/client';
import { Task, WorkspaceMember, TaskComment, TaskStatus, TaskPriority, Attachment } from '../../types';
import Drawer from '../../shared/components/drawer';
import Button from '../../shared/components/button';
import Avatar from '../../shared/components/avatar';
import Badge from '../../shared/components/badge';
import { useToast } from '../../shared/components/toast';
import { useAuth } from '../auth/auth-context';
import { 
  Calendar, 
  Trash2, 
  MessageSquare, 
  Send,
  Edit2,
  Check,
  X,
  Paperclip,
  Download
} from 'lucide-react';

interface TaskDetailDrawerProps {
  taskId: number;
  workspaceId: number;
  projectId: number;
  projectKey: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  taskId,
  workspaceId,
  projectId,
  projectKey,
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form edit states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState('');
  
  // Comments state
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // 1. Fetch task details
  const { data: task, isLoading: isTaskLoading } = useQuery<Task>({
    queryKey: ['task', workspaceId, projectId, taskId],
    queryFn: () => apiClient.get(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`).then(res => res.data),
    enabled: isOpen && !!taskId,
  });

  // 2. Fetch workspace members
  const { data: members = [] } = useQuery<WorkspaceMember[]>({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => apiClient.get(`/api/workspaces/${workspaceId}/members`).then(res => res.data),
    enabled: isOpen,
  });

  // 3. Fetch task comments
  const { data: comments = [], isLoading: isCommentsLoading } = useQuery<TaskComment[]>({
    queryKey: ['comments', workspaceId, projectId, taskId],
    queryFn: () => apiClient.get(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`).then(res => res.data),
    enabled: isOpen && !!taskId,
  });

  // 4. Fetch attachments
  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey: ['attachments', taskId],
    queryFn: () => apiClient.get(`/api/tasks/${taskId}/attachments`).then(res => res.data),
    enabled: isOpen && !!taskId,
  });

  // Mutations
  const updateTaskMutation = useMutation({
    mutationFn: (updates: Partial<Task> & { assigneeUserId?: number | null }) => {
      // Build DTO
      const payload = {
        title: updates.title !== undefined ? updates.title : task?.title || '',
        description: updates.description !== undefined ? updates.description : task?.description || '',
        status: updates.status !== undefined ? updates.status : task?.status || 'TODO',
        priority: updates.priority !== undefined ? updates.priority : task?.priority || 'MEDIUM',
        assigneeUserId: updates.assigneeUserId !== undefined ? updates.assigneeUserId : task?.assignee?.id || null,
        dueDate: updates.dueDate !== undefined ? updates.dueDate : task?.dueDate || null,
      };
      return apiClient.put<Task>(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`, payload).then(res => res.data);
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(['task', workspaceId, projectId, taskId], updatedTask);
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId, projectId] });
      toast('Task updated successfully!', 'success');
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Failed to update task', 'error');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => apiClient.delete(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId, projectId] });
      toast('Task deleted', 'success');
      onClose();
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Failed to delete task', 'error');
    }
  });

  // Comments mutations
  const createCommentMutation = useMutation({
    mutationFn: (content: string) => 
      apiClient.post<TaskComment>(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`, { content }).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', workspaceId, projectId, taskId] });
      setCommentText('');
      toast('Comment posted!', 'success');
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Failed to post comment', 'error');
    }
  });

  const updateCommentMutation = useMutation({
    mutationFn: (data: { commentId: number; content: string }) => 
      apiClient.put<TaskComment>(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments/${data.commentId}`, { content: data.content }).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', workspaceId, projectId, taskId] });
      setEditingCommentId(null);
      setEditingCommentText('');
      toast('Comment updated', 'success');
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Failed to update comment', 'error');
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => 
      apiClient.delete(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', workspaceId, projectId, taskId] });
      toast('Comment deleted', 'success');
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Failed to delete comment', 'error');
    }
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const uploadAttachmentMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post<Attachment>(`/api/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(res => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', taskId] });
      toast('Attachment uploaded', 'success');
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Failed to upload attachment', 'error');
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast('File is too large (max 10MB)', 'error');
      return;
    }
    uploadAttachmentMutation.mutate(file);
  };

  // Form handlers
  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== task?.title) {
      updateTaskMutation.mutate({ title: editedTitle });
    }
    setIsEditingTitle(false);
  };

  const handleSaveDesc = () => {
    if (editedDesc !== task?.description) {
      updateTaskMutation.mutate({ description: editedDesc });
    }
    setIsEditingDesc(false);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    createCommentMutation.mutate(commentText);
  };

  const startEditTitle = () => {
    setEditedTitle(task?.title || '');
    setIsEditingTitle(true);
  };

  const startEditDesc = () => {
    setEditedDesc(task?.description || '');
    setIsEditingDesc(true);
  };

  if (isTaskLoading) {
    return (
      <Drawer isOpen={isOpen} onClose={onClose}>
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
        </div>
      </Drawer>
    );
  }

  if (!task) return null;

  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose}
      title={`${projectKey}-${task.taskNumber}`}
    >
      <div className="flex flex-col lg:flex-row gap-6 h-full text-left">
        {/* Left pane: Title, description, comments */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
          {/* Editable Title */}
          <div className="group relative">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  className="w-full text-base font-semibold text-zinc-900 border border-zinc-200 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveTitle} className="p-1 h-auto cursor-pointer">
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditingTitle(false)} className="p-1 h-auto cursor-pointer">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <h1 
                  onClick={startEditTitle}
                  className="text-base font-semibold text-zinc-900 cursor-pointer hover:bg-zinc-50 rounded-md p-1 -ml-1 transition-all w-full"
                >
                  {task.title}
                </h1>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 p-1 h-auto cursor-pointer"
                  onClick={startEditTitle}
                >
                  <Edit2 className="h-3.5 w-3.5 text-zinc-400" />
                </Button>
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-zinc-500">Description</h3>
            {isEditingDesc ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editedDesc}
                  onChange={e => setEditedDesc(e.target.value)}
                  className="w-full text-xs text-zinc-700 border border-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[100px]"
                  placeholder="Provide task requirements..."
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => setIsEditingDesc(false)} className="cursor-pointer text-[10px] py-1 px-3">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveDesc} className="cursor-pointer text-[10px] py-1 px-3">
                    Save Details
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                onClick={startEditDesc}
                className="text-xs text-zinc-700 p-2.5 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-all cursor-pointer bg-zinc-50/20 min-h-[60px]"
              >
                {task.description ? (
                  <p className="whitespace-pre-line">{task.description}</p>
                ) : (
                  <span className="text-zinc-400 italic">No description provided. Click to add details...</span>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-100 my-2" />

          {/* Attachments Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                <Paperclip className="h-4 w-4 text-zinc-400" />
                Attachments ({attachments.length})
              </h3>
              <Button size="sm" variant="outline" className="text-[10px] py-1 px-2 cursor-pointer h-auto" onClick={() => fileInputRef.current?.click()} isLoading={uploadAttachmentMutation.isPending}>
                Add File
              </Button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            </div>

            {attachments.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {attachments.map(att => (
                  <div key={att.id} className="border border-zinc-200 rounded-md p-2 flex flex-col gap-2 items-start text-left bg-zinc-50/50 hover:bg-zinc-50 transition-colors group">
                    <div className="flex items-center gap-2 w-full overflow-hidden">
                      <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center shrink-0">
                        <Paperclip className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-medium text-zinc-700 truncate" title={att.fileName}>{att.fileName}</span>
                        <span className="text-[10px] text-zinc-400">{(att.fileSize / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Download className="h-3 w-3" /> Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-100 my-2" />

          {/* Comments Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-zinc-400" />
              Activity Feed ({comments.length} Comments)
            </h3>

            {/* Comment Form input */}
            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                className="flex-1 text-xs border border-zinc-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Button type="submit" size="sm" className="cursor-pointer" isLoading={createCommentMutation.isPending}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>

            {/* Comments list thread */}
            <div className="flex flex-col gap-3">
              {comments.map((comm) => {
                const isCommentAuthor = comm.author.id === user?.id;
                const isEditing = editingCommentId === comm.id;

                return (
                  <div key={comm.id} className="flex items-start gap-2.5 text-xs text-left">
                    <Avatar name={comm.author.fullName} size="sm" />
                    <div className="flex-1 flex flex-col gap-1 bg-zinc-50/50 border border-zinc-150 rounded-lg p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-800">{comm.author.fullName}</span>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(comm.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={editingCommentText}
                            onChange={e => setEditingCommentText(e.target.value)}
                            className="w-full text-xs border border-zinc-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                          <button 
                            onClick={() => updateCommentMutation.mutate({ commentId: comm.id, content: editingCommentText })}
                            className="p-1 text-green-600 hover:text-green-800 cursor-pointer"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setEditingCommentId(null)}
                            className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-zinc-700 font-normal mt-0.5">{comm.content}</p>
                      )}

                      {isCommentAuthor && !isEditing && (
                        <div className="flex gap-2 justify-end mt-1.5 pt-1.5 border-t border-zinc-100 text-[10px] text-zinc-400 font-medium">
                          <button
                            onClick={() => {
                              setEditingCommentText(comm.content);
                              setEditingCommentId(comm.id);
                            }}
                            className="hover:text-indigo-600 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this comment?')) {
                                deleteCommentMutation.mutate(comm.id);
                              }
                            }}
                            className="hover:text-red-600 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {comments.length === 0 && (
                <div className="text-center py-6 text-zinc-400 italic text-[11px]">
                  No activities logged for this ticket yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right pane: Side settings panel */}
        <div className="w-full lg:w-60 bg-zinc-50 border border-zinc-200 rounded-lg p-4 shrink-0 flex flex-col justify-between gap-6 max-h-[600px]">
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-zinc-800 uppercase tracking-wider select-none">Task Properties</h3>

            {/* Status Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-zinc-400">STATUS</label>
              <select
                value={task.status}
                onChange={e => updateTaskMutation.mutate({ status: e.target.value as TaskStatus })}
                className="text-xs border border-zinc-200 rounded-md bg-white p-1.5 text-zinc-700 focus:outline-none cursor-pointer font-medium"
              >
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            {/* Priority Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-zinc-400">PRIORITY</label>
              <select
                value={task.priority}
                onChange={e => updateTaskMutation.mutate({ priority: e.target.value as TaskPriority })}
                className="text-xs border border-zinc-200 rounded-md bg-white p-1.5 text-zinc-700 focus:outline-none cursor-pointer font-medium"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Assignee Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-zinc-400">ASSIGNEE</label>
              <select
                value={task.assignee?.id || ''}
                onChange={e => {
                  const val = e.target.value;
                  updateTaskMutation.mutate({ assigneeUserId: val ? parseInt(val) : null });
                }}
                className="text-xs border border-zinc-200 rounded-md bg-white p-1.5 text-zinc-700 focus:outline-none cursor-pointer font-medium"
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Due date input */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-zinc-400">DUE DATE</label>
              <input
                type="date"
                value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                onChange={e => {
                  const val = e.target.value;
                  updateTaskMutation.mutate({ dueDate: val ? new Date(val).toISOString() : undefined });
                }}
                className="text-xs border border-zinc-200 rounded-md bg-white p-1.5 text-zinc-700 focus:outline-none cursor-pointer font-medium"
              />
            </div>

            <div className="border-t border-zinc-200 my-1" />

            {/* Meta values */}
            <div className="flex flex-col gap-2 text-[10px] text-zinc-400 font-medium">
              <div className="flex items-center justify-between">
                <span>Reporter</span>
                <span className="text-zinc-600 font-semibold">{task.reporter?.fullName || 'System'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Created At</span>
                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
              {task.completedAt && (
                <div className="flex items-center justify-between">
                  <span>Completed At</span>
                  <span>{new Date(task.completedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <Button 
            variant="danger" 
            size="sm"
            onClick={() => {
              if (confirm('Delete this task? This action is permanent.')) {
                deleteTaskMutation.mutate();
              }
            }}
            className="w-full flex items-center justify-center gap-1.5 text-xs cursor-pointer py-1.5 mt-auto"
            isLoading={deleteTaskMutation.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Ticket
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
export default TaskDetailDrawer;
