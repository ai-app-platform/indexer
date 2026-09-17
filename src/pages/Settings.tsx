import { useTranslation } from 'react-i18next';
import { Settings as SettingsIcon, Globe, Palette, Database, Server } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useThemeStore } from '../stores/themeStore';
import { useState } from 'react';

export function Settings() {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useThemeStore();
  const [workspacePath, setWorkspacePath] = useState('/home/user/workspace');
  const [githubToken, setGithubToken] = useState('');
  const [backendUrl, setBackendUrl] = useState('http://localhost:8080');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t('nav.settings')}
        </h1>
      </div>

      {/* General Settings */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Appearance
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('theme.toggle')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isDark ? t('theme.dark') : t('theme.light')}
            </p>
          </div>
          <Button variant={isDark ? 'primary' : 'outline'} onClick={toggleTheme}>
            {isDark ? t('theme.dark') : t('theme.light')}
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Language</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Current: {i18n.language === 'fa' ? 'فارسی' : 'English'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={i18n.language === 'fa' ? 'info' : 'muted'}>FA</Badge>
            <Badge variant={i18n.language === 'en' ? 'info' : 'muted'}>EN</Badge>
          </div>
        </div>
      </div>

      {/* Workspace Settings */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Database className="h-4 w-4" />
          Workspace
        </h3>
        <Input
          label="Workspace Path"
          value={workspacePath}
          onChange={(e) => setWorkspacePath(e.target.value)}
          hint="Directory where projects will be cloned and indexed"
        />
      </div>

      {/* GitHub Settings */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Globe className="h-4 w-4" />
          GitHub Integration
        </h3>
        <Input
          label="GitHub Token"
          type="password"
          value={githubToken}
          onChange={(e) => setGithubToken(e.target.value)}
          placeholder="ghp_xxxxxxxxxxxx"
          hint="Personal access token for GitHub API access"
        />
      </div>

      {/* Backend Settings */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Server className="h-4 w-4" />
          Backend Connection
        </h3>
        <Input
          label="Backend URL"
          value={backendUrl}
          onChange={(e) => setBackendUrl(e.target.value)}
          hint="Spring Boot backend API endpoint"
        />
        <div className="flex items-center gap-2">
          <Badge variant="success">Connected</Badge>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Spring Boot 4.1 • Java 21
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary">
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}
