import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { Button } from '../ui/Button';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center h-16 px-4 lg:hidden border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="!p-2">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
