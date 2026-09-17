import { CodeSymbol, CodeReference, RelationshipType } from '../../../types/code-index';
import { ParseResult } from '../parser/CodeParser';

/**
 * FrameworkAnalyzer Interface
 * 
 * هر Framework Analyzer مسئول تحلیل annotationها و patternهای خاص یک framework است.
 * مثلاً Spring Analyzer annotationهای @Service, @Controller, @Repository را تحلیل می‌کند.
 */

export interface FrameworkAnalysisResult {
  frameworkName: string;
  detectedPatterns: DetectedPattern[];
  endpoints?: RestEndpoint[];
  entities?: JpaEntity[];
  services?: ServiceInfo[];
  repositories?: RepositoryInfo[];
  configurations?: ConfigurationInfo[];
}

export interface DetectedPattern {
  type: string;
  name: string;
  symbolId: string;
  metadata: Record<string, string>;
}

export interface RestEndpoint {
  id: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  controllerName: string;
  methodName: string;
  requestType?: string;
  responseType?: string;
  authenticated: boolean;
  symbolId: string;
}

export interface JpaEntity {
  id: string;
  entityName: string;
  tableName: string;
  fields: JpaField[];
  relationships: JpaRelationship[];
  symbolId: string;
}

export interface JpaField {
  name: string;
  type: string;
  columnName: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isGeneratedValue: boolean;
}

export interface JpaRelationship {
  type: 'OneToMany' | 'ManyToOne' | 'OneToOne' | 'ManyToMany';
  targetEntity: string;
  mappedBy?: string;
  fieldName: string;
}

export interface ServiceInfo {
  id: string;
  name: string;
  qualifiedName: string;
  isTransactional: boolean;
  methods: ServiceMethod[];
  symbolId: string;
}

export interface ServiceMethod {
  name: string;
  isTransactional: boolean;
  transactionPropagation?: string;
  isAsync: boolean;
}

export interface RepositoryInfo {
  id: string;
  name: string;
  entityName: string;
  customMethods: string[];
  symbolId: string;
}

export interface ConfigurationInfo {
  id: string;
  name: string;
  properties: Record<string, string>;
  symbolId: string;
}

export interface FrameworkAnalyzer {
  readonly frameworkName: string;
  analyze(symbols: CodeSymbol[], references: CodeReference[], fileContent?: string): FrameworkAnalysisResult;
  canAnalyze(symbols: CodeSymbol[]): boolean;
}
