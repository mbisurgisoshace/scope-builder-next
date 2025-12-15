// db/SchemaExporter.ts
import type { SqlSchema } from "../SqlSchema";

export type SqlDialect = "postgres" | "mysql";

export interface SchemaExporter {
  /** Full schema → DDL (all tables + FKs) */
  generateSchema(schema: SqlSchema): string;

  /** Single table → DDL (CREATE TABLE + its FKs) */
  generateTable(schema: SqlSchema, tableId: string): string;
}
