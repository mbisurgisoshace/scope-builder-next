export type SqlScalarType = "string" | "number" | "boolean" | "autoIncrement";

export interface RelationshipEdge {
  id: string;
  fromTableId: string;
  toTableId: string;
  fkColumnId: string;
  targetColumnId: string; // usually PK
}

export interface ColumnDefinitionProps {
  id: string;
  name: string;
  isUnique?: boolean;
  type: SqlScalarType;
  isNullable?: boolean;
  isForeignKey?: boolean;
  isPrimaryKey?: boolean;
  foreignKey?: {
    tableId: string; // referenced table
    columnId: string; // referenced column (typically PK)
  };
}
