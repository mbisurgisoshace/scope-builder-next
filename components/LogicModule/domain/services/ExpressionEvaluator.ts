// domain/services/ExpressionEvaluator.ts
import { ValueSource } from "../model/ValueSource";

export class ExpressionEvaluator {
  evaluate(source: ValueSource, scope: Record<string, unknown>): number {
    switch (source.kind) {
      case "literal": {
        const n = this.toNumber(source.value);
        if (n == null)
          throw new Error(`Literal is not numeric: ${source.value}`);
        return n;
      }

      case "symbolRef": {
        if (!(source.name in scope)) {
          throw new Error(`Unknown symbol: ${source.name}`);
        }
        const n = this.toNumber(scope[source.name]);
        if (n == null)
          throw new Error(`Symbol "${source.name}" is not numeric.`);
        return n;
      }

      case "expression": {
        return this.evalExpression(source.expr, scope);
      }
    }
  }

  private evalExpression(expr: string, scope: Record<string, unknown>): number {
    const names = Object.keys(scope);
    const values = Object.values(scope).map((v) => {
      const n = this.toNumber(v);
      // We pass NaN for non-numeric so expression can error cleanly after eval
      return n ?? NaN;
    });

    // Safe-ish sandbox: only variables you pass in are visible
    // NOTE: later we can swap this to a real parser (expr-eval, mathjs) if you want.
    const fn = new Function(...names, `"use strict"; return (${expr});`);

    const out = fn(...values);
    const n = this.toNumber(out);
    if (n == null)
      throw new Error(`Expression did not evaluate to a number: ${expr}`);
    return n;
  }

  private toNumber(v: unknown): number | null {
    if (typeof v === "number" && Number.isFinite(v)) return v;

    if (typeof v === "string") {
      const trimmed = v.trim();
      if (!trimmed) return null;

      // basic coercion: "10", "10.5", "  10 "
      const n = Number(trimmed);
      if (Number.isFinite(n)) return n;
      return null;
    }

    if (typeof v === "boolean") return v ? 1 : 0;

    // allow Date -> timestamp? (optional)
    // if (v instanceof Date) return v.getTime();

    return null;
  }
}
