import React from 'react';
import Avatar from '../../../shared/components/avatar';
import Button from '../../../shared/components/button';
import { TaskComment, CurrentUser } from '../../../types';
import { MessageSquare, Send, Check, X } from 'lucide-react';

interface TaskCommentsSectionProps {
  comments: TaskComment[];
  user: CurrentUser | null;
  canComment: boolean;
  commentText: string;
  setCommentText: (val: string) => void;
  editingCommentId: number | null;
  editingCommentText: string;
  setEditingCommentText: (val: string) => void;
  setEditingCommentId: (id: number | null) => void;
  onCreateComment: (text: string) => void;
  onUpdateComment: (id: number, content: string) => void;
  onDeleteComment: (id: number) => void;
  isSubmittingComment: boolean;
}

export const TaskCommentsSection: React.FC<TaskCommentsSectionProps> = ({
  comments,
  user,
  canComment,
  commentText,
  setCommentText,
  editingCommentId,
  editingCommentText,
  setEditingCommentText,
  setEditingCommentId,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  isSubmittingComment,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[10px] font-semibold text-zinc-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        <MessageSquare className="h-3.5 w-3.5" /> Activity ({comments.length})
      </h3>

      {canComment && (
        <div className="flex items-start gap-2.5">
          <Avatar name={user?.fullName || 'U'} size="sm" />
          <form
            className="flex-1 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (commentText.trim()) onCreateComment(commentText);
            }}
          >
            <input
              type="text"
              aria-label="Write a comment"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 text-sm border border-zinc-200 dark:border-slate-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-slate-100 placeholder:text-zinc-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 bg-zinc-50/50 dark:bg-slate-800/60"
            />
            <Button
              type="submit"
              size="sm"
              className="cursor-pointer shrink-0"
              isLoading={isSubmittingComment}
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {comments.map((comm) => {
          const isAuthor = comm.author.id === user?.id;
          const isEditing = editingCommentId === comm.id;
          return (
            <div key={comm.id} className="flex items-start gap-2.5">
              <Avatar name={comm.author.fullName} size="sm" />
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-slate-200">
                    {comm.author.fullName}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-slate-400">
                    {new Date(comm.createdAt).toLocaleString(undefined, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      type="text"
                      aria-label="Edit comment content"
                      value={editingCommentText}
                      onChange={(e) => setEditingCommentText(e.target.value)}
                      className="flex-1 text-sm border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-zinc-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <button
                      onClick={() => onUpdateComment(comm.id, editingCommentText)}
                      aria-label="Save comment"
                      className="p-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 cursor-pointer"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setEditingCommentId(null)}
                      aria-label="Cancel comment edit"
                      className="p-1 text-zinc-400 dark:text-slate-500 hover:text-zinc-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-700 dark:text-slate-300 bg-zinc-50 dark:bg-slate-800/60 border border-zinc-100 dark:border-slate-800 rounded-lg px-3 py-2">
                    {comm.content}
                  </p>
                )}
                {isAuthor && !isEditing && (
                  <div className="flex gap-3 text-[10px] text-zinc-400 dark:text-slate-400 font-medium mt-0.5">
                    <button
                      onClick={() => {
                        setEditingCommentText(comm.content);
                        setEditingCommentId(comm.id);
                      }}
                      className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this comment?')) onDeleteComment(comm.id);
                      }}
                      className="hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
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
          <p className="text-center text-[11px] text-zinc-400 dark:text-slate-400 italic py-4">
            No comments yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default TaskCommentsSection;
