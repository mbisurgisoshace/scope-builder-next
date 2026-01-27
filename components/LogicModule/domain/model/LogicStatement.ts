// domain/model/LogicStatement.ts
import { StatementBase } from "./Statement";

export interface LogicAssignment {
  output: string;
  expression: string; // parse later
}

/**
 * Configuration for a "reduce over array" / "foreach" logic node.
 *
 * Semantics (conceptual):
 *   let acc = eval(initialExpr, scope)
 *   for each item of scope[inputArray] as itemVar:
 *       acc = eval(bodyExpr, { ...scope, [itemVar]: item, [accVar]: acc })
 *   scope[accVar] = acc
 *
 * All fields are symbol/expression names, not ValueSource yet (we keep it simple for v1).
 */
export interface ReduceEachConfig {
  /** Name of the symbol that must resolve to an array value in scope */
  inputArray: string;

  /** Name of the "current element" variable visible inside the body expression */
  itemVar: string;

  /** Name of the accumulator symbol to write the final result into */
  accVar: string;

  /** Initial value expression for the accumulator (e.g. "0") */
  initialExpr: string;

  /** Body expression that computes the next accumulator value (e.g. "acc + item") */
  bodyExpr: string;
}
export interface LogicStatement extends StatementBase {
  type: "logic";
  assignments: LogicAssignment[];
  /**
   * Optional config for a reduce/foreach node.
   * When present, the FunctionStore/runtime will interpret this LogicStatement
   * as "reduceEach" instead of a plain assignment.
   */
  reduceEachConfig?: ReduceEachConfig;
}
