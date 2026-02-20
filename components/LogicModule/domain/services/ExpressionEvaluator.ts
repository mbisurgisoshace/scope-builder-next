import { ValueSource } from "../model/ValueSource";

export class ExpressionEvaluator {
  /**
   * Evaluate a ValueSource against the current scope.
   * Returns:
   *  - number   → for normal numeric expressions
   *  - any      → for literals / arrays (we only really need this in scope)
   */
  evaluate(source: ValueSource, scope: Record<string, unknown>): any {
    switch (source.kind) {
      case "literal": {
        // For literals we trust the stored value (number, string, array, etc.)
        return source.value;
      }

      case "symbolRef": {
        if (!(source.name in scope)) {
          throw new Error(`Unknown symbol: ${source.name}`);
        }
        // Forward whatever is in scope (number, array, etc.)
        return scope[source.name];
      }

      case "expression": {
        return this.evalExpression(source.expr, scope);
      }
    }
  }

  /**
   * Evaluate a string expression like "subtotal * 5" or "sum(numbers)".
   * We:
   *  - pass all scope variables through *as-is* (no numeric coercion here),
   *  - inject helpers like sum(), avg(), max(), min().
   */
  private evalExpression(expr: string, scope: Record<string, unknown>): any {
    console.log("scope in evalExpression:", scope);
    const names = Object.keys(scope);
    const values = Object.values(scope); // <-- NO toNumber here

    const toNumber = this.toNumber;

    const sum = (arg: unknown): number => {
      if (!Array.isArray(arg)) {
        throw new Error("sum() expects an array");
      }

      let total = 0;
      for (const v of arg) {
        const n = toNumber(v);
        if (n == null) {
          throw new Error(`sum() element is not numeric: ${String(v)}`);
        }
        total += n;
      }
      return total;
    };

    const avg = (arg: unknown): number => {
      if (!Array.isArray(arg)) {
        throw new Error("avg() expects an array");
      }
      if (arg.length === 0) return 0;
      return sum(arg) / arg.length;
    };

    const max = (arg: unknown): number => {
      if (!Array.isArray(arg)) {
        throw new Error("max() expects an array");
      }
      let best: number | null = null;
      for (const v of arg) {
        const n = toNumber(v);
        if (n == null) continue;
        best = best == null ? n : Math.max(best, n);
      }
      if (best == null) {
        throw new Error("max() array has no numeric items");
      }
      return best;
    };

    const min = (arg: unknown): number => {
      if (!Array.isArray(arg)) {
        throw new Error("min() expects an array");
      }
      let best: number | null = null;
      for (const v of arg) {
        const n = toNumber(v);
        if (n == null) continue;
        best = best == null ? n : Math.min(best, n);
      }
      if (best == null) {
        throw new Error("min() array has no numeric items");
      }
      return best;
    };

    // We expose:
    //  - all scope variables as plain arguments
    //  - helpers: sum, avg, max, min
    const fn = new Function(
      ...names,
      "sum",
      "avg",
      "max",
      "min",
      `"use strict"; return (${expr});`,
    );

    return fn(...values, sum, avg, max, min);
  }

  private toNumber(v: unknown): number | null {
    if (typeof v === "number" && Number.isFinite(v)) return v;

    if (typeof v === "string") {
      const trimmed = v.trim();
      if (!trimmed) return null;

      const n = Number(trimmed);
      if (Number.isFinite(n)) return n;
      return null;
    }

    if (typeof v === "boolean") return v ? 1 : 0;

    return null;
  }
}
