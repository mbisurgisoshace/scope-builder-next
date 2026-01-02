// domain/model/Statement.ts
import { StatementId } from "./ids";
import { LogicStatement } from "./LogicStatement";
import { ReturnStatement } from "./ReturnStatement";
import { VariableStatement } from "./VariableStatement";

export type StatementType = "variable" | "logic" | "return";

export interface StatementBase {
  id: StatementId;
  type: StatementType;
}

export type Statement = VariableStatement | LogicStatement | ReturnStatement;
