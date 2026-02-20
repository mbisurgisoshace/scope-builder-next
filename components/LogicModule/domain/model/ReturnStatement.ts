// domain/model/ReturnStatement.ts
import { StatementBase } from "./Statement";
import { ValueSource } from "./ValueSource";

export interface ReturnStatement extends StatementBase {
  type: "return";
  source: ValueSource;
}
