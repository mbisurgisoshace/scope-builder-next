import { Value } from "../domain/model/ValueSource";
import { LogicStatement } from "../domain/model/LogicStatement";
import { ScopeResolver } from "../domain/services/ScopeResolver";
import { ReturnStatement } from "../domain/model/ReturnStatement";
import { asFunctionId, asStatementId } from "../domain/model/ids";
import { VariableStatement } from "../domain/model/VariableStatement";
import { ExecutionPlanner } from "../domain/services/ExecutionPlanner";
import { FunctionDefinition } from "../domain/model/FunctionDefinition";
import { FunctionValidator } from "../domain/services/FunctionValidator";

export function playground() {
  // --------------------------------------------------
  // 1) Create function
  // --------------------------------------------------

  const fn = new FunctionDefinition({
    id: asFunctionId("fn_1"),
    name: "calculateTotal",
  });

  fn.addParameter({ name: "price" });
  fn.addParameter({ name: "taxRate" });

  // --------------------------------------------------
  // 2) Create statements
  // --------------------------------------------------

  const varStmt1: VariableStatement = {
    id: asStatementId("stmt_var_1"),
    type: "variable",
    declarations: [
      {
        name: "tax",
        source: Value.expr("price * taxRate"), // expression parsing later
      },
    ],
  };

  const varStmt2: VariableStatement = {
    id: asStatementId("stmt_var_2"),
    type: "variable",
    declarations: [
      {
        name: "total",
        source: Value.expr("price + tax"),
      },
    ],
  };

  const logicStmt: LogicStatement = {
    id: asStatementId("stmt_logic_1"),
    type: "logic",
    assignments: [
      {
        output: "discountedTotal",
        expression: "total * 0.9",
      },
    ],
  };

  const returnStmt: ReturnStatement = {
    id: asStatementId("stmt_return_1"),
    type: "return",
    source: Value.ref("discountedTotal"),
  };

  // --------------------------------------------------
  // 3) Add statements to function
  // --------------------------------------------------

  fn.addStatement(varStmt1);
  fn.addStatement(varStmt2);
  fn.addStatement(logicStmt);
  fn.addStatement(returnStmt);

  // --------------------------------------------------
  // 4) Connect flow (execution + scope)
  // Function params → var1 → var2 → logic → return
  // --------------------------------------------------

  fn.connectFlow(varStmt1.id, varStmt2.id);
  fn.connectFlow(varStmt2.id, logicStmt.id);
  fn.connectFlow(logicStmt.id, returnStmt.id);

  // --------------------------------------------------
  // 5) Inspect execution order
  // --------------------------------------------------

  const planner = new ExecutionPlanner();
  const plan = planner.topoOrder(fn);

  console.log("=== Execution order ===");
  for (const id of plan) {
    const stmt = fn.getStatement(id);
    console.log(`- ${id} (${stmt?.type})`);
  }

  // --------------------------------------------------
  // 6) Inspect scope at each statement
  // --------------------------------------------------

  const scope = new ScopeResolver();

  console.log("\n=== Visible symbols per statement ===");
  for (const id of plan) {
    const symbols = scope.visibleSymbols(fn, id).map((s) => s.name);
    console.log(`- ${id}:`, symbols);
  }

  // --------------------------------------------------
  // 7) Validate function
  // --------------------------------------------------

  const validator = new FunctionValidator();

  try {
    validator.validate(fn);
    console.log("\n✅ Function is VALID");
  } catch (err) {
    console.error("\n❌ Function validation failed");
    console.error(err);
  }

  // --------------------------------------------------
  // 8) Pretty print (mental model)
  // --------------------------------------------------

  console.log("\n=== Function summary ===");
  console.log({
    name: fn.getName(),
    params: fn.listParameters().map((p) => p.name),
    statements: fn.listStatements().map((s) => ({
      id: s.id,
      type: s.type,
    })),
  });
}
