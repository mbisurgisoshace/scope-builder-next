import type { SqlSchema } from "./SqlSchema";
import type { TableDefinition } from "./TableDefinition";
import type { ColumnDefinition } from "./ColumnDefinition";

export type SqlDialect = "postgres";

export class SqlCodeGenerator {
  private dialect: SqlDialect;

  constructor(dialect: SqlDialect = "postgres") {
    this.dialect = dialect;
  }

  generateDDL(schema: SqlSchema): string {
    const stmts: string[] = [];

    // 1) CREATE TABLE statements
    for (const table of schema.listTables()) {
      stmts.push(this.createTableStatement(table));
    }

    // 2) FOREIGN KEY constraints as ALTER TABLE
    for (const table of schema.listTables()) {
      const fkStmts = this.foreignKeyStatements(schema, table);
      stmts.push(...fkStmts);
    }

    return stmts.filter(Boolean).join("\n\n");
  }

  /**
   * Generate DDL only for a single table:
   * - CREATE TABLE ...
   * - ALTER TABLE ... ADD CONSTRAINT ... (FKs that this table owns)
   */
  generateTableDDL(schema: SqlSchema, tableId: string): string {
    const table = schema.getTable(tableId);
    if (!table) {
      throw new Error(`Table ${tableId} not found in schema`);
    }

    const createStmt = this.createTableStatement(table);
    const fkStmts = this.foreignKeyStatements(schema, table);

    return [createStmt, ...fkStmts].filter(Boolean).join("\n\n");
  }

  // ───────────────────────────────────────────────────────────
  // CREATE TABLE
  // ───────────────────────────────────────────────────────────

  private createTableStatement(table: TableDefinition): string {
    const cols = table.columns;

    const colLines: string[] = [];

    for (const col of cols) {
      colLines.push("  " + this.columnDefinition(col));
    }

    // Optionally: table-level PK constraint if you ever allow composite PKs
    const pkCols = cols.filter((c) => c.isPrimaryKey);
    if (pkCols.length > 1) {
      const colNames = pkCols.map((c) => this.quoteIdent(c.name)).join(", ");
      colLines.push(`  PRIMARY KEY (${colNames})`);
    }

    const tableName = this.quoteIdent(table.name);
    return `CREATE TABLE ${tableName} (\n${colLines.join(",\n")}\n);`;
  }

  private columnDefinition(col: ColumnDefinition): string {
    const parts: string[] = [];

    parts.push(this.quoteIdent(col.name));
    parts.push(this.mapColumnType(col));

    // Constraints (column-level)
    if (col.isPrimaryKey) {
      // If you’re OK with single-column PKs as inline constraint
      parts.push("PRIMARY KEY");
    }
    if (!col.isNullable) {
      parts.push("NOT NULL");
    }
    if (col.isUnique && !col.isPrimaryKey) {
      parts.push("UNIQUE");
    }

    // Default values, check constraints, etc., could go here later.

    return parts.join(" ");
  }

  private mapColumnType(col: ColumnDefinition): string {
    switch (col.type) {
      case "string":
        return "TEXT";
      case "number":
        return "INTEGER"; // or NUMERIC, depending on your needs
      case "boolean":
        return "BOOLEAN";
      case "autoIncrement":
        // Postgres-style
        return "SERIAL";
      default:
        // Fallback to TEXT
        return "TEXT";
    }
  }

  // ───────────────────────────────────────────────────────────
  // FOREIGN KEYS
  // ───────────────────────────────────────────────────────────

  private foreignKeyStatements(
    schema: SqlSchema,
    table: TableDefinition
  ): string[] {
    const stmts: string[] = [];

    for (const col of table.columns) {
      if (!col.isForeignKey || !col.foreignKey) continue;

      const targetTable = schema.getTable(col.foreignKey.tableId);
      if (!targetTable) continue;

      const sourceTableName = this.quoteIdent(table.name);
      const targetTableName = this.quoteIdent(targetTable.name);

      const sourceColName = this.quoteIdent(col.name);

      // find target column in target table
      const targetCol = targetTable.columns.find(
        (c) => c.id === col.foreignKey!.columnId
      );
      if (!targetCol) continue;

      const targetColName = this.quoteIdent(targetCol.name);

      // constraint name
      const constraintName = this.quoteIdent(
        `fk_${table.name}_${col.name}_${targetTable.name}_${targetCol.name}`
      );

      const stmt = `
ALTER TABLE ${sourceTableName}
  ADD CONSTRAINT ${constraintName}
  FOREIGN KEY (${sourceColName})
  REFERENCES ${targetTableName} (${targetColName});`.trim();

      stmts.push(stmt);
    }

    return stmts;
  }

  // ───────────────────────────────────────────────────────────
  // Helpers
  // ───────────────────────────────────────────────────────────

  private quoteIdent(name: string): string {
    // naive quoting; you can improve this
    return `"${name.replace(/"/g, '""')}"`;
  }
}
