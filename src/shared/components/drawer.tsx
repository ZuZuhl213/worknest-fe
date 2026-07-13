import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import Button from './button';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children, className }) => {
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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity" onClick={onClose} />
      
      {/* Container */}
      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        <div className={cn('w-screen max-w-2xl bg-white shadow-xl flex flex-col h-full animate-in slide-in-from-right duration-250 border-l border-zinc-200', className)}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            {title ? <h2 className="text-sm font-medium text-zinc-900">{title}</h2> : <div />}
            <Button variant="ghost" size="sm" className="p-1 h-auto cursor-pointer" onClick={onClose}>
              <X className="h-4 w-4 text-zinc-400 hover:text-zinc-600" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
};
export default Drawer;
