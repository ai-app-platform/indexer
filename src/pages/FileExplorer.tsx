import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronLeft,
  ChevronDown,
  Code2,
  Braces,
  Copy,
  Check,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { useProjectStore, FileNode } from '../stores/projectStore';
import { mockFileTree, mockProjectInfo, mdToJson } from '../data/mockData';
import { cn } from '../lib/utils';
import { useEffect } from 'react';

export function FileExplorer() {
  const { t } = useTranslation();
  const { fileTree, setFileTree, selectedFile, setSelectedFile, projectInfo, setProjectInfo } =
    useProjectStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'markdown' | 'json'>('markdown');
  const [copied, setCopied] = useState(false);
  const [allExpanded, setAllExpanded] = useState(true);
  const [localTree, setLocalTree] = useState<FileNode[]>([]);

  useEffect(() => {
    if (fileTree.length === 0) {
      setFileTree(mockFileTree);
    }
    if (!projectInfo) {
      setProjectInfo(mockProjectInfo);
    }
  }, [fileTree.length, projectInfo, setFileTree, setProjectInfo]);

  useEffect(() => {
    if (fileTree.length > 0 && localTree.length === 0) {
      setLocalTree(fileTree);
    }
  }, [fileTree, localTree.length]);

  const info = projectInfo || mockProjectInfo;

  const filteredTree = useMemo(() => {
    if (!searchQuery) return localTree;
    return filterTree(localTree, searchQuery.toLowerCase());
  }, [localTree, searchQuery]);

  const handleCopy = () => {
    if (selectedFile?.content) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleExpandAll = () => {
    const newState = !allExpanded;
    setAllExpanded(newState);
    const newTree = toggleAllNodes(localTree, newState);
    setLocalTree(newTree);
  };

  const handleToggleNode = (id: string) => {
    setLocalTree(toggleNode(localTree, id));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('explorer.title')}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="info">{info.totalFiles} {t('explorer.files')}</Badge>
            <Badge variant="muted">{info.totalFolders} {t('explorer.folders')}</Badge>
            <Badge variant="success">{info.language}</Badge>
            <Badge variant="warning">v{info.version}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[600px]">
        {/* File Tree */}
        <div className="card p-4 lg:col-span-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Input
              placeholder={t('explorer.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="!py-2 text-xs"
            />
            <Button variant="ghost" size="sm" onClick={toggleExpandAll} className="!p-2 flex-shrink-0">
              {allExpanded ? (
                <ChevronsDownUp className="h-4 w-4" />
              ) : (
                <ChevronsUpDown className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {filteredTree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                selectedFile={selectedFile}
                onSelect={setSelectedFile}
                onToggle={handleToggleNode}
              />
            ))}
          </div>
        </div>

        {/* File Content */}
        <div className="card p-4 lg:col-span-2 flex flex-col">
          {selectedFile ? (
            <>
              {/* File header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {selectedFile.path}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'markdown' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('markdown')}
                  >
                    <Code2 className="h-3 w-3" />
                    {t('explorer.viewMarkdown')}
                  </Button>
                  <Button
                    variant={viewMode === 'json' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('json')}
                  >
                    <Braces className="h-3 w-3" />
                    {t('explorer.viewJson')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="!p-2">
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {viewMode === 'markdown' ? (
                  <pre className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    {selectedFile.content}
                  </pre>
                ) : (
                  <pre className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono p-4 bg-slate-50 dark:bg-slate-800 rounded-lg" dir="ltr">
                    {JSON.stringify(mdToJson(selectedFile.content || ''), null, 2)}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              title={t('explorer.noFileSelected')}
              description={t('explorer.selectFileHint')}
              icon={<FileText className="h-12 w-12" />}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  selectedFile,
  onSelect,
  onToggle,
}: {
  node: FileNode;
  depth: number;
  selectedFile: FileNode | null;
  onSelect: (file: FileNode) => void;
  onToggle: (id: string) => void;
}) {
  const isSelected = selectedFile?.id === node.id;
  const isFolder = node.type === 'folder';
  const isExpanded = node.expanded;

  return (
    <div>
      <button
        onClick={() => {
          if (isFolder) {
            onToggle(node.id);
          } else {
            onSelect(node);
          }
        }}
        className={cn(
          'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors text-start',
          isSelected
            ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
        )}
        style={{ paddingInlineStart: `${depth * 16 + 8}px` }}
      >
        {isFolder ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 flex-shrink-0" />
            ) : (
              <ChevronLeft className="h-3 w-3 flex-shrink-0 rotate-180" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-amber-500 flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-amber-500 flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" />
            <FileText className="h-4 w-4 text-teal-500 flex-shrink-0" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>

      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function filterTree(nodes: FileNode[], query: string): FileNode[] {
  return nodes.reduce<FileNode[]>((acc, node) => {
    if (node.name.toLowerCase().includes(query)) {
      acc.push({ ...node, expanded: true });
    } else if (node.children) {
      const filteredChildren = filterTree(node.children, query);
      if (filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren, expanded: true });
      }
    }
    return acc;
  }, []);
}

function toggleNode(nodes: FileNode[], id: string): FileNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, expanded: !node.expanded };
    }
    if (node.children) {
      return { ...node, children: toggleNode(node.children, id) };
    }
    return node;
  });
}

function toggleAllNodes(nodes: FileNode[], expanded: boolean): FileNode[] {
  return nodes.map((node) => ({
    ...node,
    expanded: node.type === 'folder' ? expanded : undefined,
    children: node.children ? toggleAllNodes(node.children, expanded) : undefined,
  }));
}
