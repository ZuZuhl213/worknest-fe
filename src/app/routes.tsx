import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import AuthLayout from '../shared/layouts/auth-layout';
import DashboardLayout from '../shared/layouts/dashboard-layout';
import AdminLayout from '../shared/layouts/admin-layout';
import ErrorBoundary from '../shared/components/error-boundary';
import { useAuth } from '../features/auth/auth-context';

const LoginForm = React.lazy(() => import('../features/auth/login-form'));
const RegisterForm = React.lazy(() => import('../features/auth/register-form'));
const CheckEmailPage = React.lazy(() => import('../features/auth/check-email-page'));
const VerifyEmailPage = React.lazy(() => import('../features/auth/verify-email-page'));
const WorkspacesPage = React.lazy(() => import('../features/workspace/workspace-page'));
const WorkspaceDashboard = React.lazy(() => import('../features/workspace/workspace-dashboard'));
const ProjectsList = React.lazy(() => import('../features/project/projects-list'));
const ProjectDetailView = React.lazy(() => import('../features/project/project-detail-view'));
const MyTasksView = React.lazy(() => import('../features/task/my-tasks-view'));
const NotificationsFeed = React.lazy(() => import('../features/notification/notifications-feed'));
const UserProfile = React.lazy(() => import('../features/auth/user-profile'));
const AdminOverview = React.lazy(() => import('../features/admin/admin-overview'));
const AdminUsers = React.lazy(() => import('../features/admin/admin-users'));
const AdminUserDetail = React.lazy(() => import('../features/admin/admin-user-detail'));
const SecurityAuditLogs = React.lazy(() => import('../features/admin/security-audit-logs'));

const AuthLoadingScreen: React.FC = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-slate-950">
    <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
  </div>
);

const lazyRoute = (element: React.ReactNode) => (
  <ErrorBoundary>
    <Suspense fallback={<AuthLoadingScreen />}>
      {element}
    </Suspense>
  </ErrorBoundary>
);

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;

  return isAuthenticated ? <Navigate to={user?.systemRole === 'SYSTEM_ADMIN' ? '/admin' : '/workspaces'} replace /> : <Navigate to="/login" replace />;
};

const GuestOnlyRoute: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;
  return isAuthenticated ? <Navigate to={user?.systemRole === 'SYSTEM_ADMIN' ? '/admin' : '/workspaces'} replace /> : <AuthLayout />;
};

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;
  return user?.systemRole === 'SYSTEM_ADMIN' ? <Outlet /> : <Navigate to="/workspaces" replace />;
};

const WorkspaceRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;
  return user?.systemRole === 'SYSTEM_ADMIN' ? <Navigate to="/admin" replace /> : <Outlet />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    element: <GuestOnlyRoute />,
    children: [
      {
        path: 'login',
        element: lazyRoute(<LoginForm />),
      },
      {
        path: 'register',
        element: lazyRoute(<RegisterForm />),
      },
      {
        path: 'check-email',
        element: lazyRoute(<CheckEmailPage />),
      },
      {
        path: 'verify-email',
        element: lazyRoute(<VerifyEmailPage />),
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminRoute />,
        children: [
          {
            path: 'admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: lazyRoute(<AdminOverview />) },
              { path: 'users', element: lazyRoute(<AdminUsers />) },
              { path: 'users/:userId', element: lazyRoute(<AdminUserDetail />) },
              { path: 'security-audit-logs', element: lazyRoute(<SecurityAuditLogs />) },
            ],
          },
        ],
      },
      {
        path: 'workspaces',
        element: <WorkspaceRoute />,
        children: [
          { index: true, element: lazyRoute(<WorkspacesPage />) },
          {
            path: ':workspaceId',
            element: <DashboardLayout />,
            children: [
              { path: 'dashboard', element: lazyRoute(<WorkspaceDashboard />) },
              { path: 'projects', element: lazyRoute(<ProjectsList />) },
              { path: 'projects/:projectId', element: lazyRoute(<ProjectDetailView />) },
              { path: 'tasks', element: lazyRoute(<MyTasksView />) },
              { path: 'notifications', element: lazyRoute(<NotificationsFeed />) },
              { path: 'profile', element: lazyRoute(<UserProfile />) },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
