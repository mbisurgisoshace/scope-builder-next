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

export type FunctionSnapshot = {
  version: 1;
  params: Array<{ id: string; name: string }>;
  statements: Array<
    | {
        type: "variable";
        id: string;
        declarations: Array<{ name: string; source: any }>;
      }
    | { type: "logic"; id: string; assignments: any[] }
    | { type: "return"; id: string; source?: any }
  >;
  flow: Array<{ from: string; to: string }>;
};
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
    this.fn.addParameter(name);
  }

  removeParameterNamed(name: string) {
    const p = this.fn.listParameters().find((x) => x.name === name);
    if (!p) return;
    this.fn.removeParameter(p.id);
  }

  getParameters(): string[] {
    return this.fn.listParameters().map((p) => p.name);
  }

  /**
   * Replace all parameters with the given list.
   * Implemented using existing FunctionDefinition methods (no domain changes needed).
   */
  setParameters(names: string[]) {
    const normalized = names.map((n) => n.trim()).filter(Boolean);

    // Deduplicate while preserving order
    const uniq: string[] = [];
    const seen = new Set<string>();
    for (const n of normalized) {
      if (!seen.has(n)) {
        uniq.push(n);
        seen.add(n);
      }
    }

    // Remove all current params
    for (const p of this.fn.listParameters()) {
      this.fn.removeParameter(p.id);
    }

    // Add new params
    for (const name of uniq) {
      this.fn.addParameter(name);
    }
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

  setVariableDeclarationSource(
    statementIdRaw: string,
    declName: string,
    source:
      | { kind: "literal"; value: unknown }
      | { kind: "symbolRef"; name: string }
  ) {
    const id = asStatementId(statementIdRaw);
    const stmt = this.fn.getStatement(id);
    if (!stmt || stmt.type !== "variable") return;

    const v = stmt as VariableStatement;
    const d = v.declarations.find((x) => x.name === declName);
    if (!d) return;

    if (source.kind === "literal") d.source = Value.literal(source.value);
    if (source.kind === "symbolRef") d.source = Value.ref(source.name);
  }

  getVariableDeclarations(
    statementIdRaw: string
  ): Array<{ name: string; source: any }> {
    const id = asStatementId(statementIdRaw);
    const stmt = this.fn.getStatement(id);
    if (!stmt || stmt.type !== "variable") return [];
    const v = stmt as VariableStatement;
    return v.declarations.map((d) => ({ name: d.name, source: d.source }));
  }

  // ----------------
  // Persistence (Snapshot)
  // ----------------

  serialize(): FunctionSnapshot {
    // Params: your FunctionDefinition currently stores params internally.
    // If you don't have a list method yet, see notes below.
    const params = this.fn.listParameters().map((p) => ({
      id: String(p.id),
      name: p.name,
    }));

    const statements: FunctionSnapshot["statements"] = this.fn
      .listStatements()
      .map((s: any) => {
        if (s.type === "variable") {
          return {
            type: "variable",
            id: String(s.id),
            declarations: (s.declarations ?? []).map((d: any) => ({
              name: String(d.name),
              source: d.source ?? Value.literal(null),
            })),
          };
        }

        if (s.type === "logic") {
          return {
            type: "logic",
            id: String(s.id),
            assignments: s.assignments ?? [],
          };
        }

        return {
          type: "return",
          id: String(s.id),
          source: s.source ?? Value.literal(null),
        };
      });

    const flow = this.fn.listEdges().map((e: any) => ({
      from: String(e.from),
      to: String(e.to),
    }));

    return {
      version: 1,
      params,
      statements,
      flow,
    };
  }

  hydrate(snapshot: FunctionSnapshot) {
    // reset to a clean function
    this.fn = new FunctionDefinition({
      id: asFunctionId("fn_local"),
      name: "UntitledFunction",
    });

    // Restore params
    for (const p of snapshot.params ?? []) {
      // keep the same id if present (important for stable renames later)
      this.fn.addParameter(p.name, p.id as any);
    }

    // Restore statements
    for (const s of snapshot.statements ?? []) {
      const id = asStatementId(s.id);

      if (s.type === "variable") {
        const stmt: VariableStatement = {
          id,
          type: "variable",
          declarations: (s.declarations ?? []).map((d) => ({
            name: d.name,
            source: d.source ?? Value.literal(null),
          })),
        };
        this.fn.addStatement(stmt);
        continue;
      }

      if (s.type === "logic") {
        const stmt: LogicStatement = {
          id,
          type: "logic",
          assignments: (s as any).assignments ?? [],
        };
        this.fn.addStatement(stmt);
        continue;
      }

      const stmt: ReturnStatement = {
        id,
        type: "return",
        source: (s as any).source ?? Value.literal(null),
      };
      this.fn.addStatement(stmt);
    }

    // Restore flow edges
    for (const edge of snapshot.flow ?? []) {
      this.fn.connectFlow(asStatementId(edge.from), asStatementId(edge.to));
    }
  }
}

// temp id helper
function cryptoLikeId(): string {
  return Math.random().toString(16).slice(2);
}
