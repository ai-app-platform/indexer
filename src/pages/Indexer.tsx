import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Play,
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  RotateCcw,
  FolderGit2,
  AlertTriangle,
  FileText,
  Puzzle,
  Network,
  Database,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useProjectStore } from '../stores/projectStore';
import { MOCK_JAVA_FILES, MOCK_PROJECT_CONFIG } from '../data/mockIndexData';
import { IndexingPipeline, InMemoryIndexStore } from '../core/indexer';
import type { IndexJob, IndexJobStatus } from '../types/code-index';
import { toPersianNumber } from '../lib/utils';

const INDEX_STEPS = [
  { id: 1, label: 'File Discovery', key: 'filesDiscovered' },
  { id: 2, label: 'Parsing & AST Extraction', key: 'filesParsed' },
  { id: 3, label: 'Symbol Extraction', key: 'symbolsExtracted' },
  { id: 4, label: 'Relationship Analysis', key: 'relationshipsExtracted' },
  { id: 5, label: 'Code Chunking', key: 'chunksCreated' },
  { id: 6, label: 'Dependency Resolution', key: 'dependenciesResolved' },
];

export function Indexer() {
  const { t } = useTranslation();
  const [repoUrl, setRepoUrl] = useState('https://github.com/example/dental-lab-backend');
  const [branch, setBranch] = useState('main');
  const [workspace, setWorkspace] = useState('/home/user/workspace');
  const [isIndexing, setIsIndexing] = useState(false);
  const [currentJob, setCurrentJob] = useState<IndexJob | null>(null);
  const [indexStore] = useState(() => new InMemoryIndexStore());

  const startIndexing = useCallback(async () => {
    setIsIndexing(true);
    
    const pipeline = new IndexingPipeline({
      ...MOCK_PROJECT_CONFIG,
      branch,
    }, indexStore);

    // Simulate step-by-step progress
    const mockJob: IndexJob = {
      id: `job-${Date.now()}`,
      projectId: MOCK_PROJECT_CONFIG.projectId,
      repositoryId: MOCK_PROJECT_CONFIG.repositoryId,
      branch,
      commitSha: MOCK_PROJECT_CONFIG.commitSha,
      mode: 'FULL',
      status: 'RUNNING',
      progress: {
        filesDiscovered: 0,
        filesParsed: 0,
        filesFailed: 0,
        symbolsExtracted: 0,
        relationshipsExtracted: 0,
        chunksCreated: 0,
        dependenciesResolved: 0,
      },
      startedAt: new Date().toISOString(),
      errors: [],
      indexerVersion: '1.0.0',
      parserVersion: '1.0.0',
      indexVersion: 1,
    };

    setCurrentJob(mockJob);

    // Run the actual indexing pipeline
    const result = await pipeline.fullIndex(MOCK_JAVA_FILES);
    setCurrentJob(result);
    setIsIndexing(false);
  }, [branch, indexStore]);

  const getStepStatus = (stepIndex: number): 'pending' | 'running' | 'completed' | 'failed' => {
    if (!currentJob) return 'pending';
    
    const progress = currentJob.progress;
    const step = INDEX_STEPS[stepIndex];
    const value = progress[step.key as keyof typeof progress];
    
    if (currentJob.status === 'FAILED') return 'failed';
    if (value > 0) return 'completed';
    
    // Check if this is the current step
    const prevStep = stepIndex > 0 ? INDEX_STEPS[stepIndex - 1] : null;
    if (prevStep && progress[prevStep.key as keyof typeof progress] > 0) return 'running';
    if (stepIndex === 0 && currentJob.status !== 'PENDING') return 'running';
    
    return 'pending';
  };

  const getStepIcon = (status: 'pending' | 'running' | 'completed' | 'failed') => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-teal-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />;
    }
  };

  const overallProgress = currentJob ? Math.round(
    (Object.values(currentJob.progress).reduce((a, b) => a + b, 0) / 
     (INDEX_STEPS.length * MOCK_JAVA_FILES.length * 3)) * 100
  ) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('indexer.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            <FolderGit2 className="h-4 w-4 inline-block me-1" />
            Tree-sitter + JavaParser Code Analysis
          </p>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('indexer.repoUrl')}
            placeholder={t('indexer.repoPlaceholder')}
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={isIndexing}
          />
          <Input
            label={t('indexer.branch')}
            placeholder={t('indexer.branchPlaceholder')}
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            disabled={isIndexing}
          />
        </div>
        <Input
          label={t('indexer.workspace')}
          placeholder={t('indexer.workspacePlaceholder')}
          value={workspace}
          onChange={(e) => setWorkspace(e.target.value)}
          disabled={isIndexing}
        />

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="primary"
            onClick={startIndexing}
            disabled={isIndexing || !repoUrl}
            loading={isIndexing}
          >
            <Play className="h-4 w-4" />
            {isIndexing ? t('indexer.indexing') : t('indexer.startIndex')}
          </Button>
        </div>
      </div>

      {/* Progress */}
      {currentJob && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('indexer.progress')} — {currentJob.mode}
            </h3>
            <Badge variant={
              currentJob.status === 'COMPLETED' ? 'success' :
              currentJob.status === 'COMPLETED_WITH_WARNINGS' ? 'warning' :
              currentJob.status === 'FAILED' ? 'danger' : 'info'
            }>
              {currentJob.status}
            </Badge>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-6">
            {INDEX_STEPS.map((step, idx) => {
              const status = getStepStatus(idx);
              const value = currentJob.progress[step.key as keyof typeof currentJob.progress];
              return (
                <div key={step.id} className="flex items-center gap-3">
                  {getStepIcon(status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        status === 'completed' ? 'text-emerald-700 dark:text-emerald-400' :
                        status === 'running' ? 'text-teal-700 dark:text-teal-400' :
                        status === 'failed' ? 'text-red-700 dark:text-red-400' :
                        'text-slate-500 dark:text-slate-400'
                      }`}>
                        {step.label}
                      </p>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {toPersianNumber(value)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {toPersianNumber(currentJob.progress.filesParsed)}
              </p>
              <p className="text-xs text-slate-500">Files</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <Puzzle className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {toPersianNumber(currentJob.progress.symbolsExtracted)}
              </p>
              <p className="text-xs text-slate-500">Symbols</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <Network className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {toPersianNumber(currentJob.progress.relationshipsExtracted)}
              </p>
              <p className="text-xs text-slate-500">Relations</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <Database className="h-5 w-5 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {toPersianNumber(currentJob.progress.chunksCreated)}
              </p>
              <p className="text-xs text-slate-500">Chunks</p>
            </div>
          </div>

          {/* Errors */}
          {currentJob.errors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {toPersianNumber(currentJob.errors.length)} parse errors
                </p>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {currentJob.errors.map((err, idx) => (
                  <p key={idx} className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {err.filePath}: {err.message}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Card */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Indexing Pipeline
        </h3>
        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <p>• <strong>File Discovery:</strong> Walk repository, detect languages, filter files</p>
          <p>• <strong>Parsing:</strong> JavaParser for Java, Tree-sitter for others, fallback to text-based</p>
          <p>• <strong>Symbol Extraction:</strong> Classes, methods, fields, annotations with stable IDs</p>
          <p>• <strong>Relationship Analysis:</strong> Calls, imports, inheritance, implementations</p>
          <p>• <strong>Dependency Analysis:</strong> Module/package/class level dependencies + cycle detection</p>
          <p>• <strong>Code Chunking:</strong> Structure-aware chunking for RAG/Vector indexing</p>
          <p>• <strong>Incremental:</strong> Git diff-based re-indexing for changed files only</p>
        </div>
      </div>
    </div>
  );
}
