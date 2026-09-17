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
  Code2,
  Network,
  Puzzle,
  Database,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useProjectStore } from '../stores/projectStore';
import { useEffect, useState } from 'react';
import { formatDate, toPersianNumber } from '../lib/utils';
import { MOCK_JAVA_FILES, MOCK_PROJECT_CONFIG } from '../data/mockIndexData';
import { IndexingPipeline, InMemoryIndexStore, CodeSearch } from '../core/indexer';
import type { IndexJob, CodebaseSnapshot, Language } from '../types/code-index';

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<CodebaseSnapshot | null>(null);
  const [lastJob, setLastJob] = useState<IndexJob | null>(null);
  const [isIndexed, setIsIndexed] = useState(false);

  useEffect(() => {
    loadIndexData();
  }, []);

  const loadIndexData = async () => {
    const store = new InMemoryIndexStore();
    const pipeline = new IndexingPipeline(MOCK_PROJECT_CONFIG, store);
    
    // Check if already indexed
    const existingIndex = await store.getIndex(MOCK_PROJECT_CONFIG.projectId, MOCK_PROJECT_CONFIG.branch);
    if (existingIndex) {
      const snap = await store.getSnapshot(MOCK_PROJECT_CONFIG.projectId, MOCK_PROJECT_CONFIG.branch);
      setSnapshot(snap);
      setIsIndexed(true);
      const jobs = await store.getJobsByProject(MOCK_PROJECT_CONFIG.projectId);
      if (jobs.length > 0) setLastJob(jobs[jobs.length - 1]);
    }
  };

  const languageLabels: Record<string, string> = {
    JAVA: 'Java',
    KOTLIN: 'Kotlin',
    TYPESCRIPT: 'TypeScript',
    JAVASCRIPT: 'JavaScript',
    PYTHON: 'Python',
    GO: 'Go',
    RUST: 'Rust',
    UNKNOWN: 'Unknown',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('dashboard.welcome')} — dental-lab-backend
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
          value={toPersianNumber(snapshot?.statistics.files || 0)}
        />
        <StatCard
          icon={<Puzzle className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          label="Symbols"
          value={toPersianNumber(snapshot?.statistics.symbols || 0)}
        />
        <StatCard
          icon={<Network className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
          label="Relationships"
          value={toPersianNumber(snapshot?.statistics.relationships || 0)}
        />
        <StatCard
          icon={<Database className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          label="Chunks"
          value={toPersianNumber(snapshot?.statistics.chunks || 0)}
        />
      </div>

      {/* Language Distribution */}
      {snapshot && Object.keys(snapshot.languages).length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Language Distribution
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(snapshot.languages).map(([lang, count]) => (
              <Badge key={lang} variant="info">
                {languageLabels[lang] || lang}: {toPersianNumber(count)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Index Status */}
      {lastJob && (
        <div className={`card p-5 ${
          lastJob.status === 'COMPLETED' 
            ? 'border-emerald-200 dark:border-emerald-800' 
            : lastJob.status === 'COMPLETED_WITH_WARNINGS'
            ? 'border-amber-200 dark:border-amber-800'
            : 'border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {lastJob.status === 'COMPLETED' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : lastJob.status === 'COMPLETED_WITH_WARNINGS' ? (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Last Index: {lastJob.status}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mode: {lastJob.mode} • Parser: {lastJob.parserVersion} • Index v{lastJob.indexVersion}
                </p>
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {lastJob.completedAt && formatDate(lastJob.completedAt, i18n.language)}
            </div>
          </div>
          
          {/* Progress details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {toPersianNumber(lastJob.progress.filesParsed)}
              </p>
              <p className="text-xs text-slate-500">Files Parsed</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {toPersianNumber(lastJob.progress.symbolsExtracted)}
              </p>
              <p className="text-xs text-slate-500">Symbols</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {toPersianNumber(lastJob.progress.relationshipsExtracted)}
              </p>
              <p className="text-xs text-slate-500">Relations</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {toPersianNumber(lastJob.errors.length)}
              </p>
              <p className="text-xs text-slate-500">Errors</p>
            </div>
          </div>
        </div>
      )}

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

      {/* Architecture Info */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Code Indexer Architecture
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Phase 1: Discovery</p>
            <p className="text-slate-500 dark:text-slate-400">File walking, language detection, filtering</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Phase 2: Parsing</p>
            <p className="text-slate-500 dark:text-slate-400">AST extraction, symbol extraction, references</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Phase 3: Analysis</p>
            <p className="text-slate-500 dark:text-slate-400">Dependencies, call graph, chunking</p>
          </div>
        </div>
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
