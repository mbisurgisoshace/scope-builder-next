// logic-builder/function-domain/FunctionService.ts
import {
  ParamId,
  ReturnId,
  FunctionId,
  VariableId,
  FunctionValueType,
  FunctionDomainError,
} from "./types";
import { FunctionParam } from "./FunctionParam";
import { FunctionReturn } from "./FunctionReturn";
import { FunctionVariable } from "./FunctionVariable";
import { NodeDefinitionRegistry } from "../NodeRegistry";
import { LogicGraphService } from "../LogicGraphService";
import { FunctionDefinition } from "./FunctionDefinition";

export interface CreateFunctionOptions {
  id?: FunctionId;
  name: string;
  description?: string;
}

export interface CreateParamOptions {
  id?: ParamId;
  name: string;
  type?: FunctionValueType;
  description?: string;
}

export interface CreateVariableOptions {
  id?: VariableId;
  name: string;
  type?: FunctionValueType;
  description?: string;
}

export interface CreateReturnOptions {
  id?: ReturnId;
  name: string;
  type?: FunctionValueType;
  description?: string;
}

/**
 * Orchestrates the Function aggregate + its internal graph service.
 * Still UI-agnostic.
 */
export class FunctionService {
  private fn: FunctionDefinition;
  private graphService: LogicGraphService;
  private generateId: () => string;

  constructor(
    fn: FunctionDefinition,
    generateId: () => string = () => crypto.randomUUID()
  ) {
    this.fn = fn;
    this.graphService = new LogicGraphService(fn.graph, generateId);
    this.generateId = generateId;
  }

  static createNew(
    opts: CreateFunctionOptions,
    registry: NodeDefinitionRegistry,
    generateId: () => string = () => crypto.randomUUID()
  ): { fn: FunctionDefinition; service: FunctionService } {
    const id = opts.id ?? generateId();

    const fn = new FunctionDefinition(
      { id, name: opts.name, description: opts.description },
      registry
    );

    return { fn, service: new FunctionService(fn, generateId) };
  }

  getFunction(): FunctionDefinition {
    return this.fn;
  }

  // ──────────────────────────
  // Params
  // ──────────────────────────

  createParam(opts: CreateParamOptions): FunctionParam {
    const id = opts.id ?? this.generateId();
    const p = new FunctionParam({
      id,
      name: opts.name,
      type: opts.type ?? "any",
      description: opts.description,
    });
    this.fn.addParam(p);
    return p;
  }

  renameParam(paramId: ParamId, newName: string) {
    this.fn.renameParam(paramId, newName);
  }

  deleteParam(paramId: ParamId) {
    this.fn.removeParam(paramId);
  }

  // ──────────────────────────
  // Variables
  // ──────────────────────────

  createVariable(opts: CreateVariableOptions): FunctionVariable {
    const id = opts.id ?? this.generateId();
    const v = new FunctionVariable({
      id,
      name: opts.name,
      type: opts.type ?? "any",
      description: opts.description,
    });
    this.fn.addVariable(v);
    return v;
  }

  renameVariable(variableId: VariableId, newName: string) {
    this.fn.renameVariable(variableId, newName);
  }

  deleteVariable(variableId: VariableId) {
    this.fn.removeVariable(variableId);
  }

  // ──────────────────────────
  // Returns
  // ──────────────────────────

  createReturn(opts: CreateReturnOptions): FunctionReturn {
    const id = opts.id ?? this.generateId();
    const r = new FunctionReturn({
      id,
      name: opts.name,
      type: opts.type ?? "any",
      description: opts.description,
    });
    this.fn.addReturn(r);
    return r;
  }

  renameReturn(returnId: ReturnId, newName: string) {
    this.fn.renameReturn(returnId, newName);
  }

  deleteReturn(returnId: ReturnId) {
    this.fn.removeReturn(returnId);
  }

  // ──────────────────────────
  // Graph access (Phase 2+)
  // ──────────────────────────

  /**
   * We expose the graph service for later phases.
   * In Phase 1 it’s okay if UI never touches it yet.
   */
  getGraphService(): LogicGraphService {
    return this.graphService;
  }
}
