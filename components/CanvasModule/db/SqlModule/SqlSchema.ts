// components/CanvasModule/db/SqlModule/SqlSchema.ts

import { RelationshipEdge } from "./types";
import { TableDefinition } from "./TableDefinition";

export class SqlSchema {
  private tables = new Map<string, TableDefinition>();

  addTable(table: TableDefinition): void {
    this.tables.set(table.id, table);
  }

  removeTable(tableId: string): void {
    this.tables.delete(tableId);
  }

  getTable(tableId: string): TableDefinition | undefined {
    return this.tables.get(tableId);
  }

  listTables(): TableDefinition[] {
    return Array.from(this.tables.values());
  }

  getRelationships(): RelationshipEdge[] {
    const edges: RelationshipEdge[] = [];

    for (const table of this.listTables()) {
      for (const col of table.columns) {
        if (col.isForeignKey && col.foreignKey) {
          edges.push({
            id: `fk-${table.id}-${col.id}`,
            fromTableId: table.id,
            toTableId: col.foreignKey.tableId,
            fkColumnId: col.id,
            targetColumnId: col.foreignKey.columnId,
          });
        }
      }
    }

    return edges;
  }
}
