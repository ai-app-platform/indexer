// Framework Analyzers
export { SpringAnalyzer } from './SpringAnalyzer';
export { RESTAnalyzer } from './RESTAnalyzer';
export { JPAAnalyzer } from './JPAAnalyzer';
export { BuildSystemDetector } from './BuildSystemDetector';
export type { BuildSystem, BuildSystemInfo, DependencyInfo } from './BuildSystemDetector';

export { FrameworkAnalyzerRegistry } from './FrameworkAnalyzerRegistry';
export type { CompleteFrameworkAnalysis } from './FrameworkAnalyzerRegistry';

export type {
  FrameworkAnalyzer,
  FrameworkAnalysisResult,
  DetectedPattern,
  RestEndpoint,
  JpaEntity,
  JpaField,
  JpaRelationship,
  ServiceInfo,
  ServiceMethod,
  RepositoryInfo,
  ConfigurationInfo,
} from './FrameworkAnalyzer';
