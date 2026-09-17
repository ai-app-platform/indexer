import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Play,
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  RotateCcw,
  FolderGit2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useProjectStore, IndexStep } from '../stores/projectStore';
import { mockIndexSteps, mockProjectInfo, mockFileTree } from '../data/mockData';

export function Indexer() {
  const { t } = useTranslation();
  const { isIndexing, setIsIndexing, indexSteps, setIndexSteps, setProjectInfo, setFileTree } =
    useProjectStore();

  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [workspace, setWorkspace] = useState('/home/user/workspace');

  const startIndexing = useCallback(() => {
    setIsIndexing(true);
    setIndexSteps(
      mockIndexSteps.map((step) => ({ ...step, status: 'pending' as const, progress: 0 }))
    );

    // Simulate indexing process
    const steps = [...mockIndexSteps];
    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep >= steps.length) {
        clearInterval(interval);
        setIsIndexing(false);
        setProjectInfo(mockProjectInfo);
        setFileTree(mockFileTree);
        return;
      }

      setIndexSteps((prev) =>
        prev.map((step, idx) => {
          if (idx === currentStep) {
            return { ...step, status: 'running' as const, progress: Math.min(step.progress + 20, 100) };
          }
          if (idx < currentStep) {
            return { ...step, status: 'completed' as const, progress: 100 };
          }
          return step;
        })
      );

      // Check if current step is done
      const currentProgress = (indexSteps[currentStep]?.progress || 0) + 20;
      if (currentProgress >= 100) {
        currentStep++;
      }
    }, 500);
  }, [setIsIndexing, setIndexSteps, setProjectInfo, setFileTree, indexSteps]);

  useEffect(() => {
    if (indexSteps.length === 0) {
      setIndexSteps(mockIndexSteps);
    }
  }, [indexSteps.length, setIndexSteps]);

  const getStepIcon = (step: IndexStep) => {
    switch (step.status) {
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

  const overallProgress =
    indexSteps.length > 0
      ? Math.round(indexSteps.reduce((acc, s) => acc + s.progress, 0) / indexSteps.length)
      : 0;

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
            GitHub Repository Indexing with AI
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
          {isIndexing && (
            <Button variant="danger" onClick={() => setIsIndexing(false)}>
              {t('indexer.cancelIndex')}
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      {isIndexing && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('indexer.progress')}
            </h3>
            <Badge variant={overallProgress === 100 ? 'success' : 'info'}>
              {overallProgress}%
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {indexSteps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                {getStepIcon(step)}
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      step.status === 'completed'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : step.status === 'running'
                        ? 'text-teal-700 dark:text-teal-400'
                        : step.status === 'failed'
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {t(step.label)}
                  </p>
                  {step.status === 'running' && (
                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all duration-300"
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {step.progress}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed State */}
      {!isIndexing && overallProgress === 100 && (
        <div className="card p-6 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                {t('indexer.completed')}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                .ai folder created • 147 files indexed • 38 folders analyzed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button variant="outline" size="sm">
              <RotateCcw className="h-3 w-3" />
              {t('indexer.retry')}
            </Button>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          How it works
        </h3>
        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <p>• <strong>Tree-sitter</strong> parses source files to extract AST structure</p>
          <p>• <strong>JavaParser</strong> (for Java) provides detailed class/method analysis</p>
          <p>• Each file gets a <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">.md</code> documentation with dependencies, imports, methods</p>
          <p>• All data is stored in <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">.ai/</code> folder</p>
          <p>• Output can be converted to JSON for LLM consumption</p>
        </div>
      </div>
    </div>
  );
}
