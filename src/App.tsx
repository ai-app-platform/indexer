import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useThemeStore } from './stores/themeStore';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Indexer } from './pages/Indexer';
import { FileExplorer } from './pages/FileExplorer';
import { Chat } from './pages/Chat';
import { BranchManagement } from './pages/BranchManagement';
import { Settings } from './pages/Settings';
import './i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/indexer" element={<Indexer />} />
              <Route path="/explorer" element={<FileExplorer />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/branches" element={<BranchManagement />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
