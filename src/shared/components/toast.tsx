import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div 
        aria-live="polite" 
        aria-atomic="false" 
        className="fixed bottom-4 left-4 right-4 sm:left-auto z-[9999] flex flex-col gap-2 sm:max-w-sm sm:w-full"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            aria-live={t.type === 'error' ? 'assertive' : 'polite'}
            className={cn(
              'flex items-start gap-3 p-3.5 rounded-lg border bg-white shadow-lg animate-in slide-in-from-bottom duration-200 text-sm font-normal text-zinc-900 dark:bg-white dark:text-zinc-950',
              {
                'border-green-200 bg-green-50 text-green-950 dark:border-green-500 dark:bg-white dark:text-zinc-950': t.type === 'success',
                'border-red-200 bg-red-50 text-red-950 dark:border-red-500 dark:bg-white dark:text-zinc-950': t.type === 'error',
                'border-zinc-200 bg-white text-zinc-900 dark:border-zinc-300 dark:bg-white dark:text-zinc-950': t.type === 'info',
              }
            )}
          >
            {t.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 shrink-0" aria-hidden="true" />}
            {t.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600 shrink-0" aria-hidden="true" />}
            {t.type === 'info' && <Info className="h-5 w-5 text-indigo-600 shrink-0" aria-hidden="true" />}
            <span className="flex-1 text-left">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss notification"
              className="text-zinc-400 hover:text-zinc-700 cursor-pointer shrink-0 dark:text-zinc-500 dark:hover:text-zinc-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
export default ToastProvider;
