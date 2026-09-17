import { CodeSymbol, CodeReference } from '../../../types/code-index';
import { 
  FrameworkAnalyzer, 
  FrameworkAnalysisResult, 
  DetectedPattern,
  RestEndpoint 
} from './FrameworkAnalyzer';

/**
 * RESTAnalyzer - تحلیل‌کننده REST API Endpoints
 * 
 * مسئولیت‌ها:
 * - تشخیص @GetMapping, @PostMapping, @PutMapping, @DeleteMapping, @PatchMapping
 * - تشخیص @RequestMapping
 * - استخراج HTTP method و path
 * - تشخیص @RequestBody, @RequestParam, @PathVariable
 */

export class RESTAnalyzer implements FrameworkAnalyzer {
  readonly frameworkName = 'REST API';

  canAnalyze(symbols: CodeSymbol[]): boolean {
    const restAnnotations = [
      'RestController', 'Controller', 'GetMapping', 'PostMapping', 
      'PutMapping', 'DeleteMapping', 'PatchMapping', 'RequestMapping'
    ];
    
    return symbols.some(symbol => 
      symbol.annotations.some(ann => restAnnotations.includes(ann))
    );
  }

  analyze(symbols: CodeSymbol[], references: CodeReference[]): FrameworkAnalysisResult {
    const detectedPatterns: DetectedPattern[] = [];
    const endpoints: RestEndpoint[] = [];

    // یافتن Controllerها
    const controllers = symbols.filter(s => 
      s.annotations.includes('RestController') || s.annotations.includes('Controller')
    );

    for (const controller of controllers) {
      // استخراج base path از @RequestMapping روی کلاس
      const basePath = this.extractBasePath(controller);

      // یافتن متدهای Controller
      const methods = symbols.filter(s => 
        s.parentSymbolId === controller.id && s.type === 'METHOD'
      );

      for (const method of methods) {
        // استخراج endpoint از annotationهای متد
        const endpoint = this.extractEndpoint(method, controller.name, basePath);
        if (endpoint) {
          endpoints.push(endpoint);
          
          detectedPatterns.push({
            type: 'REST_ENDPOINT',
            name: `${endpoint.httpMethod} ${endpoint.path}`,
            symbolId: method.id,
            metadata: {
              httpMethod: endpoint.httpMethod,
              path: endpoint.path,
              controller: controller.name,
              method: method.name,
            }
          });
        }
      }
    }

    return {
      frameworkName: this.frameworkName,
      detectedPatterns,
      endpoints,
    };
  }

  private extractBasePath(controller: CodeSymbol): string {
    // در حالت واقعی باید از content فایل استخراج شود
    // برای demo، از qualifiedName استفاده می‌کنیم
    if (controller.annotations.includes('RequestMapping')) {
      // فرض می‌کنیم path در annotation است
      // در حالت واقعی باید regex روی content بزنیم
      return `/api/${controller.name.toLowerCase().replace('controller', '')}`;
    }
    return '';
  }

  private extractEndpoint(
    method: CodeSymbol, 
    controllerName: string, 
    basePath: string
  ): RestEndpoint | null {
    let httpMethod: RestEndpoint['httpMethod'] | null = null;
    let path = '';

    // تشخیص annotationهای mapping
    if (method.annotations.includes('GetMapping')) {
      httpMethod = 'GET';
      path = this.extractPathFromAnnotation(method, 'GetMapping');
    } else if (method.annotations.includes('PostMapping')) {
      httpMethod = 'POST';
      path = this.extractPathFromAnnotation(method, 'PostMapping');
    } else if (method.annotations.includes('PutMapping')) {
      httpMethod = 'PUT';
      path = this.extractPathFromAnnotation(method, 'PutMapping');
    } else if (method.annotations.includes('DeleteMapping')) {
      httpMethod = 'DELETE';
      path = this.extractPathFromAnnotation(method, 'DeleteMapping');
    } else if (method.annotations.includes('PatchMapping')) {
      httpMethod = 'PATCH';
      path = this.extractPathFromAnnotation(method, 'PatchMapping');
    } else if (method.annotations.includes('RequestMapping')) {
      // RequestMapping عمومی
      httpMethod = 'GET'; // پیش‌فرض
      path = this.extractPathFromAnnotation(method, 'RequestMapping');
    }

    if (!httpMethod) {
      return null;
    }

    // ترکیب basePath و path
    const fullPath = basePath ? `${basePath}${path}` : path;

    // تشخیص authentication (در حالت واقعی باید از security config استخراج شود)
    const authenticated = method.annotations.includes('PreAuthorize') || 
                         method.annotations.includes('Secured');

    // استخراج request/response types از parameters و return type
    const requestType = method.parameters?.find(p => 
      p.name.includes('Request') || p.type.includes('Request')
    )?.type;
    
    const responseType = method.returnType;

    return {
      id: `endpoint-${method.id}`,
      httpMethod,
      path: fullPath || `/${method.name.toLowerCase()}`,
      controllerName,
      methodName: method.name,
      requestType,
      responseType,
      authenticated,
      symbolId: method.id,
    };
  }

  private extractPathFromAnnotation(method: CodeSymbol, annotationName: string): string {
    // در حالت واقعی باید از content فایل با regex استخراج شود
    // برای demo، از نام متد استفاده می‌کنیم
    const methodName = method.name;
    
    // تبدیل camelCase به kebab-case
    const kebabCase = methodName
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
    
    return `/${kebabCase}`;
  }
}
