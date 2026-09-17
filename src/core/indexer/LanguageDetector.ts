import { Language } from '../../types/code-index';

/**
 * LanguageDetector - مسئول تشخیص زبان فایل بر اساس extension و content
 * 
 * معماری Plugin-based:
 * - هر زبان یک LanguagePlugin دارد
 * - LanguageDetector از registry استفاده می‌کند
 * - اضافه کردن زبان جدید نیازمند تغییر Core نیست
 */

export interface LanguagePlugin {
  language: Language;
  extensions: string[];
  filenames?: string[];
  detectFromContent?: (content: string) => boolean;
}

// Registry of language plugins
const LANGUAGE_PLUGINS: LanguagePlugin[] = [
  {
    language: 'JAVA',
    extensions: ['java'],
    filenames: [],
    detectFromContent: (content) => content.includes('public class') || content.includes('package '),
  },
  {
    language: 'KOTLIN',
    extensions: ['kt', 'kts'],
    filenames: [],
    detectFromContent: (content) => content.includes('fun ') || content.includes('val ') || content.includes('var '),
  },
  {
    language: 'JAVASCRIPT',
    extensions: ['js', 'jsx', 'mjs', 'cjs'],
    filenames: ['package.json'],
    detectFromContent: (content) => content.includes('function ') || content.includes('const ') || content.includes('let '),
  },
  {
    language: 'TYPESCRIPT',
    extensions: ['ts', 'tsx', 'mts', 'cts'],
    filenames: ['tsconfig.json'],
    detectFromContent: (content) => content.includes('interface ') || content.includes(': string') || content.includes('type '),
  },
  {
    language: 'PYTHON',
    extensions: ['py', 'pyi', 'pyx'],
    filenames: ['setup.py', 'pyproject.toml', 'requirements.txt'],
    detectFromContent: (content) => content.includes('def ') || content.includes('import ') || content.includes('class '),
  },
  {
    language: 'GO',
    extensions: ['go'],
    filenames: ['go.mod', 'go.sum'],
    detectFromContent: (content) => content.includes('package ') && content.includes('func '),
  },
  {
    language: 'RUST',
    extensions: ['rs'],
    filenames: ['Cargo.toml', 'Cargo.lock'],
    detectFromContent: (content) => content.includes('fn ') || content.includes('impl ') || content.includes('struct '),
  },
  {
    language: 'C',
    extensions: ['c', 'h'],
    filenames: [],
    detectFromContent: (content) => content.includes('#include') || content.includes('int main'),
  },
  {
    language: 'CPP',
    extensions: ['cpp', 'cc', 'cxx', 'hpp', 'hxx'],
    filenames: [],
    detectFromContent: (content) => content.includes('#include') && (content.includes('class ') || content.includes('namespace ')),
  },
  {
    language: 'CSHARP',
    extensions: ['cs'],
    filenames: [],
    detectFromContent: (content) => content.includes('namespace ') && content.includes('class '),
  },
  {
    language: 'PHP',
    extensions: ['php', 'phtml'],
    filenames: ['composer.json'],
    detectFromContent: (content) => content.includes('<?php'),
  },
  {
    language: 'RUBY',
    extensions: ['rb', 'erb'],
    filenames: ['Gemfile', 'Rakefile'],
    detectFromContent: (content) => content.includes('def ') && content.includes('end'),
  },
  {
    language: 'SWIFT',
    extensions: ['swift'],
    filenames: ['Package.swift'],
    detectFromContent: (content) => content.includes('import ') && content.includes('func '),
  },
];

export class LanguageDetector {
  private plugins: LanguagePlugin[];
  private extensionMap: Map<string, Language>;

  constructor(additionalPlugins: LanguagePlugin[] = []) {
    this.plugins = [...LANGUAGE_PLUGINS, ...additionalPlugins];
    this.extensionMap = this.buildExtensionMap();
  }

  private buildExtensionMap(): Map<string, Language> {
    const map = new Map<string, Language>();
    for (const plugin of this.plugins) {
      for (const ext of plugin.extensions) {
        map.set(ext.toLowerCase(), plugin.language);
      }
    }
    return map;
  }

  /**
   * Detect language from file path
   */
  detectFromPath(filePath: string): Language {
    const extension = this.getExtension(filePath).toLowerCase();
    return this.extensionMap.get(extension) || 'UNKNOWN';
  }

  /**
   * Detect language from filename (for special files like package.json)
   */
  detectFromFilename(filename: string): Language {
    for (const plugin of this.plugins) {
      if (plugin.filenames?.includes(filename)) {
        return plugin.language;
      }
    }
    return 'UNKNOWN';
  }

  /**
   * Detect language from file content
   */
  detectFromContent(content: string, filePath: string): Language {
    // First try extension-based detection
    const extLanguage = this.detectFromPath(filePath);
    if (extLanguage !== 'UNKNOWN') {
      return extLanguage;
    }

    // Then try filename-based detection
    const filename = this.getFilename(filePath);
    const filenameLanguage = this.detectFromFilename(filename);
    if (filenameLanguage !== 'UNKNOWN') {
      return filenameLanguage;
    }

    // Finally try content-based detection
    for (const plugin of this.plugins) {
      if (plugin.detectFromContent && plugin.detectFromContent(content)) {
        return plugin.language;
      }
    }

    return 'UNKNOWN';
  }

  /**
   * Full detection with priority: extension > filename > content
   */
  detect(filePath: string, content?: string): Language {
    // Priority 1: Extension
    const extLanguage = this.detectFromPath(filePath);
    if (extLanguage !== 'UNKNOWN') {
      return extLanguage;
    }

    // Priority 2: Filename
    const filename = this.getFilename(filePath);
    const filenameLanguage = this.detectFromFilename(filename);
    if (filenameLanguage !== 'UNKNOWN') {
      return filenameLanguage;
    }

    // Priority 3: Content
    if (content) {
      return this.detectFromContent(content, filePath);
    }

    return 'UNKNOWN';
  }

  /**
   * Register a new language plugin
   */
  registerPlugin(plugin: LanguagePlugin): void {
    this.plugins.push(plugin);
    for (const ext of plugin.extensions) {
      this.extensionMap.set(ext.toLowerCase(), plugin.language);
    }
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): Language[] {
    return [...new Set(this.plugins.map(p => p.language))];
  }

  /**
   * Get plugin for a language
   */
  getPlugin(language: Language): LanguagePlugin | undefined {
    return this.plugins.find(p => p.language === language);
  }

  private getExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf('.');
    return lastDot > 0 ? filePath.substring(lastDot + 1) : '';
  }

  private getFilename(filePath: string): string {
    const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
    return lastSlash >= 0 ? filePath.substring(lastSlash + 1) : filePath;
  }
}
