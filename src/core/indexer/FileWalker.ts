import { Language, CodeFile, AnalysisStatus } from '../../types/code-index';
import { FileFilter, FileFilterConfig } from './FileFilter';
import { LanguageDetector } from './LanguageDetector';

/**
 * FileWalker - مسئول پیمایش فایل‌ها و ساخت لیست فایل‌های قابل ایندکس
 * 
 * مسئولیت‌ها:
 * - پیمایش ساختار فایل
 * - تشخیص زبان هر فایل
 * - محاسبه content hash
 * - ساخت CodeFile objects
 */

export interface FileEntry {
  path: string;
  name: string;
  size: number;
  content?: string;
  lastModified: string;
}

export interface FileWalkerConfig {
  filterConfig?: FileFilterConfig;
  projectId: string;
  repositoryId: string;
  commitSha: string;
}

export interface FileDiscoveryResult {
  files: CodeFile[];
  totalSize: number;
  languages: Record<Language, number>;
  errors: Array<{ path: string; error: string }>;
}

export class FileWalker {
  private fileFilter: FileFilter;
  private languageDetector: LanguageDetector;
  private config: FileWalkerConfig;

  constructor(config: FileWalkerConfig) {
    this.config = config;
    this.fileFilter = new FileFilter(config.filterConfig);
    this.languageDetector = new LanguageDetector();
  }

  /**
   * Walk through file entries and create CodeFile objects
   */
  walk(fileEntries: FileEntry[]): FileDiscoveryResult {
    const files: CodeFile[] = [];
    const languages: Record<Language, number> = {} as Record<Language, number>;
    const errors: Array<{ path: string; error: string }> = [];
    let totalSize = 0;

    for (const entry of fileEntries) {
      try {
        const filterResult = this.fileFilter.filter(entry.path, entry.size);
        
        if (!filterResult.included) {
          continue;
        }

        const language = this.languageDetector.detect(entry.path, entry.content);
        const contentHash = this.calculateContentHash(entry.content || '');
        const isTest = this.isTestFile(entry.path);
        const isGenerated = this.fileFilter.isGeneratedFile(entry.path);

        const codeFile: CodeFile = {
          id: this.generateFileId(entry.path),
          projectId: this.config.projectId,
          repositoryId: this.config.repositoryId,
          path: entry.path,
          name: this.getFilename(entry.path),
          language,
          size: entry.size,
          contentHash,
          commitSha: this.config.commitSha,
          module: this.extractModule(entry.path),
          package: this.extractPackage(entry.path, language),
          isTest,
          isGenerated,
          analysisStatus: 'FULL_AST',
          indexVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        files.push(codeFile);
        totalSize += entry.size;

        // Count languages
        languages[language] = (languages[language] || 0) + 1;
      } catch (error) {
        errors.push({
          path: entry.path,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      files,
      totalSize,
      languages,
      errors,
    };
  }

  /**
   * Detect changes between two file lists for incremental indexing
   */
  detectChanges(
    oldFiles: CodeFile[],
    newFiles: CodeFile[]
  ): {
    added: CodeFile[];
    modified: CodeFile[];
    deleted: CodeFile[];
    renamed: Array<{ oldPath: string; newPath: string; file: CodeFile }>;
  } {
    const oldMap = new Map(oldFiles.map(f => [f.path, f]));
    const newMap = new Map(newFiles.map(f => [f.path, f]));

    const added: CodeFile[] = [];
    const modified: CodeFile[] = [];
    const deleted: CodeFile[] = [];
    const renamed: Array<{ oldPath: string; newPath: string; file: CodeFile }> = [];

    // Find added and modified files
    for (const [path, newFile] of newMap) {
      const oldFile = oldMap.get(path);
      if (!oldFile) {
        added.push(newFile);
      } else if (oldFile.contentHash !== newFile.contentHash) {
        modified.push(newFile);
      }
    }

    // Find deleted files
    for (const [path, oldFile] of oldMap) {
      if (!newMap.has(path)) {
        deleted.push(oldFile);
      }
    }

    // Detect renames (same content hash, different path)
    const deletedByHash = new Map(deleted.map(f => [f.contentHash, f]));
    const addedByHash = new Map(added.map(f => [f.contentHash, f]));

    for (const [hash, addedFile] of addedByHash) {
      const deletedFile = deletedByHash.get(hash);
      if (deletedFile) {
        renamed.push({
          oldPath: deletedFile.path,
          newPath: addedFile.path,
          file: addedFile,
        });
        // Remove from added and deleted
        const addedIndex = added.indexOf(addedFile);
        if (addedIndex >= 0) added.splice(addedIndex, 1);
        const deletedIndex = deleted.indexOf(deletedFile);
        if (deletedIndex >= 0) deleted.splice(deletedIndex, 1);
      }
    }

    return { added, modified, deleted, renamed };
  }

  private calculateContentHash(content: string): string {
    // Simple hash for demo purposes
    // In production, use SHA-256
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `sha256:${Math.abs(hash).toString(16).padStart(16, '0')}`;
  }

  private isTestFile(path: string): boolean {
    const testPatterns = [
      '/test/',
      '/tests/',
      '/__tests__/',
      '.test.',
      '.spec.',
      'Test.java',
      'Tests.java',
      '_test.py',
      '_spec.rb',
    ];
    const normalizedPath = path.toLowerCase();
    return testPatterns.some(pattern => normalizedPath.includes(pattern.toLowerCase()));
  }

  private extractModule(path: string): string | undefined {
    // Try to extract module name from path
    // For Maven/Gradle: src/main/java/com/example/module
    // For npm: packages/module-name
    const parts = path.split('/');
    
    // Check for common module patterns
    const modulePatterns = [
      { pattern: 'src/main/java', offset: 3 },
      { pattern: 'src/main/kotlin', offset: 3 },
      { pattern: 'packages', offset: 1 },
      { pattern: 'modules', offset: 1 },
    ];

    for (const { pattern, offset } of modulePatterns) {
      const patternIndex = parts.findIndex((_, i) => 
        parts.slice(i, i + pattern.split('/').length).join('/') === pattern
      );
      if (patternIndex >= 0 && patternIndex + offset < parts.length) {
        return parts[patternIndex + offset];
      }
    }

    return undefined;
  }

  private extractPackage(path: string, language: Language): string | undefined {
    if (language === 'JAVA' || language === 'KOTLIN') {
      // Extract Java/Kotlin package from path
      const srcIndex = path.indexOf('src/main/java/');
      if (srcIndex >= 0) {
        const packagePath = path.substring(srcIndex + 'src/main/java/'.length);
        const lastSlash = packagePath.lastIndexOf('/');
        if (lastSlash > 0) {
          return packagePath.substring(0, lastSlash).replace(/\//g, '.');
        }
      }
    }
    return undefined;
  }

  private generateFileId(path: string): string {
    // Generate a stable ID based on path
    return `file-${path.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
  }

  private getFilename(path: string): string {
    const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    return lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
  }
}
