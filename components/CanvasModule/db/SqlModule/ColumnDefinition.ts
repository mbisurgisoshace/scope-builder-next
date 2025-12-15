// components/CanvasModule/db/SqlModule/ColumnDefinition.ts

import { ColumnDefinitionProps, SqlScalarType } from "./types";

export class ColumnDefinition {
  id: string;
  name: string;
  type: SqlScalarType;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
  isForeignKey: boolean;
  foreignKey?: {
    tableId: string;
    columnId: string;
  };

  constructor(props: ColumnDefinitionProps) {
    this.id = props.id;
    this.name = props.name;
    this.type = props.type;
    this.isPrimaryKey = props.isPrimaryKey ?? false;
    this.isNullable = props.isNullable ?? true;
    this.isUnique = props.isUnique ?? false;
    this.isForeignKey = props.isForeignKey ?? false;
    this.foreignKey = props.foreignKey;
  }

  clone(overrides: Partial<ColumnDefinitionProps> = {}): ColumnDefinition {
    return new ColumnDefinition({
      id: overrides.id ?? this.id,
      name: overrides.name ?? this.name,
      type: overrides.type ?? this.type,
      isPrimaryKey: overrides.isPrimaryKey ?? this.isPrimaryKey,
      isNullable: overrides.isNullable ?? this.isNullable,
      isUnique: overrides.isUnique ?? this.isUnique,
      isForeignKey: overrides.isForeignKey ?? this.isForeignKey,
    });
  }
}
