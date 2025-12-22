// logic-builder/function-domain/FunctionWorkspaceService.ts
import { FunctionService } from "./FunctionService";
import { FunctionWorkspace } from "./FunctionWorkspace";
import { NodeDefinitionRegistry } from "../NodeRegistry";
import { FunctionDefinition } from "./FunctionDefinition";
import { FunctionDomainError, FunctionId } from "./types";

export interface CreateWorkspaceOptions {
  id?: string;
  name: string;
}

export interface CreateFunctionInWorkspaceOptions {
  id?: FunctionId;
  name: string;
  description?: string;
}

export class FunctionWorkspaceService {
  private workspace: FunctionWorkspace;
  private registry: NodeDefinitionRegistry;
  private generateId: () => string;

  constructor(
    workspace: FunctionWorkspace,
    registry: NodeDefinitionRegistry,
    generateId: () => string = () => crypto.randomUUID()
  ) {
    this.workspace = workspace;
    this.registry = registry;
    this.generateId = generateId;
  }

  static createNew(
    opts: CreateWorkspaceOptions,
    registry: NodeDefinitionRegistry,
    generateId: () => string = () => crypto.randomUUID()
  ): { workspace: FunctionWorkspace; service: FunctionWorkspaceService } {
    const id = opts.id ?? generateId();
    const ws = new FunctionWorkspace({ id, name: opts.name, functions: [] });
    return {
      workspace: ws,
      service: new FunctionWorkspaceService(ws, registry, generateId),
    };
  }

  getWorkspace(): FunctionWorkspace {
    return this.workspace;
  }

  listFunctions(): FunctionDefinition[] {
    return this.workspace.listFunctions();
  }

  getFunction(functionId: FunctionId): FunctionDefinition | undefined {
    return this.workspace.getFunction(functionId);
  }

  deleteFunction(functionId: FunctionId): void {
    this.workspace.removeFunction(functionId);
  }

  /**
   * Creates a new FunctionDefinition (+ FunctionService) and stores it in the workspace.
   */
  createFunction(opts: CreateFunctionInWorkspaceOptions): {
    fn: FunctionDefinition;
    service: FunctionService;
  } {
    const { fn, service } = FunctionService.createNew(
      {
        id: opts.id ?? this.generateId(),
        name: opts.name,
        description: opts.description,
      },
      this.registry,
      this.generateId
    );

    // Optional extra invariant at workspace-level:
    // function name uniqueness across workspace (nice UX).
    // If you don't want this, remove it.
    const normalized = fn.name.trim().toLowerCase();
    for (const existing of this.workspace.listFunctions()) {
      if (existing.name.trim().toLowerCase() === normalized) {
        throw new FunctionDomainError(
          "FUNCTION_NAME_DUPLICATE",
          `Function name "${fn.name}" already exists in workspace.`,
          { name: fn.name }
        );
      }
    }

    this.workspace.addFunction(fn);
    return { fn, service };
  }
}
