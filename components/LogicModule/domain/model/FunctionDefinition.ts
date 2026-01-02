// domain/model/FunctionDefinition.ts
import { FlowEdge } from "./FlowEdge";
import { Statement } from "./Statement";
import { InvariantError } from "../errors/DomainError";
import { FunctionId, StatementId, EdgeId, asEdgeId } from "./ids";

export interface FunctionParameter {
  name: string;
  // type?: string; // later if you want
}

export class FunctionDefinition {
  public readonly id: FunctionId;

  private name: string;
  private parameters: FunctionParameter[];

  private statements: Map<StatementId, Statement>;
  private edges: Map<EdgeId, FlowEdge>;

  constructor(args: {
    id: FunctionId;
    name: string;
    parameters?: FunctionParameter[];
    statements?: Statement[];
    edges?: FlowEdge[];
  }) {
    this.id = args.id;
    this.name = args.name;
    this.parameters = args.parameters ?? [];
    this.statements = new Map((args.statements ?? []).map((s) => [s.id, s]));
    this.edges = new Map((args.edges ?? []).map((e) => [e.id, e]));
  }

  // --- getters ---
  getName(): string {
    return this.name;
  }

  listParameters(): FunctionParameter[] {
    return [...this.parameters];
  }

  listStatements(): Statement[] {
    return [...this.statements.values()];
  }

  getStatement(id: StatementId): Statement | undefined {
    return this.statements.get(id);
  }

  listEdges(): FlowEdge[] {
    return [...this.edges.values()];
  }

  // --- mutations with invariants ---
  rename(name: string) {
    if (!name.trim())
      throw new InvariantError("Function name cannot be empty.");
    this.name = name.trim();
  }

  addParameter(param: FunctionParameter) {
    if (!param.name.trim())
      throw new InvariantError("Parameter name cannot be empty.");
    const exists = this.parameters.some((p) => p.name === param.name);
    if (exists)
      throw new InvariantError(`Parameter "${param.name}" already exists.`);
    this.parameters = [...this.parameters, { name: param.name.trim() }];
  }

  removeParameter(name: string) {
    this.parameters = this.parameters.filter((p) => p.name !== name);
  }

  addStatement(stmt: Statement) {
    if (this.statements.has(stmt.id))
      throw new InvariantError("StatementId already exists.");

    // Optional invariant: only one ReturnStatement
    if (stmt.type === "return") {
      const hasReturn = this.listStatements().some((s) => s.type === "return");
      if (hasReturn)
        throw new InvariantError("Only one ReturnStatement is allowed (v1).");
    }

    this.statements.set(stmt.id, stmt);
  }

  removeStatement(id: StatementId) {
    this.statements.delete(id);
    // Remove any edges connected to this statement
    for (const [edgeId, e] of this.edges.entries()) {
      if (e.from === id || e.to === id) this.edges.delete(edgeId);
    }
  }

  connectFlow(from: StatementId, to: StatementId, edgeId?: EdgeId) {
    if (!this.statements.has(from))
      throw new InvariantError("Flow edge 'from' statement does not exist.");
    if (!this.statements.has(to))
      throw new InvariantError("Flow edge 'to' statement does not exist.");
    if (from === to)
      throw new InvariantError("Cannot connect a statement to itself.");

    // Disallow duplicates
    const dup = this.listEdges().some((e) => e.from === from && e.to === to);
    if (dup) throw new InvariantError("Duplicate flow edge.");

    const id = edgeId ?? asEdgeId(`edge_${cryptoLikeId()}`);
    this.edges.set(id, { id, from, to });
    return id;
  }

  disconnectFlow(edgeId: EdgeId) {
    this.edges.delete(edgeId);
  }
}

// Tiny id helper (domain-safe). Replace with your own id generator later.
function cryptoLikeId(): string {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}
