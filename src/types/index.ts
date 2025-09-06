export interface Column {
  id: string;
  name: string;
  dataType: string;
  length?: string;
  isPrimaryKey: boolean;
  isNotNull: boolean;
  isAutoIncrement: boolean;
  isUnique: boolean;
  defaultValue?: string;
  isForeignKey?: boolean;
  referencesTable?: string;
  referencesColumn?: string;
  comment?: string;
  collation?: string;
  charset?: string;
}

export interface TableData {
  id: string;
  name: string;
  columns: Column[];
  position: { x: number; y: number };
  engine?: string;
  charset?: string;
  collation?: string;
  comment?: string;
  autoIncrement?: number;
}

export interface IndexData {
  id: string;
  name: string;
  tableId: string;
  columns: string[];
  type: 'PRIMARY' | 'UNIQUE' | 'INDEX' | 'FULLTEXT' | 'SPATIAL';
  method?: 'BTREE' | 'HASH';
}

export interface ViewData {
  id: string;
  name: string;
  definition: string;
  isUpdatable: boolean;
  algorithm: 'UNDEFINED' | 'MERGE' | 'TEMPTABLE';
  sqlSecurity: 'DEFINER' | 'INVOKER';
  comment?: string;
}

export interface StoredProcedureData {
  id: string;
  name: string;
  parameters: Parameter[];
  body: string;
  type: 'PROCEDURE' | 'FUNCTION';
  returnType?: string;
  comment?: string;
  sqlSecurity: 'DEFINER' | 'INVOKER';
  deterministic: boolean;
}

export interface Parameter {
  name: string;
  type: string;
  direction: 'IN' | 'OUT' | 'INOUT';
}

export interface TriggerData {
  id: string;
  name: string;
  tableId: string;
  timing: 'BEFORE' | 'AFTER';
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  body: string;
  comment?: string;
}

export interface DatabaseData {
  id: string;
  name: string;
  charset: string;
  collation: string;
  comment?: string;
}

export interface UserData {
  id: string;
  username: string;
  host: string;
  password?: string;
  privileges: string[];
  comment?: string;
}

export interface RelationshipData {
  id: string;
  sourceTable: string;
  targetTable: string;
  sourceColumn: string;
  targetColumn: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  onUpdate: ReferentialAction;
  onDelete: ReferentialAction;
}

export type ReferentialAction = 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'NO ACTION' | 'SET DEFAULT';

export interface ProjectData {
  databases: DatabaseData[];
  tables: TableData[];
  relationships: RelationshipData[];
  indexes: IndexData[];
  views: ViewData[];
  procedures: StoredProcedureData[];
  triggers: TriggerData[];
  users: UserData[];
  name: string;
  dialect: SQLDialect;
  currentDatabase?: string;
}

export type SQLDialect = 'mysql' | 'postgresql' | 'sqlite' | 'mariadb' | 'oracle';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface GithubConfig {
  token: string;
  owner: string;
  repo: string;
  path: string;
}

export const DATA_TYPES = {
  mysql: [
    'TINYINT', 'SMALLINT', 'MEDIUMINT', 'INT', 'INTEGER', 'BIGINT',
    'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'REAL', 'BIT',
    'CHAR', 'VARCHAR', 'BINARY', 'VARBINARY', 'TINYBLOB', 'TINYTEXT',
    'TEXT', 'BLOB', 'MEDIUMTEXT', 'MEDIUMBLOB', 'LONGTEXT', 'LONGBLOB',
    'ENUM', 'SET', 'DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'YEAR',
    'GEOMETRY', 'POINT', 'LINESTRING', 'POLYGON', 'MULTIPOINT',
    'MULTILINESTRING', 'MULTIPOLYGON', 'GEOMETRYCOLLECTION', 'JSON'
  ],
  postgresql: [
    'smallint', 'integer', 'bigint', 'decimal', 'numeric', 'real', 'double precision',
    'smallserial', 'serial', 'bigserial', 'char', 'varchar', 'text',
    'bytea', 'timestamp', 'date', 'time', 'interval', 'boolean',
    'point', 'line', 'lseg', 'box', 'path', 'polygon', 'circle',
    'inet', 'cidr', 'macaddr', 'bit', 'uuid', 'xml', 'json', 'jsonb'
  ],
  sqlite: [
    'INTEGER', 'REAL', 'TEXT', 'BLOB', 'NUMERIC'
  ],
  mariadb: [
    'TINYINT', 'SMALLINT', 'MEDIUMINT', 'INT', 'INTEGER', 'BIGINT',
    'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'REAL', 'BIT',
    'CHAR', 'VARCHAR', 'BINARY', 'VARBINARY', 'TINYBLOB', 'TINYTEXT',
    'TEXT', 'BLOB', 'MEDIUMTEXT', 'MEDIUMBLOB', 'LONGTEXT', 'LONGBLOB',
    'ENUM', 'SET', 'DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'YEAR', 'JSON'
  ],
  oracle: [
    'VARCHAR2', 'NVARCHAR2', 'NUMBER', 'FLOAT', 'DATE', 'TIMESTAMP',
    'CLOB', 'BLOB', 'RAW', 'LONG RAW'
  ]
};

export const ENGINES = ['InnoDB', 'MyISAM', 'MEMORY', 'CSV', 'ARCHIVE', 'FEDERATED'];
export const CHARSETS = ['utf8mb4', 'utf8', 'latin1', 'ascii', 'utf16', 'utf32', 'binary'];
export const COLLATIONS = {
  utf8mb4: ['utf8mb4_general_ci', 'utf8mb4_unicode_ci', 'utf8mb4_bin'],
  utf8: ['utf8_general_ci', 'utf8_unicode_ci', 'utf8_bin'],
  latin1: ['latin1_swedish_ci', 'latin1_general_ci', 'latin1_bin']
};
export const PRIVILEGES = [
  'ALL PRIVILEGES', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP',
  'RELOAD', 'SHUTDOWN', 'PROCESS', 'FILE', 'GRANT', 'REFERENCES', 'INDEX',
  'ALTER', 'SHOW DATABASES', 'SUPER', 'CREATE TEMPORARY TABLES', 'LOCK TABLES',
  'EXECUTE', 'REPLICATION SLAVE', 'REPLICATION CLIENT', 'CREATE VIEW',
  'SHOW VIEW', 'CREATE ROUTINE', 'ALTER ROUTINE', 'CREATE USER', 'EVENT', 'TRIGGER'
];
