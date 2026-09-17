import { CodeSymbol, CodeReference, CodeFile, CodeChunk, CodeDependency } from '../../../types/code-index';
import { IndexStore } from '../store/IndexStore';

/**
 * CodeIndexQuery - مسئول query کردن Code Index
 * 
 * APIهای اصلی:
 * - findFile(path)
 * - findSymbol(name)
 * - findSymbolByQualifiedName(name)
 * - findMethods(class)
 * - findReferences(symbol)
 * - findCallers(symbol)
 * - findCallees(symbol)
 * - findImplementations(interface)
 * - findSubclasses(class)
 * - findDependencies(module)
 * - findDependents(module)
 */

export class CodeIndexQuery {
  private indexStore: IndexStore;

  constructor(indexStore: IndexStore) {
    this.indexStore = indexStore;
  }

  /**
   * Find file by path
   */
  async findFile(projectId: string, path: string): Promise<CodeFile | null> {
    const files = await this.indexStore.getFilesByProject(projectId);
    return files.find(f => f.path === path) || null;
  }

  /**
   * Find symbol by name (partial match)
   */
  async findSymbol(projectId: string, name: string): Promise<CodeSymbol[]> {
    const symbols = await this.indexStore.getSymbolsByProject(projectId);
    return symbols.filter(s => 
      s.name.toLowerCase().includes(name.toLowerCase()) ||
      s.qualifiedName.toLowerCase().includes(name.toLowerCase())
    );
  }

  /**
   * Find symbol by exact qualified name
   */
  async findSymbolByQualifiedName(qualifiedName: string): Promise<CodeSymbol | null> {
    return this.indexStore.findSymbolByQualifiedName(qualifiedName);
  }

  /**
   * Find all methods in a class
   */
  async findMethods(projectId: string, classQualifiedName: string): Promise<CodeSymbol[]> {
    const symbols = await this.indexStore.getSymbolsByProject(projectId);
    const classSymbol = symbols.find(s => s.qualifiedName === classQualifiedName);
    
    if (!classSymbol) return [];
    
    return symbols.filter(s => 
      s.type === 'METHOD' && s.parentSymbolId === classSymbol.id
    );
  }

  /**
   * Find all references to a symbol
   */
  async findReferences(qualifiedName: string): Promise<CodeReference[]> {
    return this.indexStore.findReferencesToSymbol(qualifiedName);
  }

  /**
   * Find all callers of a method
   */
  async findCallers(qualifiedName: string): Promise<CodeReference[]> {
    const references = await this.indexStore.findReferencesToSymbol(qualifiedName);
    return references.filter(r => r.relationshipType === 'CALLS');
  }

  /**
   * Find all methods called by a symbol
   */
  async findCallees(projectId: string, sourceSymbolId: string): Promise<CodeReference[]> {
    const references = await this.indexStore.getReferencesByProject(projectId);
    return references.filter(r => 
      r.relationshipType === 'CALLS' && r.sourceSymbolId === sourceSymbolId
    );
  }

  /**
   * Find all implementations of an interface
   */
  async findImplementations(interfaceQualifiedName: string): Promise<CodeReference[]> {
    const references = await this.indexStore.findReferencesToSymbol(interfaceQualifiedName);
    return references.filter(r => r.relationshipType === 'IMPLEMENTS');
  }

  /**
   * Find all subclasses of a class
   */
  async findSubclasses(classQualifiedName: string): Promise<CodeReference[]> {
    const references = await this.indexStore.findReferencesToSymbol(classQualifiedName);
    return references.filter(r => r.relationshipType === 'EXTENDS');
  }

  /**
   * Find all dependencies of a module
   */
  async findDependencies(projectId: string, moduleId: string): Promise<CodeDependency[]> {
    const dependencies = await this.indexStore.getDependenciesByProject(projectId);
    return dependencies.filter(d => d.sourceId === moduleId);
  }

  /**
   * Find all modules that depend on a module
   */
  async findDependents(projectId: string, moduleId: string): Promise<CodeDependency[]> {
    const dependencies = await this.indexStore.getDependenciesByProject(projectId);
    return dependencies.filter(d => d.targetId === moduleId);
  }

  /**
   * Find symbols by annotation
   */
  async findByAnnotation(projectId: string, annotation: string): Promise<CodeSymbol[]> {
    const symbols = await this.indexStore.getSymbolsByProject(projectId);
    return symbols.filter(s => s.annotations.includes(annotation));
  }

  /**
   * Find symbols by type
   */
  async findByType(projectId: string, type: CodeSymbol['type']): Promise<CodeSymbol[]> {
    const symbols = await this.indexStore.getSymbolsByProject(projectId);
    return symbols.filter(s => s.type === type);
  }

  /**
   * Find test files
   */
  async findTestFiles(projectId: string): Promise<CodeFile[]> {
    const files = await this.indexStore.getFilesByProject(projectId);
    return files.filter(f => f.isTest);
  }

  /**
   * Find files by language
   */
  async findFilesByLanguage(projectId: string, language: string): Promise<CodeFile[]> {
    const files = await this.indexStore.getFilesByProject(projectId);
    return files.filter(f => f.language === language);
  }

  /**
   * Get file with all its symbols
   */
  async getFileWithSymbols(fileId: string): Promise<{ file: CodeFile; symbols: CodeSymbol[] } | null> {
    const file = await this.indexStore.getFile(fileId);
    if (!file) return null;

    const symbols = await this.indexStore.getSymbolsByFile(fileId);
    return { file, symbols };
  }

  /**
   * Get symbol with its children (methods, fields, etc.)
   */
  async getSymbolWithChildren(symbolId: string): Promise<{ symbol: CodeSymbol; children: CodeSymbol[] } | null> {
    const symbol = await this.indexStore.getSymbol(symbolId);
    if (!symbol) return null;

    const allSymbols = await this.indexStore.getSymbolsByFile(symbol.fileId);
    const children = allSymbols.filter(s => s.parentSymbolId === symbolId);
    
    return { symbol, children };
  }
}

/**
 * CodeSearch - مسئول جستجو در Code Index
 * 
 * انواع جستجو:
 * - Lexical Search (keyword)
 * - Symbol Search
 * - Path Search
 * - Metadata Search
 * - Structural Search
 */

export class CodeSearch {
  private indexStore: IndexStore;
  private query: CodeIndexQuery;

  constructor(indexStore: IndexStore) {
    this.indexStore = indexStore;
    this.query = new CodeIndexQuery(indexStore);
  }

  /**
   * Lexical search - جستجو بر اساس متن
   */
  async lexicalSearch(projectId: string, query: string): Promise<{
    files: CodeFile[];
    symbols: CodeSymbol[];
    chunks: CodeChunk[];
  }> {
    const files = await this.indexStore.getFilesByProject(projectId);
    const symbols = await this.indexStore.getSymbolsByProject(projectId);
    const chunks = await this.indexStore.getChunksByProject(projectId);

    const queryLower = query.toLowerCase();

    const matchedFiles = files.filter(f => 
      f.path.toLowerCase().includes(queryLower) ||
      f.name.toLowerCase().includes(queryLower)
    );

    const matchedSymbols = symbols.filter(s => 
      s.name.toLowerCase().includes(queryLower) ||
      s.qualifiedName.toLowerCase().includes(queryLower)
    );

    const matchedChunks = chunks.filter(c => 
      c.content.toLowerCase().includes(queryLower)
    );

    return {
      files: matchedFiles,
      symbols: matchedSymbols,
      chunks: matchedChunks,
    };
  }

  /**
   * Symbol search - جستجو بر اساس نام symbol
   */
  async symbolSearch(projectId: string, symbolName: string): Promise<CodeSymbol[]> {
    return this.query.findSymbol(projectId, symbolName);
  }

  /**
   * Path search - جستجو بر اساس مسیر فایل
   */
  async pathSearch(projectId: string, pathPattern: string): Promise<CodeFile[]> {
    const files = await this.indexStore.getFilesByProject(projectId);
    const regex = new RegExp(pathPattern.replace(/\*/g, '.*'), 'i');
    return files.filter(f => regex.test(f.path));
  }

  /**
   * Structural search - جستجو بر اساس ساختار
   * مثال: "find all classes implementing PaymentProcessor"
   */
  async structuralSearch(
    projectId: string,
    criteria: {
      type?: CodeSymbol['type'];
      annotation?: string;
      implementsInterface?: string;
      extendsClass?: string;
    }
  ): Promise<CodeSymbol[]> {
    let results = await this.indexStore.getSymbolsByProject(projectId);

    if (criteria.type) {
      results = results.filter(s => s.type === criteria.type);
    }

    if (criteria.annotation) {
      results = results.filter(s => s.annotations.includes(criteria.annotation!));
    }

    if (criteria.implementsInterface) {
      const implementations = await this.query.findImplementations(criteria.implementsInterface);
      const implSymbolIds = new Set(implementations.map(i => i.sourceSymbolId));
      results = results.filter(s => implSymbolIds.has(s.id));
    }

    if (criteria.extendsClass) {
      const subclasses = await this.query.findSubclasses(criteria.extendsClass);
      const subclassIds = new Set(subclasses.map(s => s.sourceSymbolId));
      results = results.filter(s => subclassIds.has(s.id));
    }

    return results;
  }

  /**
   * Metadata search - جستجو بر اساس metadata
   */
  async metadataSearch(
    projectId: string,
    criteria: {
      language?: string;
      isTest?: boolean;
      isGenerated?: boolean;
      module?: string;
    }
  ): Promise<CodeFile[]> {
    let files = await this.indexStore.getFilesByProject(projectId);

    if (criteria.language) {
      files = files.filter(f => f.language === criteria.language);
    }

    if (criteria.isTest !== undefined) {
      files = files.filter(f => f.isTest === criteria.isTest);
    }

    if (criteria.isGenerated !== undefined) {
      files = files.filter(f => f.isGenerated === criteria.isGenerated);
    }

    if (criteria.module) {
      files = files.filter(f => f.module === criteria.module);
    }

    return files;
  }
}
