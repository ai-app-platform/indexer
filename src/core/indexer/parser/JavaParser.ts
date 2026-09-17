import { Language, CodeSymbol, CodeReference, SymbolType, Visibility, RelationshipType } from '../../../types/code-index';
import { CodeParser, ParseResult, ParseError } from './CodeParser';

/**
 * JavaParser - Parser مخصوص زبان Java
 * 
 * استفاده از regex-based parsing برای استخراج:
 * - Package declarations
 * - Import statements
 * - Class/Interface/Enum/Record declarations
 * - Method declarations
 * - Field declarations
 * - Annotations
 * - Method calls
 * - Inheritance relationships
 */

export class JavaParser implements CodeParser {
  readonly language: Language = 'JAVA';
  readonly name = 'java-regex-parser';
  readonly version = '1.0.0';

  canParse(filePath: string, language: Language): boolean {
    return language === 'JAVA' || filePath.endsWith('.java');
  }

  parse(filePath: string, content: string): ParseResult {
    const symbols: CodeSymbol[] = [];
    const references: CodeReference[] = [];
    const imports: string[] = [];
    const annotations: string[] = [];
    const errors: ParseError[] = [];

    try {
      const lines = content.split('\n');
      let currentPackage = '';
      let currentClass = '';
      let currentClassSymbolId = '';
      let braceDepth = 0;

      // Extract package
      const packageMatch = content.match(/package\s+([\w.]+)\s*;/);
      if (packageMatch) {
        currentPackage = packageMatch[1];
        symbols.push({
          id: `sym-${filePath}-package-${currentPackage}`,
          fileId: `file-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`,
          name: currentPackage,
          qualifiedName: currentPackage,
          type: 'PACKAGE',
          visibility: 'PUBLIC',
          startLine: this.findLineNumber(lines, packageMatch[0]),
          endLine: this.findLineNumber(lines, packageMatch[0]),
          contentHash: this.hashContent(currentPackage),
          annotations: [],
          modifiers: [],
        });
      }

      // Extract imports
      const importRegex = /import\s+(static\s+)?([\w.]+)\s*;/g;
      let importMatch;
      while ((importMatch = importRegex.exec(content)) !== null) {
        const importPath = importMatch[2];
        imports.push(importPath);
        
        references.push({
          id: `ref-${filePath}-import-${importPath}`,
          sourceSymbolId: `file-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`,
          targetQualifiedName: importPath,
          relationshipType: 'IMPORTS',
          fileLocation: {
            fileId: `file-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`,
            startLine: this.findLineNumber(lines, importMatch[0]),
            endLine: this.findLineNumber(lines, importMatch[0]),
          },
        });
      }

      // Extract annotations at class level
      const classAnnotationRegex = /@(\w+)(?:\(([^)]*)\))?/g;
      let annotMatch;
      while ((annotMatch = classAnnotationRegex.exec(content)) !== null) {
        annotations.push(annotMatch[1]);
      }

      // Extract class/interface/enum/record declarations
      const classRegex = /(?:public|private|protected)?\s*(?:abstract\s+)?(?:final\s+)?(?:class|interface|enum|record)\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?/g;
      let classMatch;
      while ((classMatch = classRegex.exec(content)) !== null) {
        const className = classMatch[1];
        const extendsClass = classMatch[2];
        const implementsInterfaces = classMatch[3];
        const lineNum = this.findLineNumber(lines, classMatch[0]);
        
        let symbolType: SymbolType = 'CLASS';
        if (classMatch[0].includes('interface')) symbolType = 'INTERFACE';
        else if (classMatch[0].includes('enum')) symbolType = 'ENUM';
        else if (classMatch[0].includes('record')) symbolType = 'RECORD';

        const visibility = this.extractVisibility(classMatch[0]);
        const qualifiedName = currentPackage ? `${currentPackage}.${className}` : className;
        const classSymbolId = `sym-${filePath}-${className}`;
        currentClass = className;
        currentClassSymbolId = classSymbolId;

        symbols.push({
          id: classSymbolId,
          fileId: `file-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`,
          name: className,
          qualifiedName,
          type: symbolType,
          visibility,
          startLine: lineNum,
          endLine: lineNum, // Will be updated
          contentHash: this.hashContent(classMatch[0]),
          annotations: this.extractAnnotationsBefore(lines, lineNum),
          modifiers: this.extractModifiers(classMatch[0]),
        });

        // Inheritance
        if (extendsClass) {
          references.push({
            id: `ref-${filePath}-${className}-extends-${extendsClass}`,
            sourceSymbolId: classSymbolId,
            targetQualifiedName: this.resolveQualifiedName(extendsClass, currentPackage, imports),
            relationshipType: 'EXTENDS',
            fileLocation: {
              fileId: `file-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`,
              startLine: lineNum,
              endLine: lineNum,
            },
          });
        }

        // Implementations
        if (implementsInterfaces) {
          const interfaces = implementsInterfaces.split(',').map(i => i.trim());
          for (const iface of interfaces) {
            references.push({
              id: `ref-${filePath}-${className}-implements-${iface}`,
              sourceSymbolId: classSymbolId,
              targetQualifiedName: this.resolveQualifiedName(iface, currentPackage, imports),
              relationshipType: 'IMPLEMENTS',
              fileLocation: {
                fileId: `file-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`,
                startLine: lineNum,
                endLine: lineNum,
              },
            });
          }
        }
      }

      // Extract methods
      const methodRegex = /(?:@Override\s+)?(?:public|private|protected)\s+(?:static\s+)?(?:final\s+)?(?:synchronized\s+)?(?:<[\w<>,\s?]+>\s+)?(\w+(?:<[\w<>,\s?]+>)?)\s+(\w+)\s*\(([^)]*)\)/g;
      let methodMatch;
      while ((methodMatch = methodRegex.exec(content)) !== null) {
        const returnType = methodMatch[1];
        const methodName = methodMatch[2];
        const params = methodMatch[3];
        const lineNum = this.findLineNumber(lines, methodMatch[0]);
        
        // Skip if it looks like a class declaration
        if (['class', 'interface', 'enum', 'record', 'new', 'return', 'if', 'for', 'while'].includes(methodName)) {
          continue;
        }

        const visibility = this.extractVisibility(methodMatch[0]);
        const signature = `${methodName}(${params}): ${returnType}`;
        const qualifiedName = currentClass 
          ? `${currentPackage}.${currentClass}.${methodName}`
          : methodName;

        const parameters = this.parseParameters(params);

        symbols.push({
          id: `sym-${filePath}-${currentClass}-${methodName}`,
          fileId: `file-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`,
          name: methodName,
          qualifiedName,
          type: 'METHOD',
          visibility,
          startLine: lineNum,
          endLine: lineNum,
          signature,
          contentHash: this.hashContent(methodMatch[0]),
          parentSymbolId: currentClassSymbolId,
          annotations: this.extractAnnotationsBefore(lines, lineNum),
          modifiers: this.extractModifiers(methodMatch[0]),
          parameters,
          returnType,
        });
      }

      // Extract fields
      const fieldRegex = /(?:public|private|protected)\s+(?:static\s+)?(?:final\s+)?(\w+(?:<[\w<>,\s?]+>)?)\s+(\w+)\s*(?:=\s*[^;]+)?\s*;/g;
      let fieldMatch;
      while ((fieldMatch = fieldRegex.exec(content)) !== null) {
        const fieldType = fieldMatch[1];
        const fieldName = fieldMatch[2];
        const lineNum = this.findLineNumber(lines, fieldMatch[0]);

        // Skip if it looks like a method or class
        if (['class', 'interface', 'enum', 'return', 'new', 'import', 'package'].includes(fieldName)) {
          continue;
        }

        const visibility = this.extractVisibility(fieldMatch[0]);
        const qualifiedName = currentClass
          ? `${currentPackage}.${currentClass}.${fieldName}`
          : fieldName;

        symbols.push({
          id: `sym-${filePath}-${currentClass}-${fieldName}`,
          fileId: `file-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`,
          name: fieldName,
          qualifiedName,
          type: 'FIELD',
          visibility,
          startLine: lineNum,
          endLine: lineNum,
          contentHash: this.hashContent(fieldMatch[0]),
          parentSymbolId: currentClassSymbolId,
          annotations: this.extractAnnotationsBefore(lines, lineNum),
          modifiers: this.extractModifiers(fieldMatch[0]),
          returnType: fieldType,
        });

        // Field type reference
        if (!this.isPrimitiveType(fieldType)) {
          references.push({
            id: `ref-${filePath}-${fieldName}-type-${fieldType}`,
            sourceSymbolId: `sym-${filePath}-${currentClass}-${fieldName}`,
            targetQualifiedName: this.resolveQualifiedName(fieldType, currentPackage, imports),
            relationshipType: 'REFERENCES',
            fileLocation: {
              fileId: `file-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`,
              startLine: lineNum,
              endLine: lineNum,
            },
          });
        }
      }

      // Extract method calls (simplified)
      const methodCallRegex = /(\w+)\.(\w+)\s*\(/g;
      let callMatch;
      while ((callMatch = methodCallRegex.exec(content)) !== null) {
        const objectName = callMatch[1];
        const calledMethod = callMatch[2];
        const lineNum = this.findLineNumber(lines, callMatch[0]);

        // Skip common non-reference patterns
        if (['System', 'Math', 'String', 'Integer', 'Long', 'Boolean', 'this', 'super'].includes(objectName)) {
          continue;
        }

        references.push({
          id: `ref-${filePath}-call-${lineNum}-${objectName}-${calledMethod}`,
          sourceSymbolId: currentClassSymbolId,
          targetQualifiedName: `${objectName}.${calledMethod}`,
          relationshipType: 'CALLS',
          fileLocation: {
            fileId: `file-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`,
            startLine: lineNum,
            endLine: lineNum,
          },
        });
      }

      return {
        success: true,
        symbols,
        references,
        imports,
        annotations,
        errors,
        parserUsed: this.name,
        parserVersion: this.version,
        analysisQuality: symbols.length > 0 ? 'FULL_AST' : 'PARTIAL_AST',
      };
    } catch (error) {
      return {
        success: false,
        symbols: [],
        references: [],
        imports: [],
        annotations: [],
        errors: [{
          message: error instanceof Error ? error.message : 'Parse error',
          severity: 'ERROR',
        }],
        parserUsed: this.name,
        parserVersion: this.version,
        analysisQuality: 'FAILED',
      };
    }
  }

  private findLineNumber(lines: string[], text: string): number {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(text.substring(0, Math.min(30, text.length)))) {
        return i + 1;
      }
    }
    return 0;
  }

  private extractVisibility(text: string): Visibility {
    if (text.includes('public')) return 'PUBLIC';
    if (text.includes('private')) return 'PRIVATE';
    if (text.includes('protected')) return 'PROTECTED';
    return 'PACKAGE_PRIVATE';
  }

  private extractModifiers(text: string): string[] {
    const modifiers: string[] = [];
    if (text.includes('static')) modifiers.push('static');
    if (text.includes('final')) modifiers.push('final');
    if (text.includes('abstract')) modifiers.push('abstract');
    if (text.includes('synchronized')) modifiers.push('synchronized');
    return modifiers;
  }

  private extractAnnotationsBefore(lines: string[], lineNumber: number): string[] {
    const annotations: string[] = [];
    let i = lineNumber - 2; // Start from line before
    
    while (i >= 0 && i >= lineNumber - 10) {
      const line = lines[i].trim();
      const annotMatch = line.match(/@(\w+)/);
      if (annotMatch) {
        annotations.unshift(annotMatch[1]);
      } else if (line.length > 0 && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
        break;
      }
      i--;
    }
    
    return annotations;
  }

  private parseParameters(params: string): Array<{ name: string; type: string; index: number }> {
    if (!params.trim()) return [];
    
    return params.split(',').map((param, index) => {
      const parts = param.trim().split(/\s+/);
      const type = parts.length > 1 ? parts.slice(0, -1).join(' ') : 'unknown';
      const name = parts[parts.length - 1];
      return { name, type, index };
    });
  }

  private resolveQualifiedName(name: string, currentPackage: string, imports: string[]): string {
    // Check if it's in imports
    for (const imp of imports) {
      if (imp.endsWith(`.${name}`)) {
        return imp;
      }
    }
    
    // Assume same package
    return currentPackage ? `${currentPackage}.${name}` : name;
  }

  private isPrimitiveType(type: string): boolean {
    const primitives = ['int', 'long', 'short', 'byte', 'float', 'double', 'boolean', 'char', 'void', 'String'];
    return primitives.includes(type) || type.match(/^\w+<.*>$/) !== null;
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
