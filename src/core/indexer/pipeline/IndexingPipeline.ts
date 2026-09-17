import { CodeIndex, CodeFile, CodeSymbol, CodeReference, CodeDependency, CodeChunk, IndexJob, IndexJobStatus, Language } from '../../../types/code-index';
import { FileWalker, FileEntry, FileWalkerConfig } from '../FileWalker';
import { ParserRegistry, ParseOrchestrator } from '../parser/CodeParser';
import { JavaParser } from '../parser/JavaParser';
import { SymbolExtractor, RelationshipExtractor, DependencyAnalyzer, CodeChunker } from '../Extractors';
import { IndexStore } from '../store/IndexStore';

/**
 * IndexingPipeline - مسئول orchestrate کردن فرآیند ایندکس
 * 
 * دو حالت:
 * 1. Full Indexing - برای اولین بار یا rebuild کامل
 * 2. Incremental Indexing - برای تغییرات بعد از initial index
 */

export interface IndexingPipelineConfig {
  projectId: string;
  repositoryId: string;
  branch: string;
  commitSha: string;
  indexerVersion: string;
}

export class IndexingPipeline {
  private fileWalker: FileWalker;
  private parserRegistry: ParserRegistry;
  private parseOrchestrator: ParseOrchestrator;
  private symbolExtractor: SymbolExtractor;
  private relationshipExtractor: RelationshipExtractor;
  private dependencyAnalyzer: DependencyAnalyzer;
  private codeChunker: CodeChunker;
  private indexStore: IndexStore;
  private config: IndexingPipelineConfig;

  constructor(config: IndexingPipelineConfig, indexStore: IndexStore) {
    this.config = config;
    this.indexStore = indexStore;
    
    // Initialize components
    this.fileWalker = new FileWalker({
      projectId: config.projectId,
      repositoryId: config.repositoryId,
      commitSha: config.commitSha,
    });
    
    this.parserRegistry = new ParserRegistry();
    this.parserRegistry.register(new JavaParser());
    // Register more parsers here
    
    this.parseOrchestrator = new ParseOrchestrator(this.parserRegistry);
    this.symbolExtractor = new SymbolExtractor();
    this.relationshipExtractor = new RelationshipExtractor();
    this.dependencyAnalyzer = new DependencyAnalyzer();
    this.codeChunker = new CodeChunker();
  }

  /**
   * Full Indexing - پیمایش کامل repository و ساخت index از صفر
   */
  async fullIndex(fileEntries: FileEntry[]): Promise<IndexJob> {
    const jobId = `job-${Date.now()}`;
    const job: IndexJob = {
      id: jobId,
      projectId: this.config.projectId,
      repositoryId: this.config.repositoryId,
      branch: this.config.branch,
      commitSha: this.config.commitSha,
      mode: 'FULL',
      status: 'PENDING',
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
      indexerVersion: this.config.indexerVersion,
      parserVersion: '1.0.0',
      indexVersion: 1,
    };

    await this.indexStore.saveJob(job);

    try {
      // Phase 1: File Discovery
      await this.indexStore.updateJobStatus(jobId, 'RUNNING');
      const discoveryResult = this.fileWalker.walk(fileEntries);
      
      job.progress.filesDiscovered = discoveryResult.files.length;
      await this.indexStore.updateJobStatus(jobId, 'PARSING', job.progress);

      // Phase 2: Parse files and extract symbols
      const allSymbols: CodeSymbol[] = [];
      const allReferences: CodeReference[] = [];
      const allChunks: CodeChunk[] = [];

      for (const file of discoveryResult.files) {
        try {
          const entry = fileEntries.find(e => e.path === file.path);
          if (!entry || !entry.content) continue;

          // Parse file
          const parseResult = this.parseOrchestrator.parse(file.path, entry.content, file.language);
          
          if (!parseResult.success) {
            job.errors.push({
              fileId: file.id,
              filePath: file.path,
              parser: parseResult.parserUsed,
              errorType: 'PARSE_ERROR',
              message: parseResult.errors.map(e => e.message).join(', '),
              parserVersion: parseResult.parserVersion,
              timestamp: new Date().toISOString(),
            });
            job.progress.filesFailed++;
          } else {
            // Extract symbols
            const symbols = this.symbolExtractor.extractSymbols(file.id, parseResult);
            allSymbols.push(...symbols);

            // Extract relationships
            const references = this.relationshipExtractor.extractRelationships(file.id, parseResult);
            allReferences.push(...references);

            // Create chunks
            const chunks = this.codeChunker.chunkFile(file.id, entry.content, symbols, {
              projectId: this.config.projectId,
              repository: this.config.repositoryId,
              branch: this.config.branch,
              commitSha: this.config.commitSha,
              filePath: file.path,
              language: file.language,
              module: file.module,
              package: file.package,
              parserVersion: parseResult.parserVersion,
              indexVersion: job.indexVersion,
            });
            allChunks.push(...chunks);

            // Update file analysis status
            file.analysisStatus = parseResult.analysisQuality;
            file.parserVersion = parseResult.parserVersion;

            job.progress.filesParsed++;
          }

          job.progress.symbolsExtracted = allSymbols.length;
          job.progress.relationshipsExtracted = allReferences.length;
          job.progress.chunksCreated = allChunks.length;
          await this.indexStore.updateJobStatus(jobId, 'PARSING', job.progress);
        } catch (error) {
          job.errors.push({
            fileId: file.id,
            filePath: file.path,
            parser: 'unknown',
            errorType: 'UNEXPECTED_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            parserVersion: 'unknown',
            timestamp: new Date().toISOString(),
          });
          job.progress.filesFailed++;
        }
      }

      // Phase 3: Analyze dependencies
      await this.indexStore.updateJobStatus(jobId, 'INDEXING');
      const dependencies = this.dependencyAnalyzer.analyzeModuleDependencies(allSymbols, allReferences);
      job.progress.dependenciesResolved = dependencies.length;

      // Phase 4: Save to index store
      await this.indexStore.updateJobStatus(jobId, 'INDEXING', job.progress);
      
      for (const file of discoveryResult.files) {
        await this.indexStore.saveFile(file);
      }
      for (const symbol of allSymbols) {
        await this.indexStore.saveSymbol(symbol);
      }
      for (const reference of allReferences) {
        await this.indexStore.saveReference(reference);
      }
      for (const dependency of dependencies) {
        await this.indexStore.saveDependency(dependency);
      }
      for (const chunk of allChunks) {
        await this.indexStore.saveChunk(chunk);
      }

      // Create and save index
      const index: CodeIndex = {
        id: `index-${this.config.projectId}-${this.config.branch}-${Date.now()}`,
        projectId: this.config.projectId,
        repositoryId: this.config.repositoryId,
        branch: this.config.branch,
        commitSha: this.config.commitSha,
        files: discoveryResult.files,
        symbols: allSymbols,
        references: allReferences,
        dependencies,
        chunks: allChunks,
        modules: [],
        packages: [],
        indexVersion: job.indexVersion,
        parserVersion: job.parserVersion,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.indexStore.saveIndex(index);

      // Complete job
      const finalStatus: IndexJobStatus = job.errors.length > 0 ? 'COMPLETED_WITH_WARNINGS' : 'COMPLETED';
      await this.indexStore.updateJobStatus(jobId, finalStatus, job.progress);
      job.status = finalStatus;
      job.completedAt = new Date().toISOString();

      return job;
    } catch (error) {
      job.status = 'FAILED';
      job.completedAt = new Date().toISOString();
      job.errors.push({
        fileId: '',
        filePath: '',
        parser: 'pipeline',
        errorType: 'PIPELINE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        parserVersion: 'unknown',
        timestamp: new Date().toISOString(),
      });
      await this.indexStore.saveJob(job);
      return job;
    }
  }

  /**
   * Incremental Indexing - فقط تغییرات را پردازش می‌کند
   */
  async incrementalIndex(
    fileEntries: FileEntry[],
    previousCommitSha: string
  ): Promise<IndexJob> {
    const jobId = `job-inc-${Date.now()}`;
    const job: IndexJob = {
      id: jobId,
      projectId: this.config.projectId,
      repositoryId: this.config.repositoryId,
      branch: this.config.branch,
      commitSha: this.config.commitSha,
      mode: 'INCREMENTAL',
      status: 'PENDING',
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
      indexerVersion: this.config.indexerVersion,
      parserVersion: '1.0.0',
      indexVersion: 1,
    };

    await this.indexStore.saveJob(job);

    try {
      // Get previous index
      const previousIndex = await this.indexStore.getIndex(this.config.projectId, this.config.branch);
      if (!previousIndex) {
        throw new Error('No previous index found. Use fullIndex instead.');
      }

      // Phase 1: File Discovery
      await this.indexStore.updateJobStatus(jobId, 'RUNNING');
      const newFiles = this.fileWalker.walk(fileEntries).files;
      
      // Detect changes
      const changes = this.fileWalker.detectChanges(previousIndex.files, newFiles);
      
      job.progress.filesDiscovered = changes.added.length + changes.modified.length + changes.deleted.length;
      await this.indexStore.updateJobStatus(jobId, 'PARSING', job.progress);

      // Phase 2: Process changes
      const updatedSymbols: CodeSymbol[] = [];
      const updatedReferences: CodeReference[] = [];
      const updatedChunks: CodeChunk[] = [];

      // Process added and modified files
      for (const file of [...changes.added, ...changes.modified]) {
        try {
          const entry = fileEntries.find(e => e.path === file.path);
          if (!entry || !entry.content) continue;

          // Parse file
          const parseResult = this.parseOrchestrator.parse(file.path, entry.content, file.language);
          
          if (parseResult.success) {
            const symbols = this.symbolExtractor.extractSymbols(file.id, parseResult);
            updatedSymbols.push(...symbols);

            const references = this.relationshipExtractor.extractRelationships(file.id, parseResult);
            updatedReferences.push(...references);

            const chunks = this.codeChunker.chunkFile(file.id, entry.content, symbols, {
              projectId: this.config.projectId,
              repository: this.config.repositoryId,
              branch: this.config.branch,
              commitSha: this.config.commitSha,
              filePath: file.path,
              language: file.language,
              module: file.module,
              package: file.package,
              parserVersion: parseResult.parserVersion,
              indexVersion: job.indexVersion,
            });
            updatedChunks.push(...chunks);

            file.analysisStatus = parseResult.analysisQuality;
            file.parserVersion = parseResult.parserVersion;

            job.progress.filesParsed++;
          } else {
            job.progress.filesFailed++;
          }

          // Save updated file
          await this.indexStore.saveFile(file);
        } catch (error) {
          job.errors.push({
            fileId: file.id,
            filePath: file.path,
            parser: 'unknown',
            errorType: 'UNEXPECTED_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            parserVersion: 'unknown',
            timestamp: new Date().toISOString(),
          });
          job.progress.filesFailed++;
        }
      }

      // Process deleted files
      for (const file of changes.deleted) {
        await this.indexStore.deleteFile(file.id);
        // Delete associated symbols, references, chunks
        const symbols = await this.indexStore.getSymbolsByFile(file.id);
        for (const symbol of symbols) {
          await this.indexStore.deleteSymbol(symbol.id);
        }
      }

      // Process renamed files
      for (const rename of changes.renamed) {
        // Update file path in index
        await this.indexStore.saveFile(rename.file);
      }

      job.progress.symbolsExtracted = updatedSymbols.length;
      job.progress.relationshipsExtracted = updatedReferences.length;
      job.progress.chunksCreated = updatedChunks.length;

      // Phase 3: Update dependencies
      await this.indexStore.updateJobStatus(jobId, 'INDEXING');
      const allSymbols = [...previousIndex.symbols, ...updatedSymbols];
      const allReferences = [...previousIndex.references, ...updatedReferences];
      const dependencies = this.dependencyAnalyzer.analyzeModuleDependencies(allSymbols, allReferences);
      job.progress.dependenciesResolved = dependencies.length;

      // Phase 4: Save updates
      for (const symbol of updatedSymbols) {
        await this.indexStore.saveSymbol(symbol);
      }
      for (const reference of updatedReferences) {
        await this.indexStore.saveReference(reference);
      }
      for (const chunk of updatedChunks) {
        await this.indexStore.saveChunk(chunk);
      }
      for (const dependency of dependencies) {
        await this.indexStore.saveDependency(dependency);
      }

      // Update index
      const updatedIndex: CodeIndex = {
        ...previousIndex,
        commitSha: this.config.commitSha,
        files: newFiles,
        symbols: allSymbols,
        references: allReferences,
        dependencies,
        chunks: [...previousIndex.chunks, ...updatedChunks],
        updatedAt: new Date().toISOString(),
      };

      await this.indexStore.saveIndex(updatedIndex);

      // Complete job
      const finalStatus: IndexJobStatus = job.errors.length > 0 ? 'COMPLETED_WITH_WARNINGS' : 'COMPLETED';
      await this.indexStore.updateJobStatus(jobId, finalStatus, job.progress);
      job.status = finalStatus;
      job.completedAt = new Date().toISOString();

      return job;
    } catch (error) {
      job.status = 'FAILED';
      job.completedAt = new Date().toISOString();
      job.errors.push({
        fileId: '',
        filePath: '',
        parser: 'pipeline',
        errorType: 'PIPELINE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        parserVersion: 'unknown',
        timestamp: new Date().toISOString(),
      });
      await this.indexStore.saveJob(job);
      return job;
    }
  }
}
