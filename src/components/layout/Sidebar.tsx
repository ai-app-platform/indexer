import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  FolderTree,
  MessageSquare,
  GitBranch,
  Settings,
  X,
  Code2,
  Network,
  Filter,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/indexer', icon: Search, labelKey: 'nav.indexer' },
  { path: '/explorer', icon: FolderTree, labelKey: 'nav.explorer' },
  { path: '/graph', icon: Network, labelKey: 'nav.graph' },
  { path: '/search', icon: Filter, labelKey: 'nav.search' },
  { path: '/chat', icon: MessageSquare, labelKey: 'nav.chat' },
  { path: '/branches', icon: GitBranch, labelKey: 'nav.branches' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 end-0 z-50 h-full w-72 bg-white dark:bg-slate-900 border-s border-slate-200 dark:border-slate-700 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-teal-600 text-white">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">AI Indexer</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">v1.0.0</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden !p-1.5">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User box */}
        <div className="mx-4 mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <span className="text-sm font-bold text-teal-700 dark:text-teal-400">DV</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Developer</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Workspace</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'sidebar-link',
                  isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{t(item.labelKey)}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-center text-slate-400 dark:text-slate-500">
            © 2025 AI Code Indexer
          </p>
        </div>
      </aside>
    </>
  );
}
