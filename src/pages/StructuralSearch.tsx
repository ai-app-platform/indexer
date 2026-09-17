import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Code2, Puzzle, Network } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { MOCK_JAVA_FILES, MOCK_PROJECT_CONFIG } from '../data/mockIndexData';
import { IndexingPipeline, InMemoryIndexStore, CodeSearch } from '../core/indexer';
import type { CodeSymbol, CodeFile } from '../types/code-index';
import { toPersianNumber } from '../lib/utils';

type SearchType = 'lexical' | 'symbol' | 'structural' | 'metadata';

interface StructuralSearchCriteria {
  type?: CodeSymbol['type'];
  annotation?: string;
  implementsInterface?: string;
  extendsClass?: string;
}

interface MetadataSearchCriteria {
  language?: string;
  isTest?: boolean;
  isGenerated?: boolean;
  module?: string;
}

export function StructuralSearch() {
  const { t } = useTranslation();
  const [searchType, setSearchType] = useState<SearchType>('structural');
  const [query, setQuery] = useState('');
  const [indexStore] = useState(() => new InMemoryIndexStore());
  const [isIndexed, setIsIndexed] = useState(false);
  const [codeSearch, setCodeSearch] = useState<CodeSearch | null>(null);
  
  // Search results
  const [symbolResults, setSymbolResults] = useState<CodeSymbol[]>([]);
  const [fileResults, setFileResults] = useState<CodeFile[]>([]);
  
  // Structural search criteria
  const [structType, setStructType] = useState<string>('');
  const [structAnnotation, setStructAnnotation] = useState('');
  const [structImplements, setStructImplements] = useState('');
  const [structExtends, setStructExtends] = useState('');
  
  // Metadata search criteria
  const [metaLanguage, setMetaLanguage] = useState('');
  const [metaIsTest, setMetaIsTest] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    initIndex();
  }, []);

  const initIndex = async () => {
    const pipeline = new IndexingPipeline(MOCK_PROJECT_CONFIG, indexStore);
    const job = await pipeline.fullIndex(MOCK_JAVA_FILES);
    
    if (job.status === 'COMPLETED' || job.status === 'COMPLETED_WITH_WARNINGS') {
      setIsIndexed(true);
      const search = new CodeSearch(indexStore);
      setCodeSearch(search);
    }
  };

  const handleSearch = async () => {
    if (!codeSearch) return;

    switch (searchType) {
      case 'lexical':
        const lexicalResults = await codeSearch.lexicalSearch(MOCK_PROJECT_CONFIG.projectId, query);
        setSymbolResults(lexicalResults.symbols);
        setFileResults(lexicalResults.files);
        break;

      case 'symbol':
        const symbolResults = await codeSearch.symbolSearch(MOCK_PROJECT_CONFIG.projectId, query);
        setSymbolResults(symbolResults);
        setFileResults([]);
        break;

      case 'structural':
        const criteria: StructuralSearchCriteria = {};
        if (structType) criteria.type = structType as CodeSymbol['type'];
        if (structAnnotation) criteria.annotation = structAnnotation;
        if (structImplements) criteria.implementsInterface = structImplements;
        if (structExtends) criteria.extendsClass = structExtends;
        
        const structResults = await codeSearch.structuralSearch(MOCK_PROJECT_CONFIG.projectId, criteria);
        setSymbolResults(structResults);
        setFileResults([]);
        break;

      case 'metadata':
        const metaCriteria: MetadataSearchCriteria = {};
        if (metaLanguage) metaCriteria.language = metaLanguage;
        if (metaIsTest !== undefined) metaCriteria.isTest = metaIsTest;
        
        const metaResults = await codeSearch.metadataSearch(MOCK_PROJECT_CONFIG.projectId, metaCriteria);
        setFileResults(metaResults);
        setSymbolResults([]);
        break;
    }
  };

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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Structural Search
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Advanced code search with structural and metadata queries
        </p>
      </div>

      {/* Search Type Selector */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant={searchType === 'lexical' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSearchType('lexical')}
          >
            <Search className="h-4 w-4 me-2" />
            Lexical
          </Button>
          <Button
            variant={searchType === 'symbol' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSearchType('symbol')}
          >
            <Puzzle className="h-4 w-4 me-2" />
            Symbol
          </Button>
          <Button
            variant={searchType === 'structural' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSearchType('structural')}
          >
            <Code2 className="h-4 w-4 me-2" />
            Structural
          </Button>
          <Button
            variant={searchType === 'metadata' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSearchType('metadata')}
          >
            <Filter className="h-4 w-4 me-2" />
            Metadata
          </Button>
        </div>
      </div>

      {/* Search Form */}
      <div className="card p-4">
        {searchType === 'lexical' && (
          <div className="space-y-3">
            <Input
              label="Search Query"
              placeholder="Search in files, symbols, and content..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button variant="primary" onClick={handleSearch}>
              <Search className="h-4 w-4 me-2" />
              Search
            </Button>
          </div>
        )}

        {searchType === 'symbol' && (
          <div className="space-y-3">
            <Input
              label="Symbol Name"
              placeholder="e.g., PaymentService, authorize, userId..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button variant="primary" onClick={handleSearch}>
              <Search className="h-4 w-4 me-2" />
              Search
            </Button>
          </div>
        )}

        {searchType === 'structural' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Symbol Type
                </label>
                <select
                  value={structType}
                  onChange={(e) => setStructType(e.target.value)}
                  className="input-base"
                >
                  <option value="">All Types</option>
                  <option value="CLASS">Class</option>
                  <option value="INTERFACE">Interface</option>
                  <option value="METHOD">Method</option>
                  <option value="FIELD">Field</option>
                  <option value="ENUM">Enum</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Annotation
                </label>
                <Input
                  placeholder="e.g., Service, Controller, Transactional..."
                  value={structAnnotation}
                  onChange={(e) => setStructAnnotation(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Implements Interface
                </label>
                <Input
                  placeholder="e.g., PaymentProcessor..."
                  value={structImplements}
                  onChange={(e) => setStructImplements(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Extends Class
                </label>
                <Input
                  placeholder="e.g., BaseService..."
                  value={structExtends}
                  onChange={(e) => setStructExtends(e.target.value)}
                />
              </div>
            </div>

            <Button variant="primary" onClick={handleSearch}>
              <Search className="h-4 w-4 me-2" />
              Search
            </Button>
          </div>
        )}

        {searchType === 'metadata' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Language
                </label>
                <select
                  value={metaLanguage}
                  onChange={(e) => setMetaLanguage(e.target.value)}
                  className="input-base"
                >
                  <option value="">All Languages</option>
                  <option value="JAVA">Java</option>
                  <option value="KOTLIN">Kotlin</option>
                  <option value="TYPESCRIPT">TypeScript</option>
                  <option value="JAVASCRIPT">JavaScript</option>
                  <option value="PYTHON">Python</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Test Files Only
                </label>
                <select
                  value={metaIsTest === undefined ? '' : metaIsTest ? 'true' : 'false'}
                  onChange={(e) => setMetaIsTest(e.target.value === '' ? undefined : e.target.value === 'true')}
                  className="input-base"
                >
                  <option value="">All Files</option>
                  <option value="true">Test Files Only</option>
                  <option value="false">Non-Test Files Only</option>
                </select>
              </div>
            </div>

            <Button variant="primary" onClick={handleSearch}>
              <Search className="h-4 w-4 me-2" />
              Search
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Results
          {(symbolResults.length > 0 || fileResults.length > 0) && (
            <span className="ms-2 text-xs text-slate-500">
              ({toPersianNumber(symbolResults.length)} symbols, {toPersianNumber(fileResults.length)} files)
            </span>
          )}
        </h3>

        {symbolResults.length === 0 && fileResults.length === 0 ? (
          <EmptyState
            title="No results found"
            description="Try adjusting your search criteria"
          />
        ) : (
          <div className="space-y-3">
            {/* Symbol Results */}
            {symbolResults.map(symbol => (
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
                {symbol.annotations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {symbol.annotations.map(a => (
                      <Badge key={a} variant="muted" className="text-[10px]">@{a}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* File Results */}
            {fileResults.map(file => (
              <div key={file.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{file.language}</Badge>
                    <span className="text-sm font-mono font-medium text-slate-900 dark:text-slate-100">
                      {file.name}
                    </span>
                  </div>
                  {file.isTest && <Badge variant="warning">Test</Badge>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate" dir="ltr">
                  {file.path}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
