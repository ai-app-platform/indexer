import { CodeSymbol, CodeReference } from '../../../types/code-index';
import { 
  FrameworkAnalyzer, 
  FrameworkAnalysisResult, 
  DetectedPattern,
  ServiceInfo,
  ServiceMethod 
} from './FrameworkAnalyzer';

/**
 * SpringAnalyzer - تحلیل‌کننده Spring Framework
 * 
 * مسئولیت‌ها:
 * - تشخیص @Service, @Controller, @Repository, @Component
 * - تشخیص @Autowired, @Transactional, @Async
 * - استخراج اطلاعات Serviceها و متدهای آنها
 * - تشخیص @Configuration و @Bean
 */

export class SpringAnalyzer implements FrameworkAnalyzer {
  readonly frameworkName = 'Spring Framework';

  canAnalyze(symbols: CodeSymbol[]): boolean {
    // بررسی وجود annotationهای Spring
    const springAnnotations = [
      'Service', 'Controller', 'Repository', 'Component', 
      'RestController', 'Configuration', 'Bean', 'Autowired'
    ];
    
    return symbols.some(symbol => 
      symbol.annotations.some(ann => springAnnotations.includes(ann))
    );
  }

  analyze(symbols: CodeSymbol[], references: CodeReference[]): FrameworkAnalysisResult {
    const detectedPatterns: DetectedPattern[] = [];
    const services: ServiceInfo[] = [];

    for (const symbol of symbols) {
      // تشخیص @Service
      if (symbol.annotations.includes('Service')) {
        detectedPatterns.push({
          type: 'SERVICE',
          name: symbol.name,
          symbolId: symbol.id,
          metadata: {
            qualifiedName: symbol.qualifiedName,
            visibility: symbol.visibility,
          }
        });

        // استخراج اطلاعات Service
        const serviceInfo = this.extractServiceInfo(symbol, symbols);
        services.push(serviceInfo);
      }

      // تشخیص @Controller و @RestController
      if (symbol.annotations.includes('Controller') || symbol.annotations.includes('RestController')) {
        detectedPatterns.push({
          type: symbol.annotations.includes('RestController') ? 'REST_CONTROLLER' : 'CONTROLLER',
          name: symbol.name,
          symbolId: symbol.id,
          metadata: {
            qualifiedName: symbol.qualifiedName,
            visibility: symbol.visibility,
          }
        });
      }

      // تشخیص @Repository
      if (symbol.annotations.includes('Repository')) {
        detectedPatterns.push({
          type: 'REPOSITORY',
          name: symbol.name,
          symbolId: symbol.id,
          metadata: {
            qualifiedName: symbol.qualifiedName,
            visibility: symbol.visibility,
          }
        });
      }

      // تشخیص @Component
      if (symbol.annotations.includes('Component') && 
          !symbol.annotations.includes('Service') && 
          !symbol.annotations.includes('Controller') && 
          !symbol.annotations.includes('Repository')) {
        detectedPatterns.push({
          type: 'COMPONENT',
          name: symbol.name,
          symbolId: symbol.id,
          metadata: {
            qualifiedName: symbol.qualifiedName,
            visibility: symbol.visibility,
          }
        });
      }

      // تشخیص @Configuration
      if (symbol.annotations.includes('Configuration')) {
        detectedPatterns.push({
          type: 'CONFIGURATION',
          name: symbol.name,
          symbolId: symbol.id,
          metadata: {
            qualifiedName: symbol.qualifiedName,
            visibility: symbol.visibility,
          }
        });
      }
    }

    return {
      frameworkName: this.frameworkName,
      detectedPatterns,
      services,
    };
  }

  private extractServiceInfo(serviceSymbol: CodeSymbol, allSymbols: CodeSymbol[]): ServiceInfo {
    const isTransactional = serviceSymbol.annotations.includes('Transactional');
    
    // یافتن متدهای این Service
    const methods = allSymbols
      .filter(s => s.parentSymbolId === serviceSymbol.id && s.type === 'METHOD')
      .map(method => {
        const methodIsTransactional = method.annotations.includes('Transactional');
        const isAsync = method.annotations.includes('Async');
        
        // استخراج propagation از @Transactional
        let transactionPropagation: string | undefined;
        if (methodIsTransactional || isTransactional) {
          // در حالت واقعی باید از content فایل استخراج شود
          transactionPropagation = 'REQUIRED';
        }

        return {
          name: method.name,
          isTransactional: methodIsTransactional || isTransactional,
          transactionPropagation,
          isAsync,
        };
      });

    return {
      id: `service-${serviceSymbol.id}`,
      name: serviceSymbol.name,
      qualifiedName: serviceSymbol.qualifiedName,
      isTransactional,
      methods,
      symbolId: serviceSymbol.id,
    };
  }
}
