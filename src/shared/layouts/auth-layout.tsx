import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/auth-context';
import { ThemeToggle } from '../theme/theme-toggle';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading WorkNest...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/workspaces" replace />;
  }

  return (
    <div className="min-h-screen w-screen bg-slate-50/80 dark:bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/50 via-slate-50 to-slate-100 dark:from-indigo-950/40 dark:via-slate-950 dark:to-slate-900 flex flex-col items-center justify-center p-4 font-sans antialiased text-slate-800 dark:text-slate-100 relative overflow-hidden transition-colors duration-200">
      {/* Ambient background glow spots */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-indigo-400/15 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-400/15 dark:bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Floating Theme Toggle */}
      <div className="absolute top-5 right-5 z-50">
        <ThemeToggle variant="dropdown" />
      </div>

      <div className="w-full max-w-md flex flex-col items-center z-10">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
