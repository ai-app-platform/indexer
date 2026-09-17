// FileFilter - مسئول فیلتر کردن فایل‌ها برای ایندکس

/**
 * FileFilter - مسئول فیلتر کردن فایل‌ها برای ایندکس
 * 
 * مسئولیت‌ها:
 * - تشخیص فایل‌های قابل ایندکس
 * - حذف فایل‌های باینری
 * - حذف فایل‌های generated
 * - حذف فایل‌های در لیست exclude
 */

const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'svg', 'webp',
  'zip', 'tar', 'gz', 'rar', '7z',
  'jar', 'war', 'ear',
  'pdf', 'doc', 'docx', 'xls', 'xlsx',
  'exe', 'dll', 'so', 'dylib',
  'mp3', 'mp4', 'avi', 'mov', 'wav',
  'ttf', 'otf', 'woff', 'woff2', 'eot',
  'class', 'pyc', 'pyo',
]);

const DEFAULT_EXCLUDE_PATTERNS = [
  '.git',
  '.svn',
  '.hg',
  'node_modules',
  'target',
  'build',
  'dist',
  '.idea',
  '.vscode',
  'coverage',
  'generated',
  'vendor',
  '__pycache__',
  '.next',
  '.nuxt',
  '.cache',
  'tmp',
  'temp',
];

const GENERATED_PATH_PATTERNS = [
  'generated/',
  'build/generated/',
  'target/generated-sources/',
  'generated-sources/',
  '.generated/',
];

export interface FileFilterConfig {
  include?: string[];
  exclude?: string[];
  includeGenerated?: boolean;
  includeBinary?: boolean;
  maxFileSize?: number; // in bytes
}

export interface FileFilterResult {
  included: boolean;
  reason?: string;
}

export class FileFilter {
  private config: FileFilterConfig;
  private excludePatterns: string[];

  constructor(config: FileFilterConfig = {}) {
    this.config = {
      includeGenerated: false,
      includeBinary: false,
      maxFileSize: 5 * 1024 * 1024, // 5MB default
      ...config,
    };
    this.excludePatterns = [
      ...DEFAULT_EXCLUDE_PATTERNS,
      ...(config.exclude || []),
    ];
  }

  filter(filePath: string, fileSize: number = 0): FileFilterResult {
    // Check file size
    if (this.config.maxFileSize && fileSize > this.config.maxFileSize) {
      return { included: false, reason: 'FILE_TOO_LARGE' };
    }

    // Check exclude patterns
    if (this.isExcluded(filePath)) {
      return { included: false, reason: 'EXCLUDED_PATTERN' };
    }

    // Check binary files
    if (!this.config.includeBinary && this.isBinaryFile(filePath)) {
      return { included: false, reason: 'BINARY_FILE' };
    }

    // Check generated files
    if (!this.config.includeGenerated && this.isGeneratedFile(filePath)) {
      return { included: false, reason: 'GENERATED_FILE' };
    }

    // Check include patterns
    if (this.config.include && this.config.include.length > 0) {
      if (!this.matchesIncludePattern(filePath)) {
        return { included: false, reason: 'NOT_IN_INCLUDE_PATTERN' };
      }
    }

    return { included: true };
  }

  private isExcluded(filePath: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');
    return this.excludePatterns.some(pattern => {
      const normalizedPattern = pattern.replace(/\\/g, '/');
      return normalizedPath.includes(normalizedPattern);
    });
  }

  isBinaryFile(filePath: string): boolean {
    const extension = this.getExtension(filePath).toLowerCase();
    return BINARY_EXTENSIONS.has(extension);
  }

  isGeneratedFile(filePath: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
    return GENERATED_PATH_PATTERNS.some(pattern => 
      normalizedPath.includes(pattern.toLowerCase())
    );
  }

  private matchesIncludePattern(filePath: string): boolean {
    if (!this.config.include) return true;
    
    const normalizedPath = filePath.replace(/\\/g, '/');
    return this.config.include.some(pattern => {
      const regex = this.globToRegex(pattern);
      return regex.test(normalizedPath);
    });
  }

  private globToRegex(glob: string): RegExp {
    const normalizedGlob = glob.replace(/\\/g, '/');
    const regexStr = normalizedGlob
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '<<<DOUBLE_STAR>>>')
      .replace(/\*/g, '[^/]*')
      .replace(/<<<DOUBLE_STAR>>>/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${regexStr}$`);
  }

  private getExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf('.');
    return lastDot > 0 ? filePath.substring(lastDot + 1) : '';
  }
}
