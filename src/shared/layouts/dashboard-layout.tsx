import React, { useState, useRef, useEffect } from 'react';
import { Navigate, Outlet, useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { getApiErrorMessage } from '../api/client';
import { Workspace, Project, Notification } from '../../types';
import Avatar from '../components/avatar';
import Button from '../components/button';
import Input from '../components/input';
import Modal from '../components/modal';
import { useToast } from '../components/toast';
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
  Inbox
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceSlug, setNewWorkspaceSlug] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

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
    queryKey: ['workspaces'],
    queryFn: () => apiClient.get('/api/workspaces').then(res => res.data),
    enabled: isAuthenticated,
  });

  // 2. Fetch projects for active workspace
  const activeWorkspaceId = workspaceId ? parseInt(workspaceId) : undefined;
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ['projects', activeWorkspaceId],
    queryFn: () => apiClient.get(`/api/workspaces/${activeWorkspaceId}/projects`).then(res => res.data),
    enabled: !!activeWorkspaceId && isAuthenticated,
  });

  // 3. Fetch notifications count
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/api/notifications').then(res => res.data),
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  // Mark single notification as read
  const readNotifMutation = useMutation({
    mutationFn: (id: number) =>
      apiClient.patch<Notification>(`/api/notifications/${id}/read`).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Mark all as read
  const readAllNotifMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => apiClient.patch(`/api/notifications/${n.id}/read`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast('All notifications marked as read', 'success');
    },
  });

  // Create workspace mutation
  const createWorkspaceMutation = useMutation({
    mutationFn: (data: { name: string; slug: string; description: string }) => 
      apiClient.post<Workspace>('/api/workspaces', data).then(res => res.data),
    onSuccess: (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
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
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50">
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
    <div className="flex h-screen w-screen bg-zinc-50/50 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-60 shrink-0 border-r border-zinc-200 bg-white">
        {/* Workspace Switcher Header */}
        <div className="relative border-b border-zinc-100 px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 rounded-md p-1.5 w-full text-left justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="w-6 h-6 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                <Building2 className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <span className="truncate">{activeWorkspace ? activeWorkspace.name : 'Select Workspace'}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
          </button>

          {/* Switcher Dropdown */}
          {showWorkspaceDropdown && (
            <div className="absolute top-13 left-4 right-4 z-50 bg-white border border-zinc-200 rounded-md shadow-lg p-1 flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-zinc-400 px-2 py-1 select-none">SWITCH WORKSPACE</span>
              <div className="max-h-40 overflow-y-auto flex flex-col">
                {workspaces.map(w => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setShowWorkspaceDropdown(false);
                      navigate(`/workspaces/${w.id}/dashboard`);
                    }}
                    className={`flex items-center text-xs px-2.5 py-1.5 rounded-md hover:bg-zinc-50 text-left cursor-pointer truncate ${w.id === activeWorkspaceId ? 'font-medium bg-zinc-50 text-indigo-600' : 'text-zinc-700'}`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
              <div className="border-t border-zinc-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    setShowWorkspaceDropdown(false);
                    setWorkspaceModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1.5 rounded-md hover:bg-indigo-50/30 w-full text-left cursor-pointer"
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
                className={`flex items-center justify-between text-xs px-3 py-2 rounded-md hover:bg-zinc-50 font-medium transition-colors ${
                  isActive ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`} />
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
                      className={`text-xs px-2 py-1.5 rounded-md hover:bg-zinc-50 transition-colors block truncate ${
                        isActive ? 'font-medium bg-zinc-50 text-indigo-600' : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      # {proj.name}
                    </Link>
                  );
                })}
                {projects.length === 0 && (
                  <span className="text-[10px] text-zinc-400 italic px-2">No projects created yet</span>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* User Footer Profile */}
        <div className="border-t border-zinc-100 p-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <Avatar name={user?.fullName || ''} size="sm" />
            <div className="flex flex-col text-left truncate">
              <span className="text-xs font-semibold text-zinc-900 truncate">{user?.fullName}</span>
              <span className="text-[10px] text-zinc-500 truncate">{user?.email}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            title="Log Out"
            className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md hover:bg-zinc-50 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Top bar header */}
        <header className="h-14 border-b border-zinc-200 bg-white flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle Button */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-zinc-500 hover:text-zinc-800 p-1 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-xs font-medium text-zinc-400 select-none">
              WorkNest
            </span>
          </div>

          <div className="flex items-center gap-4">
          <div className="relative flex items-center" ref={notifDropdownRef}>
              <button
                onClick={() => setShowNotifDropdown(v => !v)}
                className="relative p-1.5 rounded-full hover:bg-zinc-50 text-zinc-400 hover:text-zinc-700 cursor-pointer transition-colors"
                title="Notifications"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500 ring-1 ring-white" />
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 flex flex-col overflow-hidden"
                  style={{ animation: 'notifDropIn 0.15s cubic-bezier(0.16,1,0.3,1)' }}
                >
                  {/* Dropdown header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <Inbox className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm font-semibold text-zinc-900">Notifications</span>
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
                        className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer disabled:opacity-50"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notification list */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-400">
                        <Bell className="h-8 w-8 opacity-30" />
                        <span className="text-xs italic">All caught up! No notifications.</span>
                      </div>
                    ) : (
                      notifications.slice(0, 20).map(notif => (
                        <div
                          key={notif.id}
                          className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                            !notif.read
                              ? 'bg-indigo-50/40 border-l-2 border-indigo-500'
                              : 'bg-white border-l-2 border-transparent'
                          }`}
                        >
                          {/* Unread dot */}
                          <div className="mt-1 shrink-0">
                            <span className={`block w-2 h-2 rounded-full ${
                              !notif.read ? 'bg-indigo-500' : 'bg-zinc-200'
                            }`} />
                          </div>
                          <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                            <p className={`text-xs font-semibold leading-snug ${
                              !notif.read ? 'text-zinc-900' : 'text-zinc-600'
                            }`}>{notif.title}</p>
                            <p className="text-[11px] text-zinc-500 leading-snug line-clamp-2">{notif.content}</p>
                            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-zinc-400">
                              <Clock className="h-3 w-3" />
                              {new Date(notif.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                          </div>
                          {!notif.read && (
                            <button
                              onClick={() => readNotifMutation.mutate(notif.id)}
                              disabled={readNotifMutation.isPending && readNotifMutation.variables === notif.id}
                              className="shrink-0 p-1 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 rounded cursor-pointer transition-colors"
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
                    <div className="border-t border-zinc-100 px-4 py-2.5">
                      <Link
                        to={`/workspaces/${activeWorkspaceId}/notifications`}
                        onClick={() => setShowNotifDropdown(false)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center justify-center gap-1"
                      >
                        View all notifications →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs font-medium text-zinc-700">{user?.fullName}</span>
              <Avatar name={user?.fullName || ''} size="sm" />
            </div>
          </div>
        </header>

        {/* Sub-view Outlet Scrollable */}
        <main className="flex-1 overflow-y-auto bg-zinc-50/50 p-6 text-left">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex flex-col w-full max-w-xs bg-white h-full p-4 shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <span className="font-semibold text-zinc-900 text-sm">Navigation Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
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
                    className="flex items-center justify-between text-xs px-3 py-2 rounded-md hover:bg-zinc-50 font-medium text-zinc-600 hover:text-zinc-950"
                  >
                    <div className="flex items-center gap-2">
                      <link.icon className="h-4 w-4 text-zinc-400" />
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

            <div className="border-t border-zinc-100 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <Avatar name={user?.fullName || ''} size="sm" />
                <span className="text-xs font-medium text-zinc-900 truncate">{user?.fullName}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
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
            <label className="text-xs font-medium text-zinc-500">Description</label>
            <textarea
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
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
