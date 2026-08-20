import React from 'react';
import { Attachment } from '../../../types';
import { Paperclip, Download, FileText, ZoomIn, Trash2, Plus } from 'lucide-react';

interface TaskAttachmentsSectionProps {
  attachments: Attachment[];
  canEdit: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (file: File) => void;
  onDeleteAttachment: (id: number) => void;
  onOpenLightbox: (url: string, name: string) => void;
  isUploading: boolean;
}

export const TaskAttachmentsSection: React.FC<TaskAttachmentsSectionProps> = ({
  attachments,
  canEdit,
  fileInputRef,
  onFileUpload,
  onDeleteAttachment,
  onOpenLightbox,
  isUploading,
}) => {
  const isImage = (fileName: string) =>
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold text-zinc-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5" /> Attachments ({attachments.length})
        </h3>
        {canEdit && (
          <div>
            <input
              ref={fileInputRef as any}
              type="file"
              aria-label="Upload attachment file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileUpload(file);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" /> {isUploading ? 'Uploading...' : 'Add file'}
            </button>
          </div>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group relative border border-zinc-200 dark:border-slate-800 rounded-lg overflow-hidden bg-zinc-50/50 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
            >
              {canEdit && (
                <button
                  onClick={() => onDeleteAttachment(att.id)}
                  aria-label="Delete attachment"
                  className="absolute top-1 right-1 z-10 p-1 bg-black/60 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
              {isImage(att.fileName) ? (
                <>
                  <div
                    className="h-20 w-full overflow-hidden bg-zinc-100 dark:bg-slate-900 cursor-pointer relative"
                    onClick={() => onOpenLightbox(att.url, att.fileName)}
                  >
                    <img
                      src={att.url}
                      alt={att.fileName}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="p-1.5 flex items-center justify-between gap-1">
                    <span
                      className="text-[10px] font-medium text-zinc-700 dark:text-slate-300 truncate"
                      title={att.fileName}
                    >
                      {att.fileName}
                    </span>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-zinc-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="h-3 w-3" />
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-1 p-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded bg-indigo-100 dark:bg-indigo-950/70 flex items-center justify-center shrink-0">
                      <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span
                        className="text-[10px] font-medium text-zinc-700 dark:text-slate-300 truncate"
                        title={att.fileName}
                      >
                        {att.fileName}
                      </span>
                      <span className="text-[9px] text-zinc-400 dark:text-slate-400">
                        {(att.fileSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-indigo-400 transition-opacity"
                  >
                    <Download className="h-3 w-3" /> Download
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskAttachmentsSection;
