import { Value } from "../domain/model/ValueSource";
import { LogicStatement } from "../domain/model/LogicStatement";
import { ScopeResolver } from "../domain/services/ScopeResolver";
import { ReturnStatement } from "../domain/model/ReturnStatement";
import { asFunctionId, asStatementId } from "../domain/model/ids";
import { Statement, StatementType } from "../domain/model/Statement";
import { VariableStatement } from "../domain/model/VariableStatement";
import { ExecutionPlanner } from "../domain/services/ExecutionPlanner";
import { FunctionDefinition } from "../domain/model/FunctionDefinition";
import { FunctionValidator } from "../domain/services/FunctionValidator";

export class FunctionStore {
  private fn: FunctionDefinition;

  private validator = new FunctionValidator();
  private planner = new ExecutionPlanner();
  private scope = new ScopeResolver();

  constructor(fn?: FunctionDefinition) {
    this.fn =
      fn ??
      new FunctionDefinition({
        id: asFunctionId("fn_local"),
        name: "UntitledFunction",
      });
  }

  // ----------------
  // Mutations (Commands)
  // ----------------

  addStatementWithId(type: StatementType, idRaw: string): Statement {
    //const id = asStatementId(`stmt_${cryptoLikeId()}`);
    const id = asStatementId(idRaw);

    let stmt: Statement;

    if (type === "variable") {
      stmt = {
        id,
        type: "variable",
        declarations: [],
      } satisfies VariableStatement;
    } else if (type === "logic") {
      stmt = {
        id,
        type: "logic",
        assignments: [],
      } satisfies LogicStatement;
    } else {
      stmt = {
        id,
        type: "return",
        source: Value.literal(null),
      } satisfies ReturnStatement;
    }

    this.fn.addStatement(stmt);
    return stmt;
  }

  removeStatement(id: string) {
    this.fn.removeStatement(asStatementId(id));
  }

  addParameterNamed(name: string) {
    this.fn.addParameter({ name });
  }
  removeParameterNamed(name: string) {
    this.fn.removeParameter(name);
  }

  connectFlow(from: string, to: string) {
    this.fn.connectFlow(asStatementId(from), asStatementId(to));
  }

  disconnectFlow(edgeId: string) {
    // optional for now
  }

  // ----------------
  // Queries (Read model)
  // ----------------

  getFunction(): FunctionDefinition {
    return this.fn;
  }

  getStatements(): Statement[] {
    return this.fn.listStatements();
  }

  getEdges() {
    return this.fn.listEdges();
  }

  getExecutionPlan(): string[] {
    return this.planner.topoOrder(this.fn).map(String);
  }

  getVisibleSymbols(statementId: string) {
    return this.scope.visibleSymbols(this.fn, asStatementId(statementId));
  }

  validate(): { ok: true } | { ok: false; error: unknown } {
    try {
      this.validator.validate(this.fn);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e };
    }
  }

  setVariableDeclarations(statementIdRaw: string, names: string[]) {
    const id = asStatementId(statementIdRaw);
    const stmt = this.fn.getStatement(id);

    if (!stmt || stmt.type !== "variable") return;

    const v = stmt as VariableStatement;

    v.declarations = names
      .map((n) => n.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        source: Value.literal(null), // placeholder for now
      }));
  }

  getStatement(statementIdRaw: string) {
    return this.fn.getStatement(asStatementId(statementIdRaw));
  }
}

// temp id helper
function cryptoLikeId(): string {
  return Math.random().toString(16).slice(2);
}
