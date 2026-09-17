import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GitBranch,
  Plus,
  Upload,
  RefreshCw,
  CheckCircle2,
  Clock,
  GitCommit,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { useProjectStore, Branch } from '../stores/projectStore';
import { mockBranches } from '../data/mockData';
import { formatDate, generateId } from '../lib/utils';
import { useEffect } from 'react';

export function BranchManagement() {
  const { t, i18n } = useTranslation();
  const { branches, currentBranch, addBranch, setCurrentBranch } = useProjectStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [pushSuccess, setPushSuccess] = useState(false);

  useEffect(() => {
    if (branches.length === 0) {
      mockBranches.forEach((b) => addBranch(b));
      setCurrentBranch(mockBranches[0]);
    }
  }, [branches.length, addBranch, setCurrentBranch]);

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;
    const branch: Branch = {
      id: generateId(),
      name: newBranchName.trim(),
      isCurrent: false,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      commitCount: 0,
    };
    addBranch(branch);
    setNewBranchName('');
    setShowCreateModal(false);
  };

  const handlePush = () => {
    setPushSuccess(true);
    setTimeout(() => {
      setPushSuccess(false);
      setShowPushModal(false);
      setCommitMessage('');
    }, 2000);
  };

  const handleUpdateBranch = () => {
    // Simulate update
    alert('Branch updated with latest changes from remote');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('branches.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('branches.currentBranch')}: <Badge variant="success">{currentBranch?.name || 'main'}</Badge>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPushModal(true)}>
            <Upload className="h-4 w-4" />
            {t('branches.pushChanges')}
          </Button>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            {t('branches.createBranch')}
          </Button>
        </div>
      </div>

      {/* Branch List */}
      {branches.length > 0 ? (
        <div className="space-y-3">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="card p-4 flex items-center justify-between hover:border-teal-300 dark:hover:border-teal-700 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <GitBranch className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {branch.name}
                    </span>
                    {branch.isCurrent && <Badge variant="success">Active</Badge>}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <GitCommit className="h-3 w-3" />
                      {branch.commitCount} commits
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(branch.lastUpdated, i18n.language)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!branch.isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentBranch(branch)}
                  >
                    Switch
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUpdateBranch}
                  className="!p-2"
                  title={t('branches.updateBranch')}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                {!branch.isCurrent && (
                  <Button variant="ghost" size="sm" className="!p-2 text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('branches.noBranch')}
          description={t('branches.createFirst')}
          icon={<GitBranch className="h-12 w-12" />}
          action={{
            label: t('branches.createBranch'),
            onClick: () => setShowCreateModal(true),
          }}
        />
      )}

      {/* Create Branch Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('branches.createBranch')}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleCreateBranch} disabled={!newBranchName.trim()}>
              <Plus className="h-4 w-4" />
              {t('common.confirm')}
            </Button>
          </>
        }
      >
        <Input
          label={t('branches.branchName')}
          placeholder={t('branches.branchNamePlaceholder')}
          value={newBranchName}
          onChange={(e) => setNewBranchName(e.target.value)}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Branch will be created from current branch ({currentBranch?.name || 'main'})
        </p>
      </Modal>

      {/* Push Modal */}
      <Modal
        isOpen={showPushModal}
        onClose={() => { setShowPushModal(false); setPushSuccess(false); }}
        title={t('branches.pushChanges')}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowPushModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handlePush} disabled={!commitMessage.trim()}>
              <Upload className="h-4 w-4" />
              {t('branches.pushChanges')}
            </Button>
          </>
        }
      >
        {pushSuccess ? (
          <div className="flex items-center gap-3 py-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {t('branches.pushSuccess')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label={t('branches.commitMessage')}
              placeholder={t('branches.commitPlaceholder')}
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
            />
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <strong>Target:</strong> {currentBranch?.name || 'main'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                <strong>Changes:</strong> .ai/ folder contents (indexed documentation)
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
