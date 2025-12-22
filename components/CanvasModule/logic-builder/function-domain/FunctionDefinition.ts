// logic-builder/function-domain/FunctionDefinition.ts
import {
  ParamId,
  ReturnId,
  FunctionId,
  VariableId,
  FN_NODE_TYPES,
  FunctionValueType,
  FunctionDomainError,
} from "./types";
import { LogicGraph } from "../LogicGraph";
import { NodeInstance } from "../NodeInstance";
import { FunctionParam } from "./FunctionParam";
import { FunctionReturn } from "./FunctionReturn";
import { FunctionVariable } from "./FunctionVariable";
import { NodeDefinitionRegistry } from "../NodeRegistry";

export interface FunctionDefinitionProps {
  id: FunctionId;
  name: string;
  description?: string;
  params?: FunctionParam[];
  variables?: FunctionVariable[];
  returns?: FunctionReturn[];
}

/**
 * Aggregate Root:
 * - owns params / variables / returns
 * - owns a LogicGraph (nodes & connections) for the function body
 */
export class FunctionDefinition {
  readonly id: FunctionId;
  name: string;
  description?: string;

  readonly graph: LogicGraph;

  private params: FunctionParam[] = [];
  private variables: FunctionVariable[] = [];
  private returns: FunctionReturn[] = [];

  constructor(
    props: FunctionDefinitionProps,
    registry: NodeDefinitionRegistry
  ) {
    const name = props.name?.trim();
    if (!name) {
      throw new FunctionDomainError(
        "FUNCTION_NAME_REQUIRED",
        "Function name cannot be empty."
      );
    }

    this.id = props.id;
    this.name = name;
    this.description = props.description;

    // The function body graph is per-function.
    this.graph = new LogicGraph(
      { id: `graph:${props.id}`, name: `${name} graph` },
      registry
    );

    // hydrate
    if (props.params) this.params = [...props.params];
    if (props.variables) this.variables = [...props.variables];
    if (props.returns) this.returns = [...props.returns];

    this.ensureUniqueNames();
  }

  // ──────────────────────────
  // Read-only views
  // ──────────────────────────

  listParams(): FunctionParam[] {
    return [...this.params];
  }

  listVariables(): FunctionVariable[] {
    return [...this.variables];
  }

  listReturns(): FunctionReturn[] {
    return [...this.returns];
  }

  getParam(id: ParamId): FunctionParam | undefined {
    return this.params.find((p) => p.id === id);
  }

  getVariable(id: VariableId): FunctionVariable | undefined {
    return this.variables.find((v) => v.id === id);
  }

  getReturn(id: ReturnId): FunctionReturn | undefined {
    return this.returns.find((r) => r.id === id);
  }

  // ──────────────────────────
  // Function metadata
  // ──────────────────────────

  rename(newName: string) {
    const name = newName?.trim();
    if (!name) {
      throw new FunctionDomainError(
        "FUNCTION_NAME_REQUIRED",
        "Function name cannot be empty."
      );
    }
    this.name = name;
  }

  // ──────────────────────────
  // Params
  // ──────────────────────────

  addParam(p: FunctionParam) {
    this.params.push(p);
    this.ensureUniqueNames();
  }

  removeParam(paramId: ParamId) {
    const idx = this.params.findIndex((p) => p.id === paramId);
    if (idx === -1) return;
    this.params.splice(idx, 1);
    // Later: also remove any ParamNodes referencing this param id
    // (we’ll implement that in the service in Phase 2/3)
  }

  renameParam(paramId: ParamId, newName: string) {
    const p = this.getParam(paramId);
    if (!p) return;
    p.rename(newName);
    this.ensureUniqueNames();
  }

  setParamType(paramId: ParamId, type: FunctionValueType) {
    const p = this.getParam(paramId);
    if (!p) return;
    p.setType(type);
  }

  // ──────────────────────────
  // Variables
  // ──────────────────────────

  addVariable(v: FunctionVariable) {
    this.variables.push(v);
    this.ensureUniqueNames();
  }

  removeVariable(variableId: VariableId) {
    const idx = this.variables.findIndex((v) => v.id === variableId);
    if (idx === -1) return;
    this.variables.splice(idx, 1);
    // Later: also remove Var/Assign nodes referencing it
  }

  renameVariable(variableId: VariableId, newName: string) {
    const v = this.getVariable(variableId);
    if (!v) return;
    v.rename(newName);
    this.ensureUniqueNames();
  }

  setVariableType(variableId: VariableId, type: FunctionValueType) {
    const v = this.getVariable(variableId);
    if (!v) return;
    v.setType(type);
  }

  // ──────────────────────────
  // Returns
  // ──────────────────────────

  addReturn(r: FunctionReturn) {
    this.returns.push(r);
    this.ensureUniqueNames();
  }

  removeReturn(returnId: ReturnId) {
    const idx = this.returns.findIndex((r) => r.id === returnId);
    if (idx === -1) return;
    this.returns.splice(idx, 1);
  }

  renameReturn(returnId: ReturnId, newName: string) {
    const r = this.getReturn(returnId);
    if (!r) return;
    r.rename(newName);
    this.ensureUniqueNames();
  }

  setReturnType(returnId: ReturnId, type: FunctionValueType) {
    const r = this.getReturn(returnId);
    if (!r) return;
    r.setType(type);
  }

  // ──────────────────────────
  // Invariants
  // ──────────────────────────

  /**
   * For a clean UX + easier codegen, enforce unique naming across:
   * - params
   * - variables
   * - returns
   *
   * If you want separate namespaces later, we can relax this.
   */
  private ensureUniqueNames() {
    const seen = new Set<string>();

    const take = (
      kind: "param" | "variable" | "return",
      name: string,
      id: string
    ) => {
      const key = name.trim();
      if (!key) return;
      const normalized = key.toLowerCase();
      if (seen.has(normalized)) {
        throw new FunctionDomainError(
          "NAME_DUPLICATE",
          `Name "${name}" is duplicated across function symbols.`,
          { kind, id, name }
        );
      }
      seen.add(normalized);
    };

    for (const p of this.params) take("param", p.name, p.id);
    for (const v of this.variables) take("variable", v.name, v.id);
    for (const r of this.returns) take("return", r.name, r.id);
  }

  // ──────────────────────────
  // Graph helpers (Phase 1A)
  // ──────────────────────────

  /**
   * Ensure a Param node exists for a given paramId.
   * NodeInstance.id is deterministic so we never duplicate.
   */
  ensureParamNode(paramId: ParamId): NodeInstance {
    const p = this.getParam(paramId);
    if (!p) {
      throw new FunctionDomainError(
        "PARAM_NOT_FOUND",
        `Param ${paramId} not found.`,
        { paramId }
      );
    }

    const nodeId = `param:${this.id}:${paramId}` as unknown as any; // if you later brand NodeInstanceId, adjust
    const existing = this.graph.getNode(nodeId);
    if (existing) return existing;

    const node = new NodeInstance({
      id: nodeId,
      typeId: FN_NODE_TYPES.PARAM as any,
      config: { paramId },
    });

    this.graph.addNode(node);
    return node;
  }

  ensureVariableNode(variableId: VariableId): NodeInstance {
    const v = this.getVariable(variableId);
    if (!v) {
      throw new FunctionDomainError(
        "VARIABLE_NOT_FOUND",
        `Variable ${variableId} not found.`,
        { variableId }
      );
    }

    const nodeId = `var:${this.id}:${variableId}` as unknown as any;
    const existing = this.graph.getNode(nodeId);
    if (existing) return existing;

    const node = new NodeInstance({
      id: nodeId,
      typeId: FN_NODE_TYPES.VAR as any,
      config: { variableId },
    });

    this.graph.addNode(node);
    return node;
  }

  ensureReturnNode(returnId: ReturnId): NodeInstance {
    const r = this.getReturn(returnId);
    if (!r) {
      throw new FunctionDomainError(
        "RETURN_NOT_FOUND",
        `Return ${returnId} not found.`,
        { returnId }
      );
    }

    const nodeId = `return:${this.id}:${returnId}` as unknown as any;
    const existing = this.graph.getNode(nodeId);
    if (existing) return existing;

    const node = new NodeInstance({
      id: nodeId,
      typeId: FN_NODE_TYPES.RETURN as any,
      config: { returnId },
    });

    this.graph.addNode(node);
    return node;
  }

  /**
   * For now, Add is "pure op", not tied to a param/var/return id.
   * So we accept a caller-supplied instance id (UI/Service can generate).
   */
  addAddNode(instanceId: string): NodeInstance {
    const existing = this.graph.getNode(instanceId as any);
    if (existing) return existing;

    const node = new NodeInstance({
      id: instanceId as any,
      typeId: FN_NODE_TYPES.ADD as any,
      config: {},
    });

    this.graph.addNode(node);
    return node;
  }
}
