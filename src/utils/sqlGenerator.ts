import { TableData, RelationshipData, SQLDialect, IndexData, ViewData, StoredProcedureData, TriggerData, DatabaseData, UserData } from '../types';

export class SQLGenerator {
  private dialect: SQLDialect;

  constructor(dialect: SQLDialect) {
    this.dialect = dialect;
  }

  // Database Operations
  generateCreateDatabaseSQL(database: DatabaseData): string {
    let sql = `CREATE DATABASE ${this.quoteIdentifier(database.name)}`;
    
    if (this.dialect === 'mysql') {
      sql += ` CHARACTER SET ${database.charset}`;
      sql += ` COLLATE ${database.collation}`;
    }
    
    if (database.comment) {
      sql += ` COMMENT '${database.comment.replace(/'/g, "''")}'`;
    }
    
    return sql + ';';
  }

  generateDropDatabaseSQL(databaseName: string): string {
    return `DROP DATABASE ${this.quoteIdentifier(databaseName)};`;
  }

  generateUseDatabaseSQL(databaseName: string): string {
    return `USE ${this.quoteIdentifier(databaseName)};`;
  }

  // Table Operations
  generateCreateTableSQL(table: TableData, relationships: RelationshipData[], allTables: TableData[]): string {
    const { name, columns } = table;
    
    let sql = `CREATE TABLE ${this.quoteIdentifier(name)} (\n`;
    
    const columnDefinitions = columns.map(column => {
      let definition = `  ${this.quoteIdentifier(column.name)} ${this.formatDataType(column)}`;
      
      if (column.isNotNull) {
        definition += ' NOT NULL';
      }
      
      if (column.isAutoIncrement) {
        definition += this.getAutoIncrementSyntax();
      }
      
      if (column.defaultValue && column.defaultValue.trim() !== '') {
        definition += ` DEFAULT ${this.formatDefaultValue(column.defaultValue)}`;
      }

      if (column.comment && this.dialect === 'mysql') {
        definition += ` COMMENT '${column.comment.replace(/'/g, "''")}'`;
      }
      
      return definition;
    });

    // Add PRIMARY KEY constraint
    const primaryKeys = columns.filter(col => col.isPrimaryKey);
    if (primaryKeys.length > 0) {
      const pkNames = primaryKeys.map(col => this.quoteIdentifier(col.name)).join(', ');
      columnDefinitions.push(`  PRIMARY KEY (${pkNames})`);
    }

    // Add UNIQUE constraints
    const uniqueColumns = columns.filter(col => col.isUnique && !col.isPrimaryKey);
    uniqueColumns.forEach(col => {
      columnDefinitions.push(`  UNIQUE KEY ${this.quoteIdentifier(`uk_${col.name}`)} (${this.quoteIdentifier(col.name)})`);
    });

    // Add FOREIGN KEY constraints
    const foreignKeys = relationships.filter(rel => rel.sourceTable === table.id);
    foreignKeys.forEach(fk => {
      const sourceCol = columns.find(col => col.id === fk.sourceColumn);
      const targetTable = allTables.find(t => t.id === fk.targetTable);
      if (sourceCol && targetTable) {
        const targetCol = targetTable.columns.find(c => c.id === fk.targetColumn);
        if (targetCol) {
          const constraintName = `fk_${table.name}_${sourceCol.name}`;
          columnDefinitions.push(
            `  CONSTRAINT ${this.quoteIdentifier(constraintName)} FOREIGN KEY (${this.quoteIdentifier(sourceCol.name)}) REFERENCES ${this.quoteIdentifier(targetTable.name)}(${this.quoteIdentifier(targetCol.name)}) ON UPDATE ${fk.onUpdate} ON DELETE ${fk.onDelete}`
          );
        }
      }
    });

    sql += columnDefinitions.join(',\n');
    sql += '\n)';

    // Add table options for MySQL
    if (this.dialect === 'mysql') {
      if (table.engine) {
        sql += ` ENGINE=${table.engine}`;
      }
      if (table.charset) {
        sql += ` DEFAULT CHARSET=${table.charset}`;
      }
      if (table.collation) {
        sql += ` COLLATE=${table.collation}`;
      }
      if (table.autoIncrement) {
        sql += ` AUTO_INCREMENT=${table.autoIncrement}`;
      }
      if (table.comment) {
        sql += ` COMMENT='${table.comment.replace(/'/g, "''")}'`;
      }
    }

    return sql + ';';
  }

  generateAlterTableSQL(table: TableData, operation: string, details: any): string {
    let sql = `ALTER TABLE ${this.quoteIdentifier(table.name)}`;

    switch (operation) {
      case 'ADD_COLUMN':
        sql += ` ADD COLUMN ${this.quoteIdentifier(details.column.name)} ${this.formatDataType(details.column)}`;
        if (details.column.isNotNull) sql += ' NOT NULL';
        if (details.column.defaultValue) sql += ` DEFAULT ${this.formatDefaultValue(details.column.defaultValue)}`;
        break;
      
      case 'DROP_COLUMN':
        sql += ` DROP COLUMN ${this.quoteIdentifier(details.columnName)}`;
        break;
      
      case 'MODIFY_COLUMN':
        sql += ` MODIFY COLUMN ${this.quoteIdentifier(details.column.name)} ${this.formatDataType(details.column)}`;
        break;
      
      case 'RENAME_COLUMN':
        sql += ` RENAME COLUMN ${this.quoteIdentifier(details.oldName)} TO ${this.quoteIdentifier(details.newName)}`;
        break;
      
      case 'ADD_INDEX':
        sql += ` ADD INDEX ${this.quoteIdentifier(details.indexName)} (${details.columns.map((col: string) => this.quoteIdentifier(col)).join(', ')})`;
        break;
      
      case 'DROP_INDEX':
        sql += ` DROP INDEX ${this.quoteIdentifier(details.indexName)}`;
        break;
    }

    return sql + ';';
  }

  generateDropTableSQL(tableName: string): string {
    return `DROP TABLE ${this.quoteIdentifier(tableName)};`;
  }

  generateTruncateTableSQL(tableName: string): string {
    return `TRUNCATE TABLE ${this.quoteIdentifier(tableName)};`;
  }

  // Index Operations
  generateCreateIndexSQL(index: IndexData, tableName: string): string {
    let sql = '';
    
    switch (index.type) {
      case 'INDEX':
        sql = `CREATE INDEX ${this.quoteIdentifier(index.name)} ON ${this.quoteIdentifier(tableName)}`;
        break;
      case 'UNIQUE':
        sql = `CREATE UNIQUE INDEX ${this.quoteIdentifier(index.name)} ON ${this.quoteIdentifier(tableName)}`;
        break;
      case 'FULLTEXT':
        sql = `CREATE FULLTEXT INDEX ${this.quoteIdentifier(index.name)} ON ${this.quoteIdentifier(tableName)}`;
        break;
      case 'SPATIAL':
        sql = `CREATE SPATIAL INDEX ${this.quoteIdentifier(index.name)} ON ${this.quoteIdentifier(tableName)}`;
        break;
    }

    sql += ` (${index.columns.map(col => this.quoteIdentifier(col)).join(', ')})`;
    
    if (index.method && this.dialect === 'mysql') {
      sql += ` USING ${index.method}`;
    }

    return sql + ';';
  }

  generateDropIndexSQL(indexName: string, tableName?: string): string {
    if (this.dialect === 'mysql' && tableName) {
      return `DROP INDEX ${this.quoteIdentifier(indexName)} ON ${this.quoteIdentifier(tableName)};`;
    }
    return `DROP INDEX ${this.quoteIdentifier(indexName)};`;
  }

  // View Operations
  generateCreateViewSQL(view: ViewData): string {
    let sql = 'CREATE';
    
    if (view.algorithm !== 'UNDEFINED') {
      sql += ` ALGORITHM = ${view.algorithm}`;
    }
    
    sql += ` SQL SECURITY ${view.sqlSecurity}`;
    sql += ` VIEW ${this.quoteIdentifier(view.name)} AS ${view.definition}`;
    
    if (view.isUpdatable) {
      sql += ' WITH CHECK OPTION';
    }

    return sql + ';';
  }

  generateDropViewSQL(viewName: string): string {
    return `DROP VIEW ${this.quoteIdentifier(viewName)};`;
  }

  // Stored Procedure Operations
  generateCreateProcedureSQL(procedure: StoredProcedureData): string {
    const paramList = procedure.parameters.map(param => 
      `${param.direction} ${this.quoteIdentifier(param.name)} ${param.type}`
    ).join(', ');

    let sql = `CREATE ${procedure.type} ${this.quoteIdentifier(procedure.name)}(${paramList})`;
    
    if (procedure.type === 'FUNCTION' && procedure.returnType) {
      sql += ` RETURNS ${procedure.returnType}`;
    }
    
    if (procedure.deterministic) {
      sql += ' DETERMINISTIC';
    }
    
    sql += ` SQL SECURITY ${procedure.sqlSecurity}`;
    
    if (procedure.comment) {
      sql += ` COMMENT '${procedure.comment.replace(/'/g, "''")}'`;
    }
    
    sql += `\nBEGIN\n${procedure.body}\nEND`;

    return sql + ';';
  }

  generateDropProcedureSQL(name: string, type: 'PROCEDURE' | 'FUNCTION'): string {
    return `DROP ${type} ${this.quoteIdentifier(name)};`;
  }

  // Trigger Operations
  generateCreateTriggerSQL(trigger: TriggerData, tableName: string): string {
    let sql = `CREATE TRIGGER ${this.quoteIdentifier(trigger.name)}`;
    sql += ` ${trigger.timing} ${trigger.event}`;
    sql += ` ON ${this.quoteIdentifier(tableName)}`;
    sql += ' FOR EACH ROW';
    sql += `\nBEGIN\n${trigger.body}\nEND`;

    return sql + ';';
  }

  generateDropTriggerSQL(triggerName: string): string {
    return `DROP TRIGGER ${this.quoteIdentifier(triggerName)};`;
  }

  // User Management
  generateCreateUserSQL(user: UserData): string {
    let sql = `CREATE USER ${this.quoteIdentifier(user.username)}@${this.quoteIdentifier(user.host)}`;
    
    if (user.password) {
      sql += ` IDENTIFIED BY '${user.password}'`;
    }

    return sql + ';';
  }

  generateGrantPrivilegesSQL(user: UserData, database?: string, table?: string): string {
    const privileges = user.privileges.join(', ');
    let target = '*.*';
    
    if (database && table) {
      target = `${this.quoteIdentifier(database)}.${this.quoteIdentifier(table)}`;
    } else if (database) {
      target = `${this.quoteIdentifier(database)}.*`;
    }

    return `GRANT ${privileges} ON ${target} TO ${this.quoteIdentifier(user.username)}@${this.quoteIdentifier(user.host)};`;
  }

  generateDropUserSQL(user: UserData): string {
    return `DROP USER ${this.quoteIdentifier(user.username)}@${this.quoteIdentifier(user.host)};`;
  }

  // Data Operations
  generateSelectSQL(tableName: string, columns: string[] = ['*'], where?: string, orderBy?: string, limit?: number): string {
    let sql = `SELECT ${columns.map(col => col === '*' ? col : this.quoteIdentifier(col)).join(', ')}`;
    sql += ` FROM ${this.quoteIdentifier(tableName)}`;
    
    if (where) {
      sql += ` WHERE ${where}`;
    }
    
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    return sql + ';';
  }

  generateInsertSQL(tableName: string, data: Record<string, any>): string {
    const columns = Object.keys(data);
    const values = Object.values(data).map(val => this.formatValue(val));
    
    let sql = `INSERT INTO ${this.quoteIdentifier(tableName)}`;
    sql += ` (${columns.map(col => this.quoteIdentifier(col)).join(', ')})`;
    sql += ` VALUES (${values.join(', ')})`;

    return sql + ';';
  }

  generateUpdateSQL(tableName: string, data: Record<string, any>, where: string): string {
    const sets = Object.entries(data).map(([col, val]) => 
      `${this.quoteIdentifier(col)} = ${this.formatValue(val)}`
    );
    
    let sql = `UPDATE ${this.quoteIdentifier(tableName)}`;
    sql += ` SET ${sets.join(', ')}`;
    sql += ` WHERE ${where}`;

    return sql + ';';
  }

  generateDeleteSQL(tableName: string, where: string): string {
    return `DELETE FROM ${this.quoteIdentifier(tableName)} WHERE ${where};`;
  }

  // Utility Operations
  generateShowTablesSQL(database?: string): string {
    if (database) {
      return `SHOW TABLES FROM ${this.quoteIdentifier(database)};`;
    }
    return 'SHOW TABLES;';
  }

  generateDescribeTableSQL(tableName: string): string {
    return `DESCRIBE ${this.quoteIdentifier(tableName)};`;
  }

  generateShowIndexesSQL(tableName: string): string {
    return `SHOW INDEXES FROM ${this.quoteIdentifier(tableName)};`;
  }

  generateShowCreateTableSQL(tableName: string): string {
    return `SHOW CREATE TABLE ${this.quoteIdentifier(tableName)};`;
  }

  // Backup and Restore
  generateExportSQL(tables: TableData[], includeData: boolean = true): string {
    let sql = `-- SQL Architect Export\n-- Generated on ${new Date().toISOString()}\n\n`;
    
    // Export structure
    tables.forEach(table => {
      sql += `-- Table structure for ${table.name}\n`;
      sql += `DROP TABLE IF EXISTS ${this.quoteIdentifier(table.name)};\n`;
      sql += this.generateCreateTableSQL(table, [], tables) + '\n\n';
    });

    if (includeData) {
      sql += '-- Table data\n';
      tables.forEach(table => {
        sql += `-- Data for table ${table.name}\n`;
        sql += `-- INSERT statements would go here\n\n`;
      });
    }

    return sql;
  }

  generateFullSQL(tables: TableData[], relationships: RelationshipData[]): string {
    const sqlStatements = tables.map(table => 
      this.generateCreateTableSQL(table, relationships, tables)
    );
    
    return sqlStatements.join('\n\n');
  }

  // Private helper methods
  private quoteIdentifier(identifier: string): string {
    switch (this.dialect) {
      case 'mysql':
      case 'mariadb':
        return `\`${identifier}\``;
      case 'postgresql':
      case 'sqlite':
        return `"${identifier}"`;
      case 'oracle':
        return `"${identifier.toUpperCase()}"`;
      default:
        return identifier;
    }
  }

  private formatDataType(column: any): string {
    let dataType = column.dataType;
    
    if (column.length && ['VARCHAR', 'CHAR', 'VARBINARY', 'BINARY'].includes(column.dataType)) {
      dataType += `(${column.length})`;
    }
    
    if (column.dataType === 'DECIMAL' || column.dataType === 'NUMERIC') {
      if (column.length) {
        dataType += `(${column.length})`;
      }
    }

    if (column.dataType === 'ENUM' || column.dataType === 'SET') {
      if (column.length) {
        const values = column.length.split(',').map((val: string) => `'${val.trim()}'`).join(', ');
        dataType += `(${values})`;
      }
    }

    return dataType;
  }

  private getAutoIncrementSyntax(): string {
    switch (this.dialect) {
      case 'mysql':
      case 'mariadb':
        return ' AUTO_INCREMENT';
      case 'postgresql':
        return ''; // PostgreSQL uses SERIAL types
      case 'sqlite':
        return ' AUTOINCREMENT';
      default:
        return ' AUTO_INCREMENT';
    }
  }

  private formatDefaultValue(value: string): string {
    const upperValue = value.toUpperCase();
    
    if (['NOW()', 'CURRENT_TIMESTAMP', 'CURRENT_DATE', 'CURRENT_TIME'].includes(upperValue)) {
      return value;
    }
    
    if (value === 'NULL') {
      return value;
    }
    
    // Check if it's a number
    if (!isNaN(Number(value))) {
      return value;
    }
    
    // String values should be quoted
    return `'${value.replace(/'/g, "''")}'`;
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    
    if (typeof value === 'number') {
      return value.toString();
    }
    
    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }
    
    return `'${value.toString().replace(/'/g, "''")}'`;
  }
}
