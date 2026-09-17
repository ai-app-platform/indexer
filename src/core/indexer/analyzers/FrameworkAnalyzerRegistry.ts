import { CodeSymbol, CodeReference, CodeFile } from '../../../types/code-index';
import { FrameworkAnalyzer, FrameworkAnalysisResult } from './FrameworkAnalyzer';
import { SpringAnalyzer } from './SpringAnalyzer';
import { RESTAnalyzer } from './RESTAnalyzer';
import { JPAAnalyzer } from './JPAAnalyzer';
import { BuildSystemDetector, BuildSystemInfo } from './BuildSystemDetector';

/**
 * FrameworkAnalyzerRegistry - مدیریت و اجرای Framework Analyzers
 */

export interface CompleteFrameworkAnalysis {
  frameworks: FrameworkAnalysisResult[];
  buildSystem: BuildSystemInfo;
  summary: {
    detectedFrameworks: string[];
    totalEndpoints: number;
    totalEntities: number;
    totalServices: number;
  };
}

export class FrameworkAnalyzerRegistry {
  private analyzers: FrameworkAnalyzer[] = [];
  private buildSystemDetector: BuildSystemDetector;

  constructor() {
    // ثبت analyzerهای پیش‌فرض
    this.register(new SpringAnalyzer());
    this.register(new RESTAnalyzer());
    this.register(new JPAAnalyzer());
    
    this.buildSystemDetector = new BuildSystemDetector();
  }

  /**
   * Register a new framework analyzer
   */
  register(analyzer: FrameworkAnalyzer): void {
    this.analyzers.push(analyzer);
  }

  /**
   * Run all applicable analyzers
   */
  analyzeAll(symbols: CodeSymbol[], references: CodeReference[], files: CodeFile[]): CompleteFrameworkAnalysis {
    const results: FrameworkAnalysisResult[] = [];

    for (const analyzer of this.analyzers) {
      if (analyzer.canAnalyze(symbols)) {
        const result = analyzer.analyze(symbols, references);
        results.push(result);
      }
    }

    // تشخیص build system
    const buildSystem = this.buildSystemDetector.detect(files);

    // ساخت summary
    const summary = this.buildSummary(results, buildSystem);

    return {
      frameworks: results,
      buildSystem,
      summary,
    };
  }

  private buildSummary(results: FrameworkAnalysisResult[], buildSystem: BuildSystemInfo) {
    const detectedFrameworks = results.map(r => r.frameworkName);
    
    let totalEndpoints = 0;
    let totalEntities = 0;
    let totalServices = 0;

    for (const result of results) {
      if (result.endpoints) {
        totalEndpoints += result.endpoints.length;
      }
      if (result.entities) {
        totalEntities += result.entities.length;
      }
      if (result.services) {
        totalServices += result.services.length;
      }
    }

    return {
      detectedFrameworks,
      totalEndpoints,
      totalEntities,
      totalServices,
    };
  }

  /**
   * Get analyzer by framework name
   */
  getAnalyzer(frameworkName: string): FrameworkAnalyzer | undefined {
    return this.analyzers.find(a => a.frameworkName === frameworkName);
  }

  /**
   * Get all registered analyzers
   */
  getAllAnalyzers(): FrameworkAnalyzer[] {
    return [...this.analyzers];
  }
}
