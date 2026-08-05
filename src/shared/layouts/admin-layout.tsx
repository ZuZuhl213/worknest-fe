import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../../features/auth/auth-context';
import Avatar from '../components/avatar';
import Button from '../components/button';
import ThemeToggle from '../theme/theme-toggle';

const links = [
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Security audit', path: '/admin/security-audit-logs', icon: ClipboardList },
];

export const AdminLayout: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-zinc-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/admin" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white"><ShieldCheck className="h-4 w-4" /></span>
            <span>WorkNest Admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-zinc-500 sm:block">{user?.email}</span>
            <Avatar name={user?.fullName ?? 'Admin'} url={user?.avatarUrl} size="sm" />
            <ThemeToggle variant="dropdown" />
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5"><LogOut className="h-3.5 w-3.5" />Sign out</Button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto md:w-48 md:flex-col" aria-label="Admin navigation">
          <Link to="/admin" className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${location.pathname === '/admin' ? 'bg-indigo-600 text-white' : 'text-zinc-600 hover:bg-zinc-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}><LayoutDashboard className="h-4 w-4" />Overview</Link>
          {links.map(({ label, path, icon: Icon }) => (
            <Link key={path} to={path} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${location.pathname.startsWith(path) ? 'bg-indigo-600 text-white' : 'text-zinc-600 hover:bg-zinc-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}><Icon className="h-4 w-4" />{label}</Link>
          ))}
        </nav>
        <main className="min-w-0 flex-1"><Outlet /></main>
      </div>
    </div>
  );
};

export default AdminLayout;
