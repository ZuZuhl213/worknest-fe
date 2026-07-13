import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import Button from './button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity" onClick={onClose} />
      
      {/* Container */}
      <div className={cn('relative bg-white border border-zinc-200 shadow-xl rounded-lg max-w-lg w-full z-10 flex flex-col max-h-[90vh] animate-in fade-in-50 zoom-in-95 duration-100', className)}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-medium text-zinc-900">{title}</h2>
          <Button variant="ghost" size="sm" className="p-1 h-auto cursor-pointer" onClick={onClose}>
            <X className="h-4 w-4 text-zinc-400 hover:text-zinc-600" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body
  );
};
export default Modal;
