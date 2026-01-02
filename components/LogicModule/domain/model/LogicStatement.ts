// domain/model/LogicStatement.ts
import { StatementBase } from "./Statement";

export interface LogicAssignment {
  output: string;
  expression: string; // parse later
}

export interface LogicStatement extends StatementBase {
  type: "logic";
  assignments: LogicAssignment[];
}
