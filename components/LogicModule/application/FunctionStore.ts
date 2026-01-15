import { Value, ValueSource } from "../domain/model/ValueSource";
import { LogicStatement } from "../domain/model/LogicStatement";
import { ScopeResolver } from "../domain/services/ScopeResolver";
import { ReturnStatement } from "../domain/model/ReturnStatement";
import { asFunctionId, asStatementId } from "../domain/model/ids";
import { Statement, StatementType } from "../domain/model/Statement";
import { VariableStatement } from "../domain/model/VariableStatement";
import { ExecutionPlanner } from "../domain/services/ExecutionPlanner";
import { FunctionDefinition } from "../domain/model/FunctionDefinition";
import { FunctionValidator } from "../domain/services/FunctionValidator";
import { ExpressionEvaluator } from "../domain/services/ExpressionEvaluator";

type LogicExpr =
  | { kind: "literal"; value: unknown }
  | { kind: "symbolRef"; name: string };

type SimpleLogicAssignment = {
  target: string;
  expr: LogicExpr;
};

function encodeExpr(expr: LogicExpr): string {
  if (expr.kind === "symbolRef") return `ref:${expr.name}`;
  // store literals as string payload, but allow numbers/booleans/etc
  return `lit:${String(expr.value ?? "")}`;
}

function decodeExpr(expression: string): LogicExpr {
  const raw = String(expression ?? "");
  if (raw.startsWith("ref:")) return { kind: "symbolRef", name: raw.slice(4) };
  if (raw.startsWith("lit:")) {
    const s = raw.slice(4);
    // auto-coerce numeric string -> number
    const n = Number(s);
    if (s.trim() !== "" && Number.isFinite(n))
      return { kind: "literal", value: n };
    return { kind: "literal", value: s };
  }
  return { kind: "literal", value: raw };
}

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

  private scope = new ScopeResolver();
  private planner = new ExecutionPlanner();
  private validator = new FunctionValidator();
  private evaluator = new ExpressionEvaluator();

  constructor(fn?: FunctionDefinition) {
    this.fn =
      fn ??
      new FunctionDefinition({
        id: asFunctionId("fn_local"),
        name: "UntitledFunction",
      });
  }

  /**
   * Computes numeric values for currently visible symbols by executing statements
   * in topo order. This is read-only and used for Debug UI (v1).
   *
   * Returns:
   * - values: symbol -> number
   * - errors: symbol -> string (why it failed)
   */
  computeRuntimeValues(): {
    values: Record<string, number>;
    errors: Record<string, string>;
  } {
    const values: Record<string, number> = {};
    const errors: Record<string, string> = {};

    let ordered: string[] = [];
    try {
      ordered = this.getExecutionPlan();
    } catch (e: any) {
      // If the plan fails (cycle), return empty + one global error
      return {
        values,
        errors: { __plan__: String(e?.message ?? e) },
      };
    }

    const scope: Record<string, unknown> = {};

    // 1) Seed scope with params (MVP: params have no values yet)
    // For now we expose params as NaN until/compiler assigns them.
    // If you later let params have default values, plug them here.
    for (const p of this.fn.listParameters()) {
      scope[p.name] = scope[p.name] ?? NaN;
    }

    // 2) Execute statements in order
    for (const stmtId of ordered) {
      const stmt = this.fn.getStatement(asStatementId(String(stmtId)));
      if (!stmt) continue;

      if (stmt.type === "variable") {
        const v = stmt as any;

        for (const decl of v.declarations ?? []) {
          const name = String(decl.name);
          const src = decl.source as ValueSource | undefined;

          if (!src) {
            errors[name] = "Missing source";
            continue;
          }

          try {
            const num = this.evaluator.evaluate(src, scope);
            scope[name] = num;
            values[name] = num;
            delete errors[name];
          } catch (e: any) {
            errors[name] = String(e?.message ?? e);
            // keep scope entry so downstream formulas can still run and error meaningfully
            scope[name] = NaN;
          }
        }
      }

      // logic + return later (Step 3+)
    }

    return { values, errors };
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
        source: Value.literal(NaN),
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

  getLogicAssignment(statementIdRaw: string): SimpleLogicAssignment | null {
    const id = asStatementId(statementIdRaw);
    const stmt = this.fn.getStatement(id);
    if (!stmt || stmt.type !== "logic") return null;

    const logic = stmt as LogicStatement;
    const first = (logic.assignments ?? [])[0];
    if (!first) return null;

    const target = String(first.output ?? "").trim();
    if (!target) return null;

    return {
      target,
      expr: decodeExpr(String(first.expression ?? "")),
    };
  }

  setLogicAssignment(statementIdRaw: string, a: SimpleLogicAssignment) {
    const id = asStatementId(statementIdRaw);
    const stmt = this.fn.getStatement(id);
    if (!stmt || stmt.type !== "logic") return;

    const logic = stmt as LogicStatement;

    const target = a.target.trim();
    if (!target) return;

    logic.assignments = [
      {
        output: target,
        expression: encodeExpr(a.expr),
      },
    ];
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
      | { kind: "expression"; expr: string }
  ) {
    const id = asStatementId(statementIdRaw);
    const stmt = this.fn.getStatement(id);
    if (!stmt || stmt.type !== "variable") return;

    const v = stmt as VariableStatement;
    const d = v.declarations.find((x) => x.name === declName);
    if (!d) return;

    if (source.kind === "literal") d.source = Value.literal(source.value);
    if (source.kind === "symbolRef") d.source = Value.ref(source.name);
    if (source.kind === "expression") d.source = Value.expr(source.expr);
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

  // --- Return helpers (Step 3) ---

  getReturnSource(statementIdRaw: string): ValueSource | null {
    const stmt = this.fn.getStatement(asStatementId(statementIdRaw));
    if (!stmt || stmt.type !== "return") return null;
    return (stmt as ReturnStatement).source ?? null;
  }

  setReturnSource(statementIdRaw: string, source: ValueSource) {
    const stmt = this.fn.getStatement(asStatementId(statementIdRaw));
    if (!stmt || stmt.type !== "return") return;

    (stmt as ReturnStatement).source = source;
  }

  /**
   * Compute return value by executing statements in topo order.
   * - evaluates variables (as today)
   * - when it reaches the Return node, evaluates its source against current scope
   */
  computeReturnValue(): {
    value: number | null;
    error?: string;
    scopeValues: Record<string, number>;
    scopeErrors: Record<string, string>;
  } {
    const { values, errors } = this.computeRuntimeValues();

    // Build a scope that includes everything computeRuntimeValues produced
    // (it already seeded params + ran variable declarations).
    const scope: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) scope[k] = v;
    // NOTE: params were seeded as NaN inside computeRuntimeValues. That’s OK for now.

    // Find the (single) return statement if present
    const returnStmt = this.fn
      .listStatements()
      .find((s) => s.type === "return") as ReturnStatement | undefined;

    if (!returnStmt) {
      return { value: null, scopeValues: values, scopeErrors: errors };
    }

    try {
      const num = this.evaluator.evaluate(returnStmt.source, scope);
      return { value: num, scopeValues: values, scopeErrors: errors };
    } catch (e: any) {
      return {
        value: null,
        error: String(e?.message ?? e),
        scopeValues: values,
        scopeErrors: errors,
      };
    }
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
