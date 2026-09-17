import { CodeSymbol, CodeReference } from '../../../types/code-index';
import { 
  FrameworkAnalyzer, 
  FrameworkAnalysisResult, 
  DetectedPattern,
  JpaEntity,
  JpaField,
  JpaRelationship 
} from './FrameworkAnalyzer';

/**
 * JPAAnalyzer - تحلیل‌کننده JPA/Hibernate Entities
 * 
 * مسئولیت‌ها:
 * - تشخیص @Entity, @Table
 * - تحلیل @Id, @GeneratedValue, @Column
 * - تشخیص روابط @OneToMany, @ManyToOne, @OneToOne, @ManyToMany
 * - استخراج نام جدول و ستون‌ها
 */

export class JPAAnalyzer implements FrameworkAnalyzer {
  readonly frameworkName = 'JPA/Hibernate';

  canAnalyze(symbols: CodeSymbol[]): boolean {
    const jpaAnnotations = ['Entity', 'Table', 'Id', 'Column', 'OneToMany', 'ManyToOne'];
    
    return symbols.some(symbol => 
      symbol.annotations.some(ann => jpaAnnotations.includes(ann))
    );
  }

  analyze(symbols: CodeSymbol[], references: CodeReference[]): FrameworkAnalysisResult {
    const detectedPatterns: DetectedPattern[] = [];
    const entities: JpaEntity[] = [];

    // یافتن Entityها
    const entitySymbols = symbols.filter(s => 
      s.annotations.includes('Entity') && s.type === 'CLASS'
    );

    for (const entitySymbol of entitySymbols) {
      detectedPatterns.push({
        type: 'JPA_ENTITY',
        name: entitySymbol.name,
        symbolId: entitySymbol.id,
        metadata: {
          qualifiedName: entitySymbol.qualifiedName,
        }
      });

      // استخراج اطلاعات Entity
      const entityInfo = this.extractEntityInfo(entitySymbol, symbols);
      entities.push(entityInfo);
    }

    return {
      frameworkName: this.frameworkName,
      detectedPatterns,
      entities,
    };
  }

  private extractEntityInfo(entitySymbol: CodeSymbol, allSymbols: CodeSymbol[]): JpaEntity {
    // استخراج نام جدول از @Table
    const tableName = this.extractTableName(entitySymbol);

    // یافتن فیلدهای Entity
    const fields = allSymbols
      .filter(s => s.parentSymbolId === entitySymbol.id && s.type === 'FIELD')
      .map(field => this.extractFieldInfo(field));

    // یافتن روابط
    const relationships = this.extractRelationships(entitySymbol, allSymbols);

    return {
      id: `entity-${entitySymbol.id}`,
      entityName: entitySymbol.name,
      tableName,
      fields,
      relationships,
      symbolId: entitySymbol.id,
    };
  }

  private extractTableName(entitySymbol: CodeSymbol): string {
    // در حالت واقعی باید از content فایل استخراج شود
    // برای demo، از نام Entity استفاده می‌کنیم
    // تبدیل CamelCase به snake_case
    return entitySymbol.name
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '') + 's';
  }

  private extractFieldInfo(fieldSymbol: CodeSymbol): JpaField {
    const isPrimaryKey = fieldSymbol.annotations.includes('Id');
    const isGeneratedValue = fieldSymbol.annotations.includes('GeneratedValue');
    
    // استخراج نام ستون از @Column
    const columnName = this.extractColumnName(fieldSymbol);
    
    // تشخیص nullable
    const nullable = !fieldSymbol.annotations.includes('NotNull') && 
                    !fieldSymbol.annotations.includes('NonNull');

    return {
      name: fieldSymbol.name,
      type: fieldSymbol.returnType || 'String',
      columnName,
      nullable,
      isPrimaryKey,
      isGeneratedValue,
    };
  }

  private extractColumnName(fieldSymbol: CodeSymbol): string {
    // در حالت واقعی باید از @Column(name="...") استخراج شود
    // برای demo، از نام فیلد استفاده می‌کنیم
    return fieldSymbol.name
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  private extractRelationships(entitySymbol: CodeSymbol, allSymbols: CodeSymbol[]): JpaRelationship[] {
    const relationships: JpaRelationship[] = [];

    // یافتن فیلدهای با annotationهای رابطه
    const relationshipFields = allSymbols.filter(s => 
      s.parentSymbolId === entitySymbol.id && 
      s.type === 'FIELD' &&
      (s.annotations.includes('OneToMany') || 
       s.annotations.includes('ManyToOne') || 
       s.annotations.includes('OneToOne') || 
       s.annotations.includes('ManyToMany'))
    );

    for (const field of relationshipFields) {
      let type: JpaRelationship['type'] = 'ManyToOne';
      
      if (field.annotations.includes('OneToMany')) {
        type = 'OneToMany';
      } else if (field.annotations.includes('OneToOne')) {
        type = 'OneToOne';
      } else if (field.annotations.includes('ManyToMany')) {
        type = 'ManyToMany';
      }

      // استخراج target entity از type فیلد
      const targetEntity = field.returnType || 'Unknown';

      // استخراج mappedBy (در حالت واقعی باید از annotation استخراج شود)
      const mappedBy = field.annotations.includes('MappedBy') ? field.name : undefined;

      relationships.push({
        type,
        targetEntity,
        mappedBy,
        fieldName: field.name,
      });
    }

    return relationships;
  }
}
