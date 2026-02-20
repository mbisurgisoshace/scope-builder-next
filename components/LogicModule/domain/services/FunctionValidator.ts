// domain/services/FunctionValidator.ts
import { ScopeResolver } from "./ScopeResolver";
import { ValueSource } from "../model/ValueSource";
import { ExecutionPlanner } from "./ExecutionPlanner";
import { ValidationError } from "../errors/DomainError";
import { FunctionDefinition } from "../model/FunctionDefinition";

export class FunctionValidator {
  constructor(
    private readonly planner = new ExecutionPlanner(),
    private readonly scope = new ScopeResolver()
  ) {}

  validate(fn: FunctionDefinition): void {
    // 1) cycle check (also establishes plan)
    const plan = this.planner.topoOrder(fn);

    // 2) name uniqueness across params + produced variables
    const seen = new Set<string>();

    for (const p of fn.listParameters()) {
      if (seen.has(p.name))
        throw new ValidationError(
          `Duplicate symbol name "${p.name}" (parameter).`
        );
      seen.add(p.name);
    }

    for (const stmt of fn.listStatements()) {
      if (stmt.type === "variable") {
        for (const d of stmt.declarations) {
          if (seen.has(d.name))
            throw new ValidationError(
              `Duplicate symbol name "${d.name}" (variable).`
            );
          seen.add(d.name);
        }
      } else if (stmt.type === "logic") {
        for (const a of stmt.assignments) {
          if (seen.has(a.output))
            throw new ValidationError(
              `Duplicate symbol name "${a.output}" (logic output).`
            );
          seen.add(a.output);
        }
      }
    }

    // 3) forward-reference check for each statement, based on scope
    for (const stmtId of plan) {
      const stmt = fn.getStatement(stmtId);
      if (!stmt) continue;

      const visible = new Set(
        this.scope.visibleSymbols(fn, stmtId).map((s) => s.name)
      );

      const refs = extractSymbolRefs(stmt);
      for (const r of refs) {
        if (!visible.has(r)) {
          throw new ValidationError(
            `Invalid reference "${r}" in statement ${String(
              stmtId
            )} (not in scope).`,
            {
              statementId: String(stmtId),
              ref: r,
            }
          );
        }
      }
    }

    // 4) Return statement presence (optional)
    // If you want to enforce it:
    // const hasReturn = fn.listStatements().some((s) => s.type === "return");
    // if (!hasReturn) throw new ValidationError("Function must have a ReturnStatement.");
  }
}

function extractSymbolRefs(stmt: any): string[] {
  const out: string[] = [];

  // VariableStatement
  if (stmt.type === "variable") {
    for (const d of stmt.declarations)
      collectRefsFromValueSource(d.source, out);
  }

  // LogicStatement (v1: expression is just text; we can’t parse reliably yet)
  // If you later add an expression parser, extract identifiers properly.
  if (stmt.type === "logic") {
    // no-op for now, OR naive parse:
    // out.push(...naiveIdentifierExtract(a.expression))
  }

  // ReturnStatement
  if (stmt.type === "return") {
    collectRefsFromValueSource(stmt.source, out);
  }

  return out;
}

function collectRefsFromValueSource(src: ValueSource, out: string[]) {
  if (src.kind === "symbolRef") out.push(src.name);

  // For expression: v1 no parser. Later, parse AST and extract identifiers.
  // if (src.kind === "expression") out.push(...naiveIdentifierExtract(src.expr));
}
