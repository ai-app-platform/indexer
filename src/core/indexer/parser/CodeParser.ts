import { Language, CodeSymbol, CodeReference, RelationshipType } from '../../../types/code-index';

/**
 * CodeParser Interface - پایه تمام Parserها
 * 
 * معماری Plugin-based:
 * - هر زبان Parser مخصوص خود را دارد
 * - Core فقط با این interface کار می‌کند
 * - اضافه کردن زبان جدید نیازمند تغییر Core نیست
 */

export interface ParseResult {
  success: boolean;
  symbols: CodeSymbol[];
  references: CodeReference[];
  imports: string[];
  annotations: string[];
  errors: ParseError[];
  parserUsed: string;
  parserVersion: string;
  analysisQuality: 'FULL_AST' | 'PARTIAL_AST' | 'TEXT_ONLY' | 'FAILED';
}

export interface ParseError {
  line?: number;
  column?: number;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface CodeParser {
  /**
   * Parser language
   */
  readonly language: Language;
  
  /**
   * Parser name
   */
  readonly name: string;
  
  /**
   * Parser version
   */
  readonly version: string;

  /**
   * Parse a file and extract symbols and references
   */
  parse(filePath: string, content: string): ParseResult;

  /**
   * Check if this parser can handle the given file
   */
  canParse(filePath: string, language: Language): boolean;
}

/**
 * ParserRegistry - مدیریت و انتخاب Parser مناسب
 */
export class ParserRegistry {
  private parsers: Map<Language, CodeParser[]> = new Map();

  /**
   * Register a parser for a language
   */
  register(parser: CodeParser): void {
    const existing = this.parsers.get(parser.language) || [];
    existing.push(parser);
    this.parsers.set(parser.language, existing);
  }

  /**
   * Get the best parser for a language
   */
  getParser(language: Language): CodeParser | undefined {
    const parsers = this.parsers.get(language);
    return parsers?.[0]; // Return first (highest priority) parser
  }

  /**
   * Get all parsers for a language (for fallback)
   */
  getAllParsers(language: Language): CodeParser[] {
    return this.parsers.get(language) || [];
  }

  /**
   * Get all registered languages
   */
  getSupportedLanguages(): Language[] {
    return Array.from(this.parsers.keys());
  }
}

/**
 * ParseOrchestrator - مسئول orchestrate کردن parsing با fallback
 */
export class ParseOrchestrator {
  private registry: ParserRegistry;

  constructor(registry: ParserRegistry) {
    this.registry = registry;
  }

  /**
   * Parse a file with fallback strategy
   * 
   * Strategy:
   * 1. Try primary parser (AST-based)
   * 2. On failure, try fallback parser (Tree-sitter)
   * 3. On failure, do text-based indexing
   */
  parse(filePath: string, content: string, language: Language): ParseResult {
    const parsers = this.registry.getAllParsers(language);

    if (parsers.length === 0) {
      return this.textBasedParse(filePath, content, language);
    }

    // Try each parser in order
    for (const parser of parsers) {
      try {
        const result = parser.parse(filePath, content);
        if (result.success || result.analysisQuality !== 'FAILED') {
          return result;
        }
      } catch (error) {
        // Continue to next parser
        console.warn(`Parser ${parser.name} failed for ${filePath}:`, error);
      }
    }

    // All parsers failed, fall back to text-based
    return this.textBasedParse(filePath, content, language);
  }

  /**
   * Text-based fallback parsing
   */
  private textBasedParse(filePath: string, content: string, language: Language): ParseResult {
    const lines = content.split('\n');
    const symbols: CodeSymbol[] = [];
    const references: CodeReference[] = [];
    const imports: string[] = [];

    // Basic text-based extraction
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect imports
      if (line.startsWith('import ') || line.startsWith('from ')) {
        imports.push(line);
      }
    }

    return {
      success: true,
      symbols,
      references,
      imports,
      annotations: [],
      errors: [],
      parserUsed: 'text-based',
      parserVersion: '1.0.0',
      analysisQuality: 'TEXT_ONLY',
    };
  }
}
