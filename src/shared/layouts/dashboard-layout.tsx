import React, { useState, useRef, useEffect } from 'react';
import { Navigate, Outlet, useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { getApiErrorMessage } from '../api/client';
import { queryKeys } from '../api/query-keys';
import { Workspace, Project, Notification } from '../../types';
import ErrorBoundary from '../components/error-boundary';
import Avatar from '../components/avatar';
import Button from '../components/button';
import Input from '../components/input';
import Modal from '../components/modal';
import { useToast } from '../components/toast';
import CommandPalette from '../components/command-palette';
import ThemeToggle from '../theme/theme-toggle';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Bell, 
  User, 
  ChevronDown, 
  Plus, 
  LogOut, 
  Building2,
  Menu,
  X,
  Check,
  CheckCheck,
  Clock,
  Inbox,
  Search,
  Command,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceSlug, setNewWorkspaceSlug] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    if (showNotifDropdown) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifDropdown]);

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  };

  // 1. Fetch workspaces
  const { data: workspaces = [], isLoading: isWorkspacesLoading } = useQuery<Workspace[]>({
    queryKey: queryKeys.workspaces(),
    queryFn: () => apiClient.get('/api/workspaces').then(res => res.data),
    enabled: isAuthenticated,
  });

  // 2. Fetch projects for active workspace
  const activeWorkspaceId = workspaceId ? parseInt(workspaceId) : undefined;
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: queryKeys.projects(activeWorkspaceId),
    queryFn: () => apiClient.get(`/api/workspaces/${activeWorkspaceId}/projects`).then(res => res.data),
    enabled: !!activeWorkspaceId && isAuthenticated,
  });

  // 3. Fetch notifications count
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: queryKeys.notifications(),
    queryFn: () => apiClient.get('/api/notifications').then(res => res.data),
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  // Mark single notification as read
  const readNotifMutation = useMutation({
    mutationFn: (id: number) =>
      apiClient.patch<Notification>(`/api/notifications/${id}/read`).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications() }),
  });

  // Mark all as read
  const readAllNotifMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => apiClient.patch(`/api/notifications/${n.id}/read`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
      toast('All notifications marked as read', 'success');
    },
  });

  // Create workspace mutation
  const createWorkspaceMutation = useMutation({
    mutationFn: (data: { name: string; slug: string; description: string }) => 
      apiClient.post<Workspace>('/api/workspaces', data).then(res => res.data),
    onSuccess: (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() });
      toast('Workspace created successfully!', 'success');
      setWorkspaceModalOpen(false);
      setNewWorkspaceName('');
      setNewWorkspaceSlug('');
      setNewWorkspaceDesc('');
      navigate(`/workspaces/${newWorkspace.id}/dashboard`);
    },
    onError: (error: unknown) => {
      toast(getApiErrorMessage(error, 'Failed to create workspace'), 'error');
    }
  });

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim() || !newWorkspaceSlug.trim()) return;
    createWorkspaceMutation.mutate({ 
      name: newWorkspaceName, 
      slug: newWorkspaceSlug, 
      description: newWorkspaceDesc 
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const sidebarLinks = activeWorkspaceId ? [
    { label: 'Dashboard', path: `/workspaces/${activeWorkspaceId}/dashboard`, icon: LayoutDashboard },
    { label: 'Projects', path: `/workspaces/${activeWorkspaceId}/projects`, icon: FolderKanban },
    { label: 'My Tasks', path: `/workspaces/${activeWorkspaceId}/tasks`, icon: CheckSquare },
    { label: 'Notifications', path: `/workspaces/${activeWorkspaceId}/notifications`, icon: Bell, badge: unreadNotifications },
    { label: 'Profile', path: `/workspaces/${activeWorkspaceId}/profile`, icon: User },
  ] : [];

  return (
    <>
    <div className="flex h-screen w-screen bg-zinc-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-200">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-60 shrink-0 border-r border-zinc-200 dark:border-slate-800/80 bg-white dark:bg-slate-900">
        {/* Workspace Switcher Header */}
        <div className="relative border-b border-zinc-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-slate-100 hover:bg-zinc-50 dark:hover:bg-slate-800 rounded-md p-1.5 w-full text-left justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center shrink-0">
                <Building2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="truncate">{activeWorkspace ? activeWorkspace.name : 'Select Workspace'}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-zinc-400 dark:text-slate-500 shrink-0" />
          </button>

          {/* Switcher Dropdown */}
          {showWorkspaceDropdown && (
            <div className="absolute top-13 left-4 right-4 z-50 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-xl shadow-lg p-1 flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-zinc-400 dark:text-slate-400 px-2 py-1 select-none">SWITCH WORKSPACE</span>
              <div className="max-h-40 overflow-y-auto flex flex-col">
                {workspaces.map(w => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setShowWorkspaceDropdown(false);
                      navigate(`/workspaces/${w.id}/dashboard`);
                    }}
                    className={`flex items-center text-xs px-2.5 py-1.5 rounded-md hover:bg-zinc-50 dark:hover:bg-slate-700 text-left cursor-pointer truncate ${w.id === activeWorkspaceId ? 'font-medium bg-zinc-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-300' : 'text-zinc-700 dark:text-slate-300'}`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
              <div className="border-t border-zinc-100 dark:border-slate-700 mt-1 pt-1">
                <button
                  onClick={() => {
                    setShowWorkspaceDropdown(false);
                    setWorkspaceModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium px-2 py-1.5 rounded-md hover:bg-indigo-50/30 dark:hover:bg-indigo-950/50 w-full text-left cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Workspace
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {sidebarLinks.map(link => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.label}
                to={link.path}
                className={`flex items-center justify-between text-xs px-3 py-2 rounded-md hover:bg-zinc-50 dark:hover:bg-slate-800/80 font-medium transition-colors ${
                  isActive ? 'bg-zinc-100 dark:bg-slate-800 text-zinc-900 dark:text-white font-semibold' : 'text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-zinc-900 dark:text-slate-100' : 'text-zinc-400 dark:text-slate-500'}`} />
                  <span>{link.label}</span>
                </div>
                {!!link.badge && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-bold">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Active Workspace Projects directory */}
          {activeWorkspaceId && (
            <div className="mt-6 flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-3">
                <span className="text-[10px] font-semibold text-zinc-400 select-none">PROJECTS</span>
              </div>
              <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto px-1.5">
                {projects.map(proj => {
                  const path = `/workspaces/${activeWorkspaceId}/projects/${proj.id}`;
                  const isActive = location.pathname === path;
                  return (
                    <Link
                      key={proj.id}
                      to={path}
                      className={`text-xs px-2 py-1.5 rounded-md hover:bg-zinc-50 dark:hover:bg-slate-800 transition-colors block truncate ${
                        isActive ? 'font-medium bg-zinc-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300' : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-100'
                      }`}
                    >
                      # {proj.name}
                    </Link>
                  );
                })}
                {projects.length === 0 && (
                  <span className="text-[10px] text-zinc-400 dark:text-slate-400 italic px-2">No projects created yet</span>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* User Footer Profile */}
        <div className="border-t border-zinc-100 dark:border-slate-800 p-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <Avatar name={user?.fullName || ''} size="sm" />
            <div className="flex flex-col text-left truncate">
              <span className="text-xs font-semibold text-zinc-900 dark:text-slate-100 truncate">{user?.fullName}</span>
              <span className="text-[10px] text-zinc-500 dark:text-slate-400 truncate">{user?.email}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            title="Log Out"
            className="text-zinc-400 dark:text-slate-500 hover:text-zinc-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-zinc-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Top bar header */}
        <header className="h-14 border-b border-zinc-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-3 sm:px-6 shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Menu Toggle Button */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-zinc-500 dark:text-slate-400 hover:text-zinc-800 dark:hover:text-slate-100 p-1 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden sm:inline text-xs font-semibold text-zinc-400 dark:text-slate-400 select-none">
              WorkNest
            </span>
            <button
              onClick={() => setCommandPaletteOpen(true)}
              aria-label="Open Command Palette (Ctrl+K)"
              className="flex items-center gap-2 bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 hover:border-zinc-300 dark:hover:border-slate-600 rounded-xl px-2 sm:px-3 py-1.5 text-xs text-zinc-500 dark:text-slate-400 hover:text-zinc-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 text-zinc-400 dark:text-slate-500" aria-hidden="true" />
              <span className="hidden sm:inline">Search commands...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-zinc-400 dark:text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-zinc-200 dark:border-slate-700">
                <Command className="h-3 w-3" aria-hidden="true" /> K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <ThemeToggle variant="compact" />
            <div className="relative flex items-center" ref={notifDropdownRef}>
              <button
                onClick={() => setShowNotifDropdown(v => !v)}
                className="relative p-1.5 rounded-full hover:bg-zinc-50 dark:hover:bg-slate-800 text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-200 cursor-pointer transition-colors"
                title="Notifications"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500 ring-1 ring-white dark:ring-slate-900" />
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div
                  className="fixed inset-x-4 top-16 w-auto mt-0 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 rounded-xl shadow-xl z-50 flex flex-col overflow-hidden"
                  style={{ animation: 'notifDropIn 0.15s cubic-bezier(0.16,1,0.3,1)' }}
                >
                  {/* Dropdown header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Inbox className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-semibold text-zinc-900 dark:text-slate-100">Notifications</span>
                      {unreadNotifications > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none">
                          {unreadNotifications}
                        </span>
                      )}
                    </div>
                    {unreadNotifications > 0 && (
                      <button
                        onClick={() => readAllNotifMutation.mutate()}
                        disabled={readAllNotifMutation.isPending}
                        className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold cursor-pointer disabled:opacity-50"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notification list */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-400 dark:text-slate-400">
                        <Bell className="h-8 w-8 opacity-30" />
                        <span className="text-xs italic">All caught up! No notifications.</span>
                      </div>
                    ) : (
                      notifications.slice(0, 20).map(notif => (
                        <div
                          key={notif.id}
                          className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                            !notif.read
                              ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-l-2 border-indigo-500'
                              : 'bg-white dark:bg-slate-900 border-l-2 border-transparent'
                          }`}
                        >
                          {/* Unread dot */}
                          <div className="mt-1 shrink-0">
                            <span className={`block w-2 h-2 rounded-full ${
                              !notif.read ? 'bg-indigo-500' : 'bg-zinc-200 dark:bg-slate-700'
                            }`} />
                          </div>
                          <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                            <p className={`text-xs font-semibold leading-snug ${
                              !notif.read ? 'text-zinc-900 dark:text-slate-100' : 'text-zinc-600 dark:text-slate-300'
                            }`}>{notif.title}</p>
                            <p className="text-[11px] text-zinc-500 dark:text-slate-400 leading-snug line-clamp-2">{notif.content}</p>
                            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-zinc-400 dark:text-slate-400">
                              <Clock className="h-3 w-3" />
                              {new Date(notif.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                          </div>
                          {!notif.read && (
                            <button
                              onClick={() => readNotifMutation.mutate(notif.id)}
                              disabled={readNotifMutation.isPending && readNotifMutation.variables === notif.id}
                              className="shrink-0 p-1 text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded cursor-pointer transition-colors"
                              title="Mark as read"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer link to full notifications page */}
                  {activeWorkspaceId && (
                    <div className="border-t border-zinc-100 dark:border-slate-800 px-4 py-2.5">
                      <Link
                        to={`/workspaces/${activeWorkspaceId}/notifications`}
                        onClick={() => setShowNotifDropdown(false)}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold flex items-center justify-center gap-1"
                      >
                        View all notifications →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs font-medium text-zinc-700 dark:text-slate-300">{user?.fullName}</span>
              <Avatar name={user?.fullName || ''} size="sm" />
            </div>
          </div>
        </header>

        {/* Sub-view Outlet Scrollable */}
        <main className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-slate-950 p-6 text-left">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex flex-col w-full max-w-xs bg-white dark:bg-slate-900 h-full p-4 shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-slate-800 pb-3 mb-4">
              <span className="font-semibold text-zinc-900 dark:text-slate-100 text-sm">Navigation Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-200 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                {sidebarLinks.map(link => (
                  <Link
                    key={link.label}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between text-xs px-3 py-2 rounded-md hover:bg-zinc-50 dark:hover:bg-slate-800 font-medium text-zinc-600 dark:text-slate-300 hover:text-zinc-950 dark:hover:text-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <link.icon className="h-4 w-4 text-zinc-400 dark:text-slate-500" />
                      <span>{link.label}</span>
                    </div>
                    {!!link.badge && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-100 dark:border-slate-800 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <Avatar name={user?.fullName || ''} size="sm" />
                <span className="text-xs font-medium text-zinc-900 dark:text-slate-100 truncate">{user?.fullName}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-zinc-400 dark:text-slate-500 hover:text-zinc-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Workspace Creation Modal Dialog */}
      <Modal 
        isOpen={workspaceModalOpen} 
        onClose={() => setWorkspaceModalOpen(false)} 
        title="Create New Workspace"
      >
        <form onSubmit={handleCreateWorkspace} className="flex flex-col gap-4 text-left">
          <Input
            label="Workspace Name"
            placeholder="e.g. engineering, design, marketing"
            required
            value={newWorkspaceName}
            onChange={e => {
              setNewWorkspaceName(e.target.value);
              setNewWorkspaceSlug(slugify(e.target.value));
            }}
          />
          <Input
            label="Workspace Web Address (Slug)"
            placeholder="e.g. acme-engineering"
            required
            value={newWorkspaceSlug}
            onChange={e => setNewWorkspaceSlug(slugify(e.target.value))}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-slate-400">Description</label>
            <textarea
              aria-label="Description"
              className="flex w-full rounded-md border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-slate-100 placeholder:text-zinc-400 dark:placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
              placeholder="Describe this workspace workspace..."
              value={newWorkspaceDesc}
              onChange={e => setNewWorkspaceDesc(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="cursor-pointer"
              onClick={() => setWorkspaceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="cursor-pointer"
              isLoading={createWorkspaceMutation.isPending}
            >
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </div>
      <style>{`
        @keyframes notifDropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </>
  );
};
export default DashboardLayout;
