// db/createExporter.ts
import type { SqlDialect, SchemaExporter } from "./SchemaExporter";
import { MysqlDDLExporter } from "./SchemaExporterStrategies/MysqlDDLExporter";
import { PostgresDDLExporter } from "./SchemaExporterStrategies/PostgresDDLExporter";

export function createExporter(dialect: SqlDialect): SchemaExporter {
  switch (dialect) {
    case "postgres":
      return new PostgresDDLExporter();
    case "mysql":
      return new MysqlDDLExporter();
    default:
      // exhaustive check if you add more later
      const _exhaustive: never = dialect;
      throw new Error(`Unsupported dialect: ${dialect}`);
  }
}
