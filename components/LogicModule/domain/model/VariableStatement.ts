// domain/model/VariableStatement.ts
import { StatementBase } from "./Statement";
import { ValueSource } from "./ValueSource";

export interface VariableDeclaration {
  name: string;
  source: ValueSource;
}

export interface VariableStatement extends StatementBase {
  type: "variable";
  declarations: VariableDeclaration[];
}
