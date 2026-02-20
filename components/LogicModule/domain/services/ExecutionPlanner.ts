// domain/services/ExecutionPlanner.ts
import { StatementId } from "../model/ids";
import { ValidationError } from "../errors/DomainError";
import { Statement, StatementType } from "../model/Statement";
import { FunctionDefinition } from "../model/FunctionDefinition";

export class ExecutionPlanner {
  topoOrder(fn: FunctionDefinition): StatementId[] {
    const statements = fn.listStatements();
    const edges = fn.listEdges();

    const ids = new Set(statements.map((s) => s.id));

    const indeg = new Map<StatementId, number>();
    const out = new Map<StatementId, StatementId[]>();

    for (const id of ids) {
      indeg.set(id, 0);
      out.set(id, []);
    }

    for (const e of edges) {
      if (!ids.has(e.from) || !ids.has(e.to)) continue;
      indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
      out.get(e.from)!.push(e.to);
    }

    const queue: StatementId[] = [];
    for (const [id, d] of indeg.entries()) {
      if (d === 0) queue.push(id);
    }

    const result: StatementId[] = [];
    while (queue.length) {
      const cur = queue.shift()!;
      result.push(cur);
      for (const nxt of out.get(cur) ?? []) {
        indeg.set(nxt, (indeg.get(nxt) ?? 0) - 1);
        if (indeg.get(nxt) === 0) queue.push(nxt);
      }
    }

    if (result.length !== ids.size) {
      throw new ValidationError(
        "Flow graph has a cycle; execution order is not possible."
      );
    }

    return result;
  }
}
