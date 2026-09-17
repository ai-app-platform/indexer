import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Network, GitBranch, ArrowRight, Circle, Box } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { MOCK_JAVA_FILES, MOCK_PROJECT_CONFIG } from '../data/mockIndexData';
import { IndexingPipeline, InMemoryIndexStore, CodeIndexQuery } from '../core/indexer';
import { FrameworkAnalyzerRegistry, CompleteFrameworkAnalysis } from '../core/indexer/analyzers';
import type { CodeSymbol, CodeReference, CodeDependency } from '../types/code-index';

type GraphView = 'call' | 'dependency' | 'inheritance';

interface GraphNode {
  id: string;
  label: string;
  type: 'class' | 'method' | 'interface' | 'module' | 'package';
  x: number;
  y: number;
  color: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: 'calls' | 'imports' | 'extends' | 'implements' | 'depends';
}

export function GraphVisualization() {
  const { t } = useTranslation();
  const [view, setView] = useState<GraphView>('call');
  const [indexStore] = useState(() => new InMemoryIndexStore());
  const [isIndexed, setIsIndexed] = useState(false);
  const [symbols, setSymbols] = useState<CodeSymbol[]>([]);
  const [references, setReferences] = useState<CodeReference[]>([]);
  const [frameworkAnalysis, setFrameworkAnalysis] = useState<CompleteFrameworkAnalysis | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    initIndex();
  }, []);

  const initIndex = async () => {
    const pipeline = new IndexingPipeline(MOCK_PROJECT_CONFIG, indexStore);
    const job = await pipeline.fullIndex(MOCK_JAVA_FILES);
    
    if (job.status === 'COMPLETED' || job.status === 'COMPLETED_WITH_WARNINGS') {
      setIsIndexed(true);
      const syms = await indexStore.getSymbolsByProject(MOCK_PROJECT_CONFIG.projectId);
      const refs = await indexStore.getReferencesByProject(MOCK_PROJECT_CONFIG.projectId);
      setSymbols(syms);
      setReferences(refs);

      // Run framework analysis
      const registry = new FrameworkAnalyzerRegistry();
      const files = await indexStore.getFilesByProject(MOCK_PROJECT_CONFIG.projectId);
      const analysis = registry.analyzeAll(syms, refs, files);
      setFrameworkAnalysis(analysis);
    }
  };

  const { nodes, edges } = useMemo(() => {
    if (!isIndexed) return { nodes: [], edges: [] };

    switch (view) {
      case 'call':
        return buildCallGraph(symbols, references);
      case 'dependency':
        return buildDependencyGraph(symbols, references);
      case 'inheritance':
        return buildInheritanceGraph(symbols, references);
      default:
        return { nodes: [], edges: [] };
    }
  }, [view, symbols, references, isIndexed]);

  if (!isIndexed) {
    return (
      <div className="flex items-center justify-center h-96">
        <EmptyState
          title="Index Required"
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
            Graph Visualization
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visual representation of code relationships
          </p>
        </div>
      </div>

      {/* View Selector */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <Button
            variant={view === 'call' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('call')}
          >
            <Network className="h-4 w-4 me-2" />
            Call Graph
          </Button>
          <Button
            variant={view === 'dependency' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('dependency')}
          >
            <GitBranch className="h-4 w-4 me-2" />
            Dependency Graph
          </Button>
          <Button
            variant={view === 'inheritance' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('inheritance')}
          >
            <Box className="h-4 w-4 me-2" />
            Inheritance Graph
          </Button>
        </div>
      </div>

      {/* Framework Analysis Summary */}
      {frameworkAnalysis && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Framework Analysis
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {frameworkAnalysis.summary.totalEndpoints}
              </p>
              <p className="text-xs text-slate-500">REST Endpoints</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {frameworkAnalysis.summary.totalEntities}
              </p>
              <p className="text-xs text-slate-500">JPA Entities</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {frameworkAnalysis.summary.totalServices}
              </p>
              <p className="text-xs text-slate-500">Services</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {frameworkAnalysis.buildSystem.buildSystem}
              </p>
              <p className="text-xs text-slate-500">Build System</p>
            </div>
          </div>

          {/* Detected Frameworks */}
          {frameworkAnalysis.summary.detectedFrameworks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 mb-2">Detected Frameworks:</p>
              <div className="flex flex-wrap gap-2">
                {frameworkAnalysis.summary.detectedFrameworks.map(fw => (
                  <Badge key={fw} variant="info">{fw}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Graph Visualization */}
      <div className="card p-4 min-h-[500px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {view === 'call' && 'Call Graph'}
            {view === 'dependency' && 'Dependency Graph'}
            {view === 'inheritance' && 'Inheritance Graph'}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{nodes.length} nodes</span>
            <span>•</span>
            <span>{edges.length} edges</span>
          </div>
        </div>

        {/* Simple SVG Graph */}
        <div className="relative w-full h-[400px] bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 800 400">
            {/* Edges */}
            {edges.map(edge => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              return (
                <g key={edge.id}>
                  <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={getEdgeColor(edge.type)}
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                  {edge.label && (
                    <text
                      x={(sourceNode.x + targetNode.x) / 2}
                      y={(sourceNode.y + targetNode.y) / 2 - 5}
                      textAnchor="middle"
                      className="text-[10px] fill-slate-500"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Arrow marker */}
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#64748b" />
              </marker>
            </defs>

            {/* Nodes */}
            {nodes.map(node => (
              <g
                key={node.id}
                onClick={() => setSelectedNode(node.id)}
                className="cursor-pointer"
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="20"
                  fill={node.color}
                  stroke={selectedNode === node.id ? '#0d9488' : 'transparent'}
                  strokeWidth="3"
                />
                <text
                  x={node.x}
                  y={node.y + 35}
                  textAnchor="middle"
                  className="text-[11px] fill-slate-700 dark:fill-slate-300 font-medium"
                >
                  {node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-teal-500" />
            <span>Class</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <span>Method</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500" />
            <span>Interface</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500" />
            <span>Module</span>
          </div>
        </div>

        {/* Selected Node Info */}
        {selectedNode && (
          <div className="mt-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {nodes.find(n => n.id === selectedNode)?.label}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Type: {nodes.find(n => n.id === selectedNode)?.type}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function buildCallGraph(symbols: CodeSymbol[], references: CodeReference[]) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Add class nodes
  const classes = symbols.filter(s => s.type === 'CLASS' || s.type === 'INTERFACE');
  classes.forEach((cls, idx) => {
    nodes.push({
      id: cls.id,
      label: cls.name,
      type: cls.type === 'INTERFACE' ? 'interface' : 'class',
      x: 100 + (idx % 4) * 180,
      y: 100 + Math.floor(idx / 4) * 120,
      color: cls.type === 'INTERFACE' ? '#a855f7' : '#14b8a6',
    } as GraphNode);
  });

  // Add call edges
  const callRefs = references.filter(r => r.relationshipType === 'CALLS');
  callRefs.forEach((ref, idx) => {
    edges.push({
      id: `edge-${idx}`,
      source: ref.sourceSymbolId,
      target: ref.sourceSymbolId, // Simplified for demo
      label: 'calls',
      type: 'calls',
    });
  });

  return { nodes, edges };
}

function buildDependencyGraph(symbols: CodeSymbol[], references: CodeReference[]) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Group by package
  const packages = new Map<string, CodeSymbol[]>();
  symbols.forEach(s => {
    const pkg = s.qualifiedName.split('.').slice(0, -1).join('.');
    if (!packages.has(pkg)) {
      packages.set(pkg, []);
    }
    packages.get(pkg)!.push(s);
  });

  // Add package nodes
  let pkgIdx = 0;
  packages.forEach((syms, pkg) => {
    nodes.push({
      id: `pkg-${pkg}`,
      label: pkg.split('.').pop() || pkg,
      type: 'package',
      x: 100 + (pkgIdx % 3) * 250,
      y: 100 + Math.floor(pkgIdx / 3) * 150,
      color: '#f59e0b',
    } as GraphNode);
    pkgIdx++;
  });

  // Add import edges
  const importRefs = references.filter(r => r.relationshipType === 'IMPORTS');
  importRefs.forEach((ref, idx) => {
    edges.push({
      id: `edge-${idx}`,
      source: ref.sourceSymbolId,
      target: ref.sourceSymbolId,
      label: 'imports',
      type: 'imports',
    });
  });

  return { nodes, edges };
}

function buildInheritanceGraph(symbols: CodeSymbol[], references: CodeReference[]) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Add class/interface nodes
  const types = symbols.filter(s => s.type === 'CLASS' || s.type === 'INTERFACE');
  types.forEach((type, idx) => {
    nodes.push({
      id: type.id,
      label: type.name,
      type: type.type === 'INTERFACE' ? 'interface' : 'class',
      x: 100 + (idx % 4) * 180,
      y: 100 + Math.floor(idx / 4) * 120,
      color: type.type === 'INTERFACE' ? '#a855f7' : '#14b8a6',
    });
  });

  // Add inheritance edges
  const extendsRefs = references.filter(r => 
    r.relationshipType === 'EXTENDS' || r.relationshipType === 'IMPLEMENTS'
  );
  extendsRefs.forEach((ref, idx) => {
    edges.push({
      id: `edge-${idx}`,
      source: ref.sourceSymbolId,
      target: ref.sourceSymbolId,
      label: ref.relationshipType === 'EXTENDS' ? 'extends' : 'implements',
      type: ref.relationshipType === 'EXTENDS' ? 'extends' : 'implements',
    });
  });

  return { nodes, edges };
}

function getEdgeColor(type: string): string {
  switch (type) {
    case 'calls': return '#10b981';
    case 'imports': return '#3b82f6';
    case 'extends': return '#f59e0b';
    case 'implements': return '#a855f7';
    case 'depends': return '#ef4444';
    default: return '#64748b';
  }
}
