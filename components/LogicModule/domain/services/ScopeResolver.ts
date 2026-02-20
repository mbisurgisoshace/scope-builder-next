// domain/services/ScopeResolver.ts
import { StatementId } from "../model/ids";
import { SymbolInfo } from "../model/Symbols";
import { Statement } from "../model/Statement";
import { FunctionDefinition } from "../model/FunctionDefinition";

export class ScopeResolver {
  visibleSymbols(
    fn: FunctionDefinition,
    statementId: StatementId
  ): SymbolInfo[] {
    const params = fn
      .listParameters()
      .map((p) => ({ kind: "param" as const, name: p.name }));

    const upstream = this.collectUpstreamStatements(fn, statementId);

    const produced: SymbolInfo[] = [];
    for (const s of upstream) {
      if (s.type === "variable") {
        for (const d of s.declarations)
          produced.push({ kind: "variable", name: d.name, producedBy: s.id });
      } else if (s.type === "logic") {
        for (const a of s.assignments)
          produced.push({ kind: "variable", name: a.output, producedBy: s.id });
      }
    }

    // Dedupe by name (domain validator should forbid duplicates; this is defensive)
    const map = new Map<string, SymbolInfo>();
    for (const sym of [...params, ...produced]) map.set(sym.name, sym);

    return [...map.values()];
  }

  private collectUpstreamStatements(
    fn: FunctionDefinition,
    statementId: StatementId
  ): Statement[] {
    const edges = fn.listEdges();
    const reverse = new Map<string, StatementId[]>();

    for (const e of edges) {
      reverse.set(e.to, [...(reverse.get(e.to) ?? []), e.from]);
    }

    const visited = new Set<StatementId>();
    const stack = [...(reverse.get(statementId) ?? [])];

    while (stack.length) {
      const cur = stack.pop()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      const more = reverse.get(cur) ?? [];
      for (const m of more) stack.push(m);
    }

    return [...visited]
      .map((id) => fn.getStatement(id))
      .filter((s): s is Statement => Boolean(s));
  }
}
