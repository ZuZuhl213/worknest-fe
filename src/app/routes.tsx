import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthLayout from '../shared/layouts/auth-layout';
import DashboardLayout from '../shared/layouts/dashboard-layout';
import LoginForm from '../features/auth/login-form';
import RegisterForm from '../features/auth/register-form';
import WorkspacesPage from '../features/workspace/workspace-page';
import WorkspaceDashboard from '../features/workspace/workspace-dashboard';
import ProjectsList from '../features/project/projects-list';
import ProjectDetailView from '../features/project/project-detail-view';
import MyTasksView from '../features/task/my-tasks-view';
import NotificationsFeed from '../features/notification/notifications-feed';
import UserProfile from '../features/auth/user-profile';
import { useAuth } from '../features/auth/auth-context';

// Root redirect handler
const RootRedirect: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/workspaces" replace /> : <Navigate to="/login" replace />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginForm />,
      },
      {
        path: 'register',
        element: <RegisterForm />,
      },
    ],
  },
  {
    path: 'workspaces',
    element: <WorkspacesPage />,
  },
  {
    path: 'workspaces/:workspaceId',
    element: <DashboardLayout />,
    children: [
      {
        path: 'dashboard',
        element: <WorkspaceDashboard />,
      },
      {
        path: 'projects',
        element: <ProjectsList />,
      },
      {
        path: 'projects/:projectId',
        element: <ProjectDetailView />,
      },
      {
        path: 'tasks',
        element: <MyTasksView />,
      },
      {
        path: 'notifications',
        element: <NotificationsFeed />,
      },
      {
        path: 'profile',
        element: <UserProfile />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
