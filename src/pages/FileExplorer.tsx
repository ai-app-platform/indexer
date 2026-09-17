import { useState, useEffect, useMemo } from 'react';
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
  Puzzle,
  Network,
  GitBranch,
  Layers,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { cn } from '../lib/utils';
import { toPersianNumber } from '../lib/utils';
import { MOCK_JAVA_FILES, MOCK_PROJECT_CONFIG } from '../data/mockIndexData';
import { IndexingPipeline, InMemoryIndexStore, CodeIndexQuery, CodeSearch } from '../core/indexer';
import type { CodeFile, CodeSymbol, CodeReference, CodeChunk, IndexJob } from '../types/code-index';

interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: TreeNode[];
  file?: CodeFile;
  symbols?: CodeSymbol[];
  expanded?: boolean;
}

export function FileExplorer() {
  const { t } = useTranslation();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [selectedSymbols, setSelectedSymbols] = useState<CodeSymbol[]>([]);
  const [selectedReferences, setSelectedReferences] = useState<CodeReference[]>([]);
  const [viewMode, setViewMode] = useState<'content' | 'symbols' | 'references'>('content');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [indexStore] = useState(() => new InMemoryIndexStore());
  const [isIndexed, setIsIndexed] = useState(false);
  const [stats, setStats] = useState({ files: 0, symbols: 0, references: 0, chunks: 0 });

  useEffect(() => {
    initIndex();
  }, []);

  const initIndex = async () => {
    const pipeline = new IndexingPipeline(MOCK_PROJECT_CONFIG, indexStore);
    const job = await pipeline.fullIndex(MOCK_JAVA_FILES);
    
    if (job.status === 'COMPLETED' || job.status === 'COMPLETED_WITH_WARNINGS') {
      setIsIndexed(true);
      const files = await indexStore.getFilesByProject(MOCK_PROJECT_CONFIG.projectId);
      const symbols = await indexStore.getSymbolsByProject(MOCK_PROJECT_CONFIG.projectId);
      const references = await indexStore.getReferencesByProject(MOCK_PROJECT_CONFIG.projectId);
      const chunks = await indexStore.getChunksByProject(MOCK_PROJECT_CONFIG.projectId);
      
      setStats({
        files: files.length,
        symbols: symbols.length,
        references: references.length,
        chunks: chunks.length,
      });
      
      const treeNodes = buildTree(files, symbols);
      setTree(treeNodes);
    }
  };

  const buildTree = (files: CodeFile[], symbols: CodeSymbol[]): TreeNode[] => {
    const root: TreeNode = { id: 'root', name: 'project', type: 'folder', path: '', children: [], expanded: true };
    
    for (const file of files) {
      const parts = file.path.split('/');
      let current = root;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const folderPath = parts.slice(0, i + 1).join('/');
        let child = current.children?.find(c => c.name === parts[i] && c.type === 'folder');
        
        if (!child) {
          child = {
            id: `folder-${folderPath}`,
            name: parts[i],
            type: 'folder',
            path: folderPath,
            children: [],
            expanded: i < 3,
          };
          current.children = current.children || [];
          current.children.push(child);
        }
        current = child;
      }
      
      const fileSymbols = symbols.filter(s => s.fileId === file.id);
      current.children = current.children || [];
      current.children.push({
        id: file.id,
        name: file.name,
        type: 'file',
        path: file.path,
        file,
        symbols: fileSymbols,
      });
    }
    
    return root.children || [];
  };

  const handleFileSelect = async (node: TreeNode) => {
    if (node.type === 'file' && node.file) {
      setSelectedFile(node.file);
      setSelectedSymbols(node.symbols || []);
      
      const query = new CodeIndexQuery(indexStore);
      const refs = await indexStore.getReferencesByFile(node.file.id);
      setSelectedReferences(refs);
      setViewMode('content');
    }
  };

  const toggleNode = (nodes: TreeNode[], id: string): TreeNode[] => {
    return nodes.map(node => {
      if (node.id === id) {
        return { ...node, expanded: !node.expanded };
      }
      if (node.children) {
        return { ...node, children: toggleNode(node.children, id) };
      }
      return node;
    });
  };

  const toggleAll = (nodes: TreeNode[], expanded: boolean): TreeNode[] => {
    return nodes.map(node => ({
      ...node,
      expanded: node.type === 'folder' ? expanded : undefined,
      children: node.children ? toggleAll(node.children, expanded) : undefined,
    }));
  };

  const filteredTree = useMemo(() => {
    if (!searchQuery) return tree;
    return filterTree(tree, searchQuery.toLowerCase());
  }, [tree, searchQuery]);

  const handleCopy = () => {
    if (selectedFile) {
      const entry = MOCK_JAVA_FILES.find(f => f.path === selectedFile.path);
      if (entry?.content) {
        navigator.clipboard.writeText(entry.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const [allExpanded, setAllExpanded] = useState(true);
  const handleToggleAll = () => {
    const newState = !allExpanded;
    setAllExpanded(newState);
    setTree(toggleAll(tree, newState));
  };

  if (!isIndexed) {
    return (
      <div className="flex items-center justify-center h-96">
        <EmptyState
          title="Initializing Index..."
          description="Please run the indexer first from the Indexer page"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('explorer.title')}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="info">{toPersianNumber(stats.files)} files</Badge>
            <Badge variant="success">{toPersianNumber(stats.symbols)} symbols</Badge>
            <Badge variant="warning">{toPersianNumber(stats.references)} relations</Badge>
            <Badge variant="muted">{toPersianNumber(stats.chunks)} chunks</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[600px]">
        {/* File Tree */}
        <div className="card p-4 lg:col-span-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Input
              placeholder="Search files and symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="!py-2 text-xs"
            />
            <Button variant="ghost" size="sm" onClick={handleToggleAll} className="!p-2 flex-shrink-0">
              {allExpanded ? <ChevronsDownUp className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {filteredTree.map(node => (
              <TreeNodeComponent
                key={node.id}
                node={node}
                depth={0}
                selectedFile={selectedFile}
                onSelect={handleFileSelect}
                onToggle={(id) => setTree(toggleNode(tree, id))}
              />
            ))}
          </div>
        </div>

        {/* Content Panel */}
        <div className="card p-4 lg:col-span-2 flex flex-col">
          {selectedFile ? (
            <>
              {/* File header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                    {selectedFile.path}
                  </span>
                  <Badge variant="info" className="text-[10px]">{selectedFile.language}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'content' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('content')}
                  >
                    <Code2 className="h-3 w-3" />
                    Content
                  </Button>
                  <Button
                    variant={viewMode === 'symbols' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('symbols')}
                  >
                    <Puzzle className="h-3 w-3" />
                    Symbols
                  </Button>
                  <Button
                    variant={viewMode === 'references' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('references')}
                  >
                    <Network className="h-3 w-3" />
                    Relations
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="!p-2">
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {viewMode === 'content' && (
                  <pre className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono p-4 bg-slate-50 dark:bg-slate-800 rounded-lg" dir="ltr">
                    {MOCK_JAVA_FILES.find(f => f.path === selectedFile.path)?.content || 'No content'}
                  </pre>
                )}

                {viewMode === 'symbols' && (
                  <div className="space-y-2">
                    {selectedSymbols.length === 0 ? (
                      <EmptyState title="No symbols found" description="This file has no extracted symbols" />
                    ) : (
                      selectedSymbols.map(symbol => (
                        <div key={symbol.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                symbol.type === 'CLASS' ? 'info' :
                                symbol.type === 'METHOD' ? 'success' :
                                symbol.type === 'INTERFACE' ? 'warning' :
                                'muted'
                              }>
                                {symbol.type}
                              </Badge>
                              <span className="text-sm font-mono font-medium text-slate-900 dark:text-slate-100">
                                {symbol.name}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">
                              L{symbol.startLine}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate" dir="ltr">
                            {symbol.qualifiedName}
                          </p>
                          {symbol.signature && (
                            <p className="text-xs text-teal-600 dark:text-teal-400 font-mono mt-1" dir="ltr">
                              {symbol.signature}
                            </p>
                          )}
                          {symbol.annotations.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {symbol.annotations.map(a => (
                                <Badge key={a} variant="muted" className="text-[10px]">@{a}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {viewMode === 'references' && (
                  <div className="space-y-2">
                    {selectedReferences.length === 0 ? (
                      <EmptyState title="No references found" description="This file has no extracted references" />
                    ) : (
                      selectedReferences.map(ref => (
                        <div key={ref.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={
                              ref.relationshipType === 'CALLS' ? 'success' :
                              ref.relationshipType === 'IMPORTS' ? 'info' :
                              ref.relationshipType === 'EXTENDS' ? 'warning' :
                              ref.relationshipType === 'IMPLEMENTS' ? 'warning' :
                              'muted'
                            }>
                              {ref.relationshipType}
                            </Badge>
                            <span className="text-xs text-slate-500">L{ref.fileLocation.startLine}</span>
                          </div>
                          <p className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate" dir="ltr">
                            → {ref.targetQualifiedName}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
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

function TreeNodeComponent({
  node,
  depth,
  selectedFile,
  onSelect,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  selectedFile: CodeFile | null;
  onSelect: (node: TreeNode) => void;
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
        {!isFolder && node.symbols && node.symbols.length > 0 && (
          <span className="text-[10px] text-slate-400 ms-auto">
            {node.symbols.length}
          </span>
        )}
      </button>

      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map(child => (
            <TreeNodeComponent
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

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  return nodes.reduce<TreeNode[]>((acc, node) => {
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
