import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Bell,
  User,
  Plus,
  ArrowRight,
  Command,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions';
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const activeWorkspaceId = workspaceId ? parseInt(workspaceId, 10) : undefined;

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Define commands list
  const commands: CommandItem[] = [
    {
      id: 'nav-workspaces',
      title: 'Go to Workspaces Directory',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => navigate('/workspaces'),
    },
    ...(activeWorkspaceId
      ? [
          {
            id: 'nav-dashboard',
            title: `Go to Workspace #${activeWorkspaceId} Dashboard`,
            category: 'Navigation' as const,
            icon: LayoutDashboard,
            action: () => navigate(`/workspaces/${activeWorkspaceId}/dashboard`),
          },
          {
            id: 'nav-projects',
            title: 'Go to Projects Directory',
            category: 'Navigation' as const,
            icon: FolderKanban,
            action: () => navigate(`/workspaces/${activeWorkspaceId}/projects`),
          },
          {
            id: 'nav-tasks',
            title: 'Go to My Tasks',
            category: 'Navigation' as const,
            icon: CheckSquare,
            action: () => navigate(`/workspaces/${activeWorkspaceId}/tasks`),
          },
          {
            id: 'nav-notifs',
            title: 'Go to Notifications Feed',
            category: 'Navigation' as const,
            icon: Bell,
            action: () => navigate(`/workspaces/${activeWorkspaceId}/notifications`),
          },
          {
            id: 'nav-profile',
            title: 'Go to User Profile',
            category: 'Navigation' as const,
            icon: User,
            action: () => navigate(`/workspaces/${activeWorkspaceId}/profile`),
          },
        ]
      : []),
    {
      id: 'act-new-workspace',
      title: 'Create New Workspace',
      category: 'Actions',
      icon: Plus,
      action: () => navigate('/workspaces'),
    },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase().trim())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) {
        onClose();
        selected.action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 shadow-2xl rounded-xl max-w-xl w-full z-10 flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100"
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-slate-800">
          <Search className="h-4 w-4 text-zinc-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            aria-label="Type a command or search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm font-medium text-zinc-900 dark:text-slate-100 placeholder:text-zinc-400 dark:placeholder:text-slate-400 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-zinc-400 dark:text-slate-400 bg-zinc-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-slate-700">
            <Command className="h-3 w-3" /> K
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2 flex flex-col gap-1 text-left">
          {filteredCommands.map((cmd, idx) => {
            const Icon = cmd.icon;
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={cmd.id}
                onClick={() => {
                  onClose();
                  cmd.action();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  isSelected ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold' : 'text-zinc-700 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-slate-500'}`} aria-hidden="true" />
                  <span>{cmd.title}</span>
                </div>
                {isSelected && <ArrowRight className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />}
              </div>
            );
          })}

          {filteredCommands.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-400 dark:text-slate-400 italic">
              No commands found matching "{query}"
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="border-t border-zinc-100 dark:border-slate-800 px-4 py-2 bg-zinc-50/50 dark:bg-slate-950/50 flex items-center justify-between text-[10px] text-zinc-400 dark:text-slate-400">
          <span>Navigation: <kbd className="font-mono bg-white dark:bg-slate-800 px-1 border dark:border-slate-700 rounded">↑</kbd> <kbd className="font-mono bg-white dark:bg-slate-800 px-1 border dark:border-slate-700 rounded">↓</kbd></span>
          <span>Select: <kbd className="font-mono bg-white dark:bg-slate-800 px-1 border dark:border-slate-700 rounded">Enter</kbd></span>
          <span>Close: <kbd className="font-mono bg-white dark:bg-slate-800 px-1 border dark:border-slate-700 rounded">Esc</kbd></span>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CommandPalette;
