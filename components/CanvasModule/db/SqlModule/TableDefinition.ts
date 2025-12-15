// components/CanvasModule/db/SqlModule/TableDefinition.ts

import { ColumnDefinition } from "./ColumnDefinition";

export interface TableDefinitionProps {
  id: string;
  name: string;
  columns?: ColumnDefinition[];
}

export class TableDefinition {
  id: string;
  name: string;
  columns: ColumnDefinition[];

  constructor(props: TableDefinitionProps) {
    this.id = props.id;
    this.name = props.name;
    this.columns = props.columns ?? [];
  }

  addColumn(col: ColumnDefinition): void {
    this.columns.push(col);
  }

  removeColumn(columnId: string): void {
    this.columns = this.columns.filter((c) => c.id !== columnId);
  }

  getColumn(columnId: string): ColumnDefinition | undefined {
    return this.columns.find((c) => c.id === columnId);
  }

  rename(newName: string): void {
    this.name = newName;
  }

  getPrimaryKeyColumns(): ColumnDefinition[] {
    return this.columns.filter((c) => c.isPrimaryKey);
  }
}
