// db/MysqlDDLExporter.ts
import type { SqlSchema } from "../../SqlSchema";
import type { SchemaExporter } from "../SchemaExporter";
import type { TableDefinition } from "../../TableDefinition";
import type { ColumnDefinition } from "../../ColumnDefinition";

export class MysqlDDLExporter implements SchemaExporter {
  generateSchema(schema: SqlSchema): string {
    const stmts: string[] = [];

    for (const table of schema.listTables()) {
      stmts.push(this.createTableStatement(table));
    }

    for (const table of schema.listTables()) {
      stmts.push(...this.foreignKeyStatements(schema, table));
    }

    return stmts.filter(Boolean).join("\n\n");
  }

  generateTable(schema: SqlSchema, tableId: string): string {
    const table = schema.getTable(tableId);
    if (!table) {
      throw new Error(`Table ${tableId} not found`);
    }

    const create = this.createTableStatement(table);
    const fks = this.foreignKeyStatements(schema, table);

    return [create, ...fks].filter(Boolean).join("\n\n");
  }

  // ───────────────────────────────────────────────────────────
  // Internal helpers
  // ───────────────────────────────────────────────────────────

  private createTableStatement(table: TableDefinition): string {
    const cols = table.columns;
    const colLines: string[] = [];

    for (const col of cols) {
      colLines.push("  " + this.columnDefinition(col));
    }

    const pkCols = cols.filter((c) => c.isPrimaryKey);
    if (pkCols.length > 1) {
      const colNames = pkCols.map((c) => this.q(c.name)).join(", ");
      colLines.push(`  PRIMARY KEY (${colNames})`);
    }

    const tableName = this.q(table.name);
    // In MySQL we often set an engine + charset
    return `CREATE TABLE ${tableName} (\n${colLines.join(
      ",\n"
    )}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
  }

  private columnDefinition(col: ColumnDefinition): string {
    const parts: string[] = [];

    parts.push(this.q(col.name));
    parts.push(this.mapType(col));

    if (!col.isNullable) {
      parts.push("NOT NULL");
    }
    if (col.isUnique && !col.isPrimaryKey) {
      parts.push("UNIQUE");
    }
    if (col.isPrimaryKey) {
      // In MySQL it’s common to define PK at table-level,
      // but single-column PK inline is also accepted.
      parts.push("PRIMARY KEY");
    }

    return parts.join(" ");
  }

  private mapType(col: ColumnDefinition): string {
    switch (col.type) {
      case "string":
        return "VARCHAR(255)";
      case "number":
        return "INT";
      case "boolean":
        // MySQL option: TINYINT(1) or BOOLEAN (alias).
        return "TINYINT(1)";
      case "autoIncrement":
        return "INT AUTO_INCREMENT";
      default:
        return "VARCHAR(255)";
    }
  }

  private foreignKeyStatements(
    schema: SqlSchema,
    table: TableDefinition
  ): string[] {
    const stmts: string[] = [];

    for (const col of table.columns) {
      if (!col.isForeignKey || !col.foreignKey) continue;

      const targetTable = schema.getTable(col.foreignKey.tableId);
      if (!targetTable) continue;

      const sourceTableName = this.q(table.name);
      const targetTableName = this.q(targetTable.name);
      const sourceColName = this.q(col.name);

      const targetCol = targetTable.columns.find(
        (c) => c.id === col.foreignKey!.columnId
      );
      if (!targetCol) continue;

      const targetColName = this.q(targetCol.name);

      const constraintName = this.q(
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

  private q(name: string): string {
    // MySQL identifier quoting with backticks
    return `\`${name.replace(/`/g, "``")}\``;
  }
}
