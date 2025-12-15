// components/CanvasModule/db/SqlModule/SqlSchemaService.ts

import { SqlSchema } from "./SqlSchema";
import { SqlScalarType } from "./types";
import { TableDefinition } from "./TableDefinition";
import { ColumnDefinition } from "./ColumnDefinition";
import { createExporter } from "./SchemaExporter/createExporter";
import { SqlDialect } from "./SchemaExporter/SchemaExporter";

export interface CreateTableOptions {
  id?: string; // optional: allow caller to inject a specific id
  name: string;
}

export interface CreateColumnOptions {
  id?: string;
  name: string;
  tableId: string;
  isUnique?: boolean;
  type: SqlScalarType;
  isNullable?: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  foreignKey?: {
    tableId: string;
    columnId: string;
  };
}

export interface UpdateColumnOptions {
  name?: string;
  isUnique?: boolean;
  isNullable?: boolean;
  type?: SqlScalarType;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  foreignKey?: { tableId: string; columnId: string };
}

/**
 * DbSchemaService
 *
 * High-level API used by the UI / canvas to manipulate the SQL schema.
 * It wraps SqlSchema, TableDefinition and ColumnDefinition so the rest of
 * the app does not need to know about internal maps/arrays.
 */
export class DbSchemaService {
  private schema: SqlSchema;
  private generateId: () => string;

  constructor(schema: SqlSchema, generateId?: () => string) {
    this.schema = schema;
    // allow injecting your own id generator (uuidv4, nanoid, etc.)
    this.generateId = generateId ?? (() => crypto.randomUUID());
  }

  private enforceColumnInvariants(
    table: TableDefinition,
    col: ColumnDefinition
  ) {
    // Rule 1: PK implies UNIQUE + NOT NULL
    if (col.isPrimaryKey) {
      col.isUnique = true;
      col.isNullable = false;
    }

    // You can add more rules here later:
    // - autoIncrement must be number
    // - FK must reference an existing table+column
    // - etc.
  }

  // ───────────────────────────────────────────────────────────
  // TABLE OPERATIONS
  // ───────────────────────────────────────────────────────────

  createTable(options: CreateTableOptions): TableDefinition {
    const id = options.id ?? this.generateId();
    const table = new TableDefinition({
      id,
      name: options.name,
      columns: [],
    });

    this.schema.addTable(table);
    return table;
  }

  deleteTable(tableId: string): void {
    this.schema.removeTable(tableId);
  }

  renameTable(tableId: string, newName: string): void {
    const table = this.schema.getTable(tableId);
    if (!table) {
      throw new Error(`Table ${tableId} not found`);
    }
    table.rename(newName);
  }

  getTable(tableId: string): TableDefinition | undefined {
    return this.schema.getTable(tableId);
  }

  listTables(): TableDefinition[] {
    return this.schema.listTables();
  }

  // ───────────────────────────────────────────────────────────
  // COLUMN OPERATIONS
  // ───────────────────────────────────────────────────────────

  addColumn(opts: CreateColumnOptions): ColumnDefinition {
    const table = this.schema.getTable(opts.tableId);
    if (!table) {
      throw new Error(`Table ${opts.tableId} not found`);
    }

    const id = opts.id ?? this.generateId();

    const column = new ColumnDefinition({
      id,
      name: opts.name,
      type: opts.type,
      isPrimaryKey: opts.isPrimaryKey,
      isNullable: opts.isNullable,
      isUnique: opts.isUnique,
      isForeignKey: opts.isForeignKey,
      foreignKey: opts.foreignKey,
    });

    this.enforceColumnInvariants(table, column);

    table.addColumn(column);

    // Optional: basic rule – if column is autoIncrement, mark as PK+not null
    if (column.type === "autoIncrement") {
      column.isPrimaryKey = true;
      column.isNullable = false;
    }

    return column;
  }

  updateColumn(
    tableId: string,
    columnId: string,
    updates: UpdateColumnOptions
  ): ColumnDefinition {
    const table = this.schema.getTable(tableId);
    if (!table) {
      throw new Error(`Table ${tableId} not found`);
    }

    const col = table.getColumn(columnId);
    if (!col) {
      throw new Error(`Column ${columnId} not found in table ${tableId}`);
    }

    if (updates.name !== undefined) col.name = updates.name;
    if (updates.type !== undefined) col.type = updates.type;
    if (updates.isPrimaryKey !== undefined)
      col.isPrimaryKey = updates.isPrimaryKey;
    if (updates.isNullable !== undefined) col.isNullable = updates.isNullable;
    if (updates.isUnique !== undefined) col.isUnique = updates.isUnique;
    if (updates.isForeignKey !== undefined)
      col.isForeignKey = updates.isForeignKey;
    if (updates.foreignKey !== undefined) {
      col.foreignKey = updates.foreignKey || undefined;
      col.isForeignKey = !!updates.foreignKey;
    }

    this.enforceColumnInvariants(table, col);

    return col;
  }

  removeColumn(tableId: string, columnId: string): void {
    const table = this.schema.getTable(tableId);
    if (!table) {
      throw new Error(`Table ${tableId} not found`);
    }
    table.removeColumn(columnId);
  }

  generateDDL(dialect: SqlDialect = "postgres"): string {
    // const generator = new SqlCodeGenerator(dialect);
    // return generator.generateDDL(this.schema);
    const exporter = createExporter(dialect);
    return exporter.generateSchema(this.schema);
  }

  generateTableDDL(tableId: string, dialect: SqlDialect = "postgres"): string {
    // const generator = new SqlCodeGenerator(dialect);
    // return generator.generateTableDDL(this.schema, tableId);
    const exporter = createExporter(dialect);
    return exporter.generateTable(this.schema, tableId);
  }

  /**
   * Convenience helper: mark one column as the single primary key.
   * (If you later want composite PKs, we can relax this.)
   */
  setSinglePrimaryKey(tableId: string, columnId: string): void {
    const table = this.schema.getTable(tableId);
    if (!table) {
      throw new Error(`Table ${tableId} not found`);
    }

    for (const col of table.columns) {
      col.isPrimaryKey = col.id === columnId;

      this.enforceColumnInvariants(table, col);
    }
  }

  setColumnForeignKey(
    tableId: string,
    columnId: string,
    ref: { tableId: string; columnId: string }
  ): void {
    this.updateColumn(tableId, columnId, {
      foreignKey: ref,
      isForeignKey: true,
    });
  }

  clearColumnForeignKey(tableId: string, columnId: string): void {
    this.updateColumn(tableId, columnId, {
      foreignKey: undefined,
      isForeignKey: false,
    });
  }
}
