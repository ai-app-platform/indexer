import { CodeFile } from '../../../types/code-index';

/**
 * BuildSystemDetector - تشخیص سیستم build پروژه
 * 
 * مسئولیت‌ها:
 * - تشخیص Maven (pom.xml)
 * - تشخیص Gradle (build.gradle, build.gradle.kts)
 * - تشخیص npm/yarn/pnpm (package.json)
 * - تشخیص Cargo (Cargo.toml)
 * - تشخیص Go Modules (go.mod)
 * - تشخیص pip/Poetry (requirements.txt, pyproject.toml)
 */

export type BuildSystem = 
  | 'MAVEN' 
  | 'GRADLE' 
  | 'NPM' 
  | 'YARN' 
  | 'PNPM' 
  | 'PIP' 
  | 'POETRY' 
  | 'CARGO' 
  | 'GO_MODULES'
  | 'UNKNOWN';

export interface BuildSystemInfo {
  buildSystem: BuildSystem;
  configFile: string;
  projectName?: string;
  version?: string;
  dependencies: DependencyInfo[];
}

export interface DependencyInfo {
  name: string;
  version?: string;
  scope?: string; // compile, test, runtime
}

export class BuildSystemDetector {
  /**
   * Detect build system from files
   */
  detect(files: CodeFile[]): BuildSystemInfo {
    // بررسی فایل‌های مشخصه هر build system
    for (const file of files) {
      const fileName = file.name.toLowerCase();
      const path = file.path.toLowerCase();

      // Maven
      if (fileName === 'pom.xml') {
        return {
          buildSystem: 'MAVEN',
          configFile: file.path,
          dependencies: this.extractMavenDependencies(file),
        };
      }

      // Gradle
      if (fileName === 'build.gradle' || fileName === 'build.gradle.kts') {
        return {
          buildSystem: 'GRADLE',
          configFile: file.path,
          dependencies: this.extractGradleDependencies(file),
        };
      }

      // npm/yarn/pnpm
      if (fileName === 'package.json') {
        const packageManager = this.detectNodePackageManager(files);
        return {
          buildSystem: packageManager,
          configFile: file.path,
          dependencies: this.extractNpmDependencies(file),
        };
      }

      // Cargo (Rust)
      if (fileName === 'cargo.toml') {
        return {
          buildSystem: 'CARGO',
          configFile: file.path,
          dependencies: this.extractCargoDependencies(file),
        };
      }

      // Go Modules
      if (fileName === 'go.mod') {
        return {
          buildSystem: 'GO_MODULES',
          configFile: file.path,
          dependencies: this.extractGoDependencies(file),
        };
      }

      // Poetry
      if (fileName === 'pyproject.toml') {
        return {
          buildSystem: 'POETRY',
          configFile: file.path,
          dependencies: this.extractPoetryDependencies(file),
        };
      }

      // pip
      if (fileName === 'requirements.txt') {
        return {
          buildSystem: 'PIP',
          configFile: file.path,
          dependencies: this.extractPipDependencies(file),
        };
      }
    }

    return {
      buildSystem: 'UNKNOWN',
      configFile: '',
      dependencies: [],
    };
  }

  private detectNodePackageManager(files: CodeFile[]): 'NPM' | 'YARN' | 'PNPM' {
    const fileNames = files.map(f => f.name.toLowerCase());
    
    if (fileNames.includes('pnpm-lock.yaml')) {
      return 'PNPM';
    }
    if (fileNames.includes('yarn.lock')) {
      return 'YARN';
    }
    return 'NPM';
  }

  private extractMavenDependencies(file: CodeFile): DependencyInfo[] {
    // در حالت واقعی باید XML را parse کند
    // برای demo، لیست ثابت برمی‌گردانیم
    return [
      { name: 'spring-boot-starter-web', scope: 'compile' },
      { name: 'spring-boot-starter-data-jpa', scope: 'compile' },
      { name: 'postgresql', scope: 'runtime' },
      { name: 'spring-boot-starter-test', scope: 'test' },
    ];
  }

  private extractGradleDependencies(file: CodeFile): DependencyInfo[] {
    // در حالت واقعی باید Groovy/Kotlin DSL را parse کند
    return [
      { name: 'spring-boot-starter-web', scope: 'implementation' },
      { name: 'spring-boot-starter-data-jpa', scope: 'implementation' },
      { name: 'postgresql', scope: 'runtimeOnly' },
      { name: 'spring-boot-starter-test', scope: 'testImplementation' },
    ];
  }

  private extractNpmDependencies(file: CodeFile): DependencyInfo[] {
    // در حالت واقعی باید JSON را parse کند
    return [
      { name: 'react', version: '^18.2.0' },
      { name: 'react-dom', version: '^18.2.0' },
      { name: 'typescript', version: '^5.0.0' },
    ];
  }

  private extractCargoDependencies(file: CodeFile): DependencyInfo[] {
    return [
      { name: 'serde', version: '1.0' },
      { name: 'tokio', version: '1.0' },
    ];
  }

  private extractGoDependencies(file: CodeFile): DependencyInfo[] {
    return [
      { name: 'github.com/gin-gonic/gin', version: 'v1.9.0' },
    ];
  }

  private extractPoetryDependencies(file: CodeFile): DependencyInfo[] {
    return [
      { name: 'fastapi', version: '^0.100.0' },
      { name: 'uvicorn', version: '^0.23.0' },
    ];
  }

  private extractPipDependencies(file: CodeFile): DependencyInfo[] {
    return [
      { name: 'flask', version: '2.3.0' },
      { name: 'sqlalchemy', version: '2.0.0' },
    ];
  }
}
