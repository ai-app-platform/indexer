import { CodeIndex, CodeFile, CodeSymbol, CodeReference, CodeDependency, CodeChunk, CodeModule, CodePackage, IndexJob, IndexJobStatus, CodebaseSnapshot, Language } from '../../../types/code-index';

/**
 * IndexStore - مسئول ذخیره و بازیابی Code Index
 * 
 * معماری:
 * - Interface-based برای abstraction
 * - پیاده‌سازی InMemory برای demo
 * - قابل جایگزینی با database adapters
 */

export interface IndexStore {
  // Index operations
  saveIndex(index: CodeIndex): Promise<void>;
  getIndex(projectId: string, branch: string): Promise<CodeIndex | null>;
  deleteIndex(projectId: string, branch: string): Promise<void>;
  
  // File operations
  saveFile(file: CodeFile): Promise<void>;
  getFile(fileId: string): Promise<CodeFile | null>;
  getFilesByProject(projectId: string): Promise<CodeFile[]>;
  deleteFile(fileId: string): Promise<void>;
  
  // Symbol operations
  saveSymbol(symbol: CodeSymbol): Promise<void>;
  getSymbol(symbolId: string): Promise<CodeSymbol | null>;
  getSymbolsByFile(fileId: string): Promise<CodeSymbol[]>;
  getSymbolsByProject(projectId: string): Promise<CodeSymbol[]>;
  findSymbolByQualifiedName(qualifiedName: string): Promise<CodeSymbol | null>;
  deleteSymbol(symbolId: string): Promise<void>;
  
  // Reference operations
  saveReference(reference: CodeReference): Promise<void>;
  getReferencesByFile(fileId: string): Promise<CodeReference[]>;
  getReferencesByProject(projectId: string): Promise<CodeReference[]>;
  findReferencesToSymbol(qualifiedName: string): Promise<CodeReference[]>;
  
  // Dependency operations
  saveDependency(dependency: CodeDependency): Promise<void>;
  getDependenciesByProject(projectId: string): Promise<CodeDependency[]>;
  
  // Chunk operations
  saveChunk(chunk: CodeChunk): Promise<void>;
  getChunksByFile(fileId: string): Promise<CodeChunk[]>;
  getChunksByProject(projectId: string): Promise<CodeChunk[]>;
  
  // Job operations
  saveJob(job: IndexJob): Promise<void>;
  getJob(jobId: string): Promise<IndexJob | null>;
  getJobsByProject(projectId: string): Promise<IndexJob[]>;
  updateJobStatus(jobId: string, status: IndexJobStatus, progress?: Partial<IndexJob['progress']>): Promise<void>;
  
  // Statistics
  getSnapshot(projectId: string, branch: string): Promise<CodebaseSnapshot | null>;
}

/**
 * InMemoryIndexStore - پیاده‌سازی InMemory برای demo و testing
 */
export class InMemoryIndexStore implements IndexStore {
  private indexes: Map<string, CodeIndex> = new Map();
  private files: Map<string, CodeFile> = new Map();
  private symbols: Map<string, CodeSymbol> = new Map();
  private references: Map<string, CodeReference> = new Map();
  private dependencies: Map<string, CodeDependency> = new Map();
  private chunks: Map<string, CodeChunk> = new Map();
  private jobs: Map<string, IndexJob> = new Map();

  private getIndexKey(projectId: string, branch: string): string {
    return `${projectId}:${branch}`;
  }

  // Index operations
  async saveIndex(index: CodeIndex): Promise<void> {
    const key = this.getIndexKey(index.projectId, index.branch);
    this.indexes.set(key, index);
  }

  async getIndex(projectId: string, branch: string): Promise<CodeIndex | null> {
    const key = this.getIndexKey(projectId, branch);
    return this.indexes.get(key) || null;
  }

  async deleteIndex(projectId: string, branch: string): Promise<void> {
    const key = this.getIndexKey(projectId, branch);
    this.indexes.delete(key);
  }

  // File operations
  async saveFile(file: CodeFile): Promise<void> {
    this.files.set(file.id, file);
  }

  async getFile(fileId: string): Promise<CodeFile | null> {
    return this.files.get(fileId) || null;
  }

  async getFilesByProject(projectId: string): Promise<CodeFile[]> {
    return Array.from(this.files.values()).filter(f => f.projectId === projectId);
  }

  async deleteFile(fileId: string): Promise<void> {
    this.files.delete(fileId);
  }

  // Symbol operations
  async saveSymbol(symbol: CodeSymbol): Promise<void> {
    this.symbols.set(symbol.id, symbol);
  }

  async getSymbol(symbolId: string): Promise<CodeSymbol | null> {
    return this.symbols.get(symbolId) || null;
  }

  async getSymbolsByFile(fileId: string): Promise<CodeSymbol[]> {
    return Array.from(this.symbols.values()).filter(s => s.fileId === fileId);
  }

  async getSymbolsByProject(projectId: string): Promise<CodeSymbol[]> {
    const files = await this.getFilesByProject(projectId);
    const fileIds = new Set(files.map(f => f.id));
    return Array.from(this.symbols.values()).filter(s => fileIds.has(s.fileId));
  }

  async findSymbolByQualifiedName(qualifiedName: string): Promise<CodeSymbol | null> {
    return Array.from(this.symbols.values()).find(s => s.qualifiedName === qualifiedName) || null;
  }

  async deleteSymbol(symbolId: string): Promise<void> {
    this.symbols.delete(symbolId);
  }

  // Reference operations
  async saveReference(reference: CodeReference): Promise<void> {
    this.references.set(reference.id, reference);
  }

  async getReferencesByFile(fileId: string): Promise<CodeReference[]> {
    return Array.from(this.references.values()).filter(r => r.fileLocation.fileId === fileId);
  }

  async getReferencesByProject(projectId: string): Promise<CodeReference[]> {
    const files = await this.getFilesByProject(projectId);
    const fileIds = new Set(files.map(f => f.id));
    return Array.from(this.references.values()).filter(r => fileIds.has(r.fileLocation.fileId));
  }

  async findReferencesToSymbol(qualifiedName: string): Promise<CodeReference[]> {
    return Array.from(this.references.values()).filter(r => r.targetQualifiedName === qualifiedName);
  }

  // Dependency operations
  async saveDependency(dependency: CodeDependency): Promise<void> {
    this.dependencies.set(dependency.id, dependency);
  }

  async getDependenciesByProject(projectId: string): Promise<CodeDependency[]> {
    // Filter by project (simplified - in real implementation would have projectId in dependency)
    return Array.from(this.dependencies.values());
  }

  // Chunk operations
  async saveChunk(chunk: CodeChunk): Promise<void> {
    this.chunks.set(chunk.id, chunk);
  }

  async getChunksByFile(fileId: string): Promise<CodeChunk[]> {
    return Array.from(this.chunks.values()).filter(c => c.fileId === fileId);
  }

  async getChunksByProject(projectId: string): Promise<CodeChunk[]> {
    return Array.from(this.chunks.values()).filter(c => c.metadata.projectId === projectId);
  }

  // Job operations
  async saveJob(job: IndexJob): Promise<void> {
    this.jobs.set(job.id, job);
  }

  async getJob(jobId: string): Promise<IndexJob | null> {
    return this.jobs.get(jobId) || null;
  }

  async getJobsByProject(projectId: string): Promise<IndexJob[]> {
    return Array.from(this.jobs.values()).filter(j => j.projectId === projectId);
  }

  async updateJobStatus(jobId: string, status: IndexJobStatus, progress?: Partial<IndexJob['progress']>): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      if (progress) {
        job.progress = { ...job.progress, ...progress };
      }
      if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
        job.completedAt = new Date().toISOString();
      }
      this.jobs.set(jobId, job);
    }
  }

  // Statistics
  async getSnapshot(projectId: string, branch: string): Promise<CodebaseSnapshot | null> {
    const index = await this.getIndex(projectId, branch);
    if (!index) return null;

    const files = await this.getFilesByProject(projectId);
    const symbols = await this.getSymbolsByProject(projectId);
    const references = await this.getReferencesByProject(projectId);
    const dependencies = await this.getDependenciesByProject(projectId);
    const chunks = await this.getChunksByProject(projectId);

    const languages: Record<Language, number> = {} as Record<Language, number>;
    for (const file of files) {
      languages[file.language] = (languages[file.language] || 0) + 1;
    }

    return {
      projectId,
      repository: index.repositoryId,
      commitSha: index.commitSha,
      statistics: {
        files: files.length,
        symbols: symbols.length,
        modules: 0, // Would be calculated
        packages: 0, // Would be calculated
        dependencies: dependencies.length,
        relationships: references.length,
        chunks: chunks.length,
      },
      languages,
      frameworks: [], // Would be detected
      buildSystems: [], // Would be detected
    };
  }
}
