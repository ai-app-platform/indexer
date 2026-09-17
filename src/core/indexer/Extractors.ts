import { CodeSymbol, CodeReference, RelationshipType, CodeDependency, CodeChunk, Language } from '../../types/code-index';
import { ParseResult } from './parser/CodeParser';

/**
 * SymbolExtractor - مسئول استخراج و مدیریت Symbolها
 * 
 * مسئولیت‌ها:
 * - استخراج Symbol از ParseResult
 * - تولید Stable Symbol ID
 * - مدیریت Parent-Child relationships
 * - محاسبه Signature
 */

export class SymbolExtractor {
  /**
   * Extract symbols from parse result
   */
  extractSymbols(fileId: string, parseResult: ParseResult): CodeSymbol[] {
    return parseResult.symbols.map(symbol => ({
      ...symbol,
      id: this.generateStableId(symbol),
    }));
  }

  /**
   * Generate stable symbol ID
   * Format: project + repository + language + fullyQualifiedName + symbolType
   */
  generateStableId(symbol: CodeSymbol): string {
    const parts = [
      symbol.qualifiedName,
      symbol.type,
    ];
    
    if (symbol.signature) {
      parts.push(symbol.signature);
    }
    
    return `sym-${parts.join('|').replace(/[^a-zA-Z0-9|.-]/g, '_')}`;
  }

  /**
   * Generate method signature
   */
  generateMethodSignature(
    name: string,
    parameters: Array<{ name: string; type: string }>,
    returnType: string
  ): string {
    const paramTypes = parameters.map(p => p.type).join(', ');
    return `${name}(${paramTypes}): ${returnType}`;
  }

  /**
   * Find symbol by qualified name
   */
  findByQualifiedName(symbols: CodeSymbol[], qualifiedName: string): CodeSymbol | undefined {
    return symbols.find(s => s.qualifiedName === qualifiedName);
  }

  /**
   * Find symbols by type
   */
  findByType(symbols: CodeSymbol[], type: CodeSymbol['type']): CodeSymbol[] {
    return symbols.filter(s => s.type === type);
  }

  /**
   * Find child symbols
   */
  findChildren(symbols: CodeSymbol[], parentId: string): CodeSymbol[] {
    return symbols.filter(s => s.parentSymbolId === parentId);
  }

  /**
   * Find symbols by annotation
   */
  findByAnnotation(symbols: CodeSymbol[], annotation: string): CodeSymbol[] {
    return symbols.filter(s => s.annotations.includes(annotation));
  }
}

/**
 * RelationshipExtractor - مسئول استخراج روابط بین Symbolها
 */
export class RelationshipExtractor {
  /**
   * Extract relationships from parse result
   */
  extractRelationships(fileId: string, parseResult: ParseResult): CodeReference[] {
    return parseResult.references;
  }

  /**
   * Build call graph
   */
  buildCallGraph(references: CodeReference[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const ref of references) {
      if (ref.relationshipType === 'CALLS') {
        const callers = graph.get(ref.targetQualifiedName) || [];
        callers.push(ref.sourceSymbolId);
        graph.set(ref.targetQualifiedName, callers);
      }
    }
    
    return graph;
  }

  /**
   * Build import graph
   */
  buildImportGraph(references: CodeReference[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const ref of references) {
      if (ref.relationshipType === 'IMPORTS') {
        const importers = graph.get(ref.targetQualifiedName) || [];
        importers.push(ref.sourceSymbolId);
        graph.set(ref.targetQualifiedName, importers);
      }
    }
    
    return graph;
  }

  /**
   * Build inheritance graph
   */
  buildInheritanceGraph(references: CodeReference[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const ref of references) {
      if (ref.relationshipType === 'EXTENDS' || ref.relationshipType === 'IMPLEMENTS') {
        const children = graph.get(ref.targetQualifiedName) || [];
        children.push(ref.sourceSymbolId);
        graph.set(ref.targetQualifiedName, children);
      }
    }
    
    return graph;
  }

  /**
   * Find callers of a symbol
   */
  findCallers(references: CodeReference[], symbolQualifiedName: string): CodeReference[] {
    return references.filter(
      ref => ref.relationshipType === 'CALLS' && ref.targetQualifiedName === symbolQualifiedName
    );
  }

  /**
   * Find callees of a symbol
   */
  findCallees(references: CodeReference[], sourceSymbolId: string): CodeReference[] {
    return references.filter(
      ref => ref.relationshipType === 'CALLS' && ref.sourceSymbolId === sourceSymbolId
    );
  }

  /**
   * Find implementations of an interface
   */
  findImplementations(references: CodeReference[], interfaceQualifiedName: string): CodeReference[] {
    return references.filter(
      ref => ref.relationshipType === 'IMPLEMENTS' && ref.targetQualifiedName === interfaceQualifiedName
    );
  }

  /**
   * Find subclasses
   */
  findSubclasses(references: CodeReference[], classQualifiedName: string): CodeReference[] {
    return references.filter(
      ref => ref.relationshipType === 'EXTENDS' && ref.targetQualifiedName === classQualifiedName
    );
  }
}

/**
 * DependencyAnalyzer - مسئول تحلیل وابستگی‌ها
 */
export class DependencyAnalyzer {
  /**
   * Analyze module dependencies
   */
  analyzeModuleDependencies(
    symbols: CodeSymbol[],
    references: CodeReference[]
  ): CodeDependency[] {
    const dependencies: CodeDependency[] = [];
    const moduleMap = new Map<string, Set<string>>();

    // Group symbols by module
    for (const symbol of symbols) {
      const module = this.extractModule(symbol.qualifiedName);
      if (module) {
        if (!moduleMap.has(module)) {
          moduleMap.set(module, new Set());
        }
        moduleMap.get(module)!.add(symbol.qualifiedName);
      }
    }

    // Find cross-module references
    for (const ref of references) {
      const sourceModule = this.extractModuleFromSymbol(symbols, ref.sourceSymbolId);
      const targetModule = this.extractModule(ref.targetQualifiedName);

      if (sourceModule && targetModule && sourceModule !== targetModule) {
        dependencies.push({
          id: `dep-${sourceModule}-${targetModule}`,
          sourceId: sourceModule,
          sourceType: 'MODULE',
          targetId: targetModule,
          targetType: 'MODULE',
          dependencyType: 'COMPILE',
          isExternal: false,
        });
      }
    }

    // Deduplicate
    const uniqueDeps = new Map<string, CodeDependency>();
    for (const dep of dependencies) {
      uniqueDeps.set(dep.id, dep);
    }

    return Array.from(uniqueDeps.values());
  }

  /**
   * Detect circular dependencies
   */
  detectCircularDependencies(dependencies: CodeDependency[]): string[][] {
    const graph = new Map<string, Set<string>>();
    
    // Build adjacency list
    for (const dep of dependencies) {
      if (!graph.has(dep.sourceId)) {
        graph.set(dep.sourceId, new Set());
      }
      graph.get(dep.sourceId)!.add(dep.targetId);
    }

    // DFS to find cycles
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        this.dfsForCycles(node, graph, visited, recursionStack, [], cycles);
      }
    }

    return cycles;
  }

  private dfsForCycles(
    node: string,
    graph: Map<string, Set<string>>,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[],
    cycles: string[][]
  ): void {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        this.dfsForCycles(neighbor, graph, visited, recursionStack, [...path], cycles);
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart >= 0) {
          cycles.push(path.slice(cycleStart));
        }
      }
    }

    recursionStack.delete(node);
  }

  private extractModule(qualifiedName: string): string | undefined {
    const parts = qualifiedName.split('.');
    if (parts.length >= 3) {
      return parts.slice(0, 3).join('.');
    }
    return undefined;
  }

  private extractModuleFromSymbol(symbols: CodeSymbol[], symbolId: string): string | undefined {
    const symbol = symbols.find(s => s.id === symbolId);
    if (symbol) {
      return this.extractModule(symbol.qualifiedName);
    }
    return undefined;
  }
}

/**
 * CodeChunker - مسئول تقسیم کد به Chunkهای قابل جستجو
 */
export class CodeChunker {
  /**
   * Chunk a file based on symbols (structure-aware chunking)
   */
  chunkFile(
    fileId: string,
    content: string,
    symbols: CodeSymbol[],
    metadata: {
      projectId: string;
      repository: string;
      branch: string;
      commitSha: string;
      filePath: string;
      language: Language;
      module?: string;
      package?: string;
      parserVersion?: string;
      indexVersion: number;
    }
  ): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    const lines = content.split('\n');

    // If we have symbols, chunk by symbol
    if (symbols.length > 0) {
      // Class-level chunk
      const classSymbols = symbols.filter(s => 
        ['CLASS', 'INTERFACE', 'ENUM', 'RECORD'].includes(s.type)
      );

      for (const classSymbol of classSymbols) {
        const classContent = this.extractSymbolContent(lines, classSymbol);
        chunks.push({
          id: `chunk-${fileId}-${classSymbol.id}`,
          fileId,
          symbolId: classSymbol.id,
          content: classContent,
          startLine: classSymbol.startLine,
          endLine: classSymbol.endLine,
          contentHash: this.hashContent(classContent),
          metadata: {
            ...metadata,
            symbol: classSymbol.qualifiedName,
            symbolType: classSymbol.type,
          },
        });
      }

      // Method-level chunks
      const methodSymbols = symbols.filter(s => s.type === 'METHOD');
      for (const methodSymbol of methodSymbols) {
        const methodContent = this.extractSymbolContent(lines, methodSymbol);
        chunks.push({
          id: `chunk-${fileId}-${methodSymbol.id}`,
          fileId,
          symbolId: methodSymbol.id,
          content: methodContent,
          startLine: methodSymbol.startLine,
          endLine: methodSymbol.endLine,
          contentHash: this.hashContent(methodContent),
          metadata: {
            ...metadata,
            symbol: methodSymbol.qualifiedName,
            symbolType: methodSymbol.type,
          },
        });
      }
    } else {
      // No symbols, chunk by fixed size
      const chunkSize = 50; // lines
      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunkLines = lines.slice(i, i + chunkSize);
        const chunkContent = chunkLines.join('\n');
        chunks.push({
          id: `chunk-${fileId}-${i}`,
          fileId,
          content: chunkContent,
          startLine: i + 1,
          endLine: Math.min(i + chunkSize, lines.length),
          contentHash: this.hashContent(chunkContent),
          metadata,
        });
      }
    }

    return chunks;
  }

  private extractSymbolContent(lines: string[], symbol: CodeSymbol): string {
    const startIdx = Math.max(0, symbol.startLine - 1);
    const endIdx = Math.min(lines.length, symbol.endLine);
    return lines.slice(startIdx, endIdx).join('\n');
  }

  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `sha256:${Math.abs(hash).toString(16).padStart(16, '0')}`;
  }
}
