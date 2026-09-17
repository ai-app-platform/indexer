// Core Code Index Domain Types

export type Language = 
  | 'JAVA' 
  | 'KOTLIN' 
  | 'JAVASCRIPT' 
  | 'TYPESCRIPT' 
  | 'PYTHON' 
  | 'GO' 
  | 'RUST' 
  | 'C' 
  | 'CPP' 
  | 'CSHARP' 
  | 'PHP' 
  | 'RUBY' 
  | 'SWIFT'
  | 'UNKNOWN';

export type SymbolType = 
  | 'CLASS' 
  | 'INTERFACE' 
  | 'ENUM' 
  | 'RECORD' 
  | 'METHOD' 
  | 'CONSTRUCTOR' 
  | 'FIELD' 
  | 'PROPERTY' 
  | 'FUNCTION' 
  | 'VARIABLE' 
  | 'CONSTANT'
  | 'PACKAGE'
  | 'MODULE';

export type Visibility = 'PUBLIC' | 'PRIVATE' | 'PROTECTED' | 'PACKAGE_PRIVATE';

export type RelationshipType = 
  | 'CALLS' 
  | 'CALLED_BY' 
  | 'IMPORTS' 
  | 'IMPORTED_BY' 
  | 'EXTENDS' 
  | 'EXTENDED_BY'
  | 'IMPLEMENTS' 
  | 'IMPLEMENTED_BY' 
  | 'REFERENCES' 
  | 'REFERENCED_BY' 
  | 'DEPENDS_ON' 
  | 'DEPENDED_BY';

export type IndexJobStatus = 
  | 'PENDING' 
  | 'RUNNING' 
  | 'PARSING' 
  | 'INDEXING' 
  | 'EMBEDDING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'CANCELLED'
  | 'COMPLETED_WITH_WARNINGS';

export type AnalysisStatus = 
  | 'FULL_AST' 
  | 'PARTIAL_AST' 
  | 'TEXT_ONLY' 
  | 'FAILED';

export interface CodeFile {
  id: string;
  projectId: string;
  repositoryId: string;
  path: string;
  name: string;
  language: Language;
  size: number;
  contentHash: string;
  commitSha: string;
  module?: string;
  package?: string;
  isTest: boolean;
  isGenerated: boolean;
  analysisStatus: AnalysisStatus;
  parserVersion?: string;
  indexVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface CodeSymbol {
  id: string;
  fileId: string;
  name: string;
  qualifiedName: string;
  type: SymbolType;
  visibility: Visibility;
  startLine: number;
  endLine: number;
  signature?: string;
  contentHash: string;
  parentSymbolId?: string;
  annotations: string[];
  parameters?: Parameter[];
  returnType?: string;
  modifiers: string[];
}

export interface Parameter {
  name: string;
  type: string;
  index: number;
}

export interface CodeReference {
  id: string;
  sourceSymbolId: string;
  targetSymbolId?: string;
  targetQualifiedName: string;
  relationshipType: RelationshipType;
  fileLocation: {
    fileId: string;
    startLine: number;
    endLine: number;
  };
}

export interface CodeDependency {
  id: string;
  sourceId: string;
  sourceType: 'MODULE' | 'PACKAGE' | 'CLASS';
  targetId: string;
  targetType: 'MODULE' | 'PACKAGE' | 'CLASS';
  dependencyType: 'COMPILE' | 'RUNTIME' | 'TEST';
  isExternal: boolean;
}

export interface CodeChunk {
  id: string;
  fileId: string;
  symbolId?: string;
  content: string;
  startLine: number;
  endLine: number;
  contentHash: string;
  metadata: {
    projectId: string;
    repository: string;
    branch: string;
    commitSha: string;
    filePath: string;
    language: Language;
    module?: string;
    package?: string;
    symbol?: string;
    symbolType?: SymbolType;
    parserVersion?: string;
    indexVersion: number;
  };
}

export interface CodeModule {
  id: string;
  projectId: string;
  name: string;
  path: string;
  buildSystem?: 'MAVEN' | 'GRADLE' | 'NPM' | 'YARN' | 'PIP' | 'CARGO' | 'GO_MODULES';
  dependencies: string[];
  files: string[];
}

export interface CodePackage {
  id: string;
  projectId: string;
  name: string;
  moduleId?: string;
  files: string[];
  symbols: string[];
}

export interface IndexJob {
  id: string;
  projectId: string;
  repositoryId: string;
  branch: string;
  commitSha: string;
  mode: 'FULL' | 'INCREMENTAL' | 'FILE' | 'MODULE' | 'BRANCH';
  status: IndexJobStatus;
  progress: IndexJobProgress;
  startedAt: string;
  completedAt?: string;
  errors: IndexError[];
  indexerVersion: string;
  parserVersion: string;
  indexVersion: number;
}

export interface IndexJobProgress {
  filesDiscovered: number;
  filesParsed: number;
  filesFailed: number;
  symbolsExtracted: number;
  relationshipsExtracted: number;
  chunksCreated: number;
  dependenciesResolved: number;
}

export interface IndexError {
  fileId: string;
  filePath: string;
  parser: string;
  line?: number;
  errorType: string;
  message: string;
  parserVersion: string;
  timestamp: string;
}

export interface CodeRevision {
  id: string;
  projectId: string;
  repositoryId: string;
  branch: string;
  commitSha: string;
  parentCommitSha?: string;
  author: string;
  message: string;
  timestamp: string;
}

export interface CodeIndex {
  id: string;
  projectId: string;
  repositoryId: string;
  branch: string;
  commitSha: string;
  files: CodeFile[];
  symbols: CodeSymbol[];
  references: CodeReference[];
  dependencies: CodeDependency[];
  chunks: CodeChunk[];
  modules: CodeModule[];
  packages: CodePackage[];
  indexVersion: number;
  parserVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface CodebaseSnapshot {
  projectId: string;
  repository: string;
  commitSha: string;
  statistics: {
    files: number;
    symbols: number;
    modules: number;
    packages: number;
    dependencies: number;
    relationships: number;
    chunks: number;
  };
  languages: Record<Language, number>;
  frameworks: string[];
  buildSystems: string[];
}
