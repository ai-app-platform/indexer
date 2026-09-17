import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FolderOpen,
  Layers,
  GitBranch,
  Search,
  FolderTree,
  MessageSquare,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useProjectStore } from '../stores/projectStore';
import { mockProjectInfo, mockFileTree, mockIndexSteps, mockBranches } from '../data/mockData';
import { useEffect } from 'react';
import { formatDate, toPersianNumber } from '../lib/utils';

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { projectInfo, setProjectInfo, setFileTree, setIndexSteps } = useProjectStore();

  useEffect(() => {
    if (!projectInfo) {
      setProjectInfo(mockProjectInfo);
      setFileTree(mockFileTree);
      setIndexSteps(mockIndexSteps);
    }
  }, [projectInfo, setProjectInfo, setFileTree, setIndexSteps]);

  const info = projectInfo || mockProjectInfo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('dashboard.welcome')} — {info.name}
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/indexer')}>
          <Search className="h-4 w-4" />
          {t('dashboard.startIndex')}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
          label={t('dashboard.totalFiles')}
          value={toPersianNumber(info.totalFiles)}
        />
        <StatCard
          icon={<FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          label={t('dashboard.totalFolders')}
          value={toPersianNumber(info.totalFolders)}
        />
        <StatCard
          icon={<Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
          label={t('dashboard.projectStack')}
          value="Java 21"
        />
        <StatCard
          icon={<GitBranch className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          label={t('dashboard.projectVersion')}
          value={info.version}
        />
      </div>

      {/* Stack Badges */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          {t('dashboard.projectStack')}
        </h3>
        <div className="flex flex-wrap gap-2">
          {info.stack.map((tech) => (
            <Badge key={tech} variant="info">
              {tech}
            </Badge>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          {t('dashboard.quickActions')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ActionButton
            icon={<Search className="h-5 w-5" />}
            label={t('dashboard.startIndex')}
            onClick={() => navigate('/indexer')}
          />
          <ActionButton
            icon={<FolderTree className="h-5 w-5" />}
            label={t('dashboard.viewExplorer')}
            onClick={() => navigate('/explorer')}
          />
          <ActionButton
            icon={<MessageSquare className="h-5 w-5" />}
            label={t('dashboard.openChat')}
            onClick={() => navigate('/chat')}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          {t('dashboard.recentActivity')}
        </h3>
        <div className="space-y-3">
          {mockBranches.map((branch) => (
            <div
              key={branch.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <GitBranch className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {branch.name}
                </span>
                {branch.isCurrent && <Badge variant="success">Active</Badge>}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Clock className="h-3 w-3" />
                <span>{formatDate(branch.lastUpdated, i18n.language)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Index Info */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Clock className="h-3 w-3" />
        <span>
          {t('dashboard.lastIndex')}: {formatDate(info.lastIndex, i18n.language)}
        </span>
        <ArrowLeft className="h-3 w-3 rotate-180" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200 text-start"
    >
      <span className="text-teal-600 dark:text-teal-400">{icon}</span>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </button>
  );
}
