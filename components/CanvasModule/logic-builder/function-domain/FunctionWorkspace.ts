// logic-builder/function-domain/FunctionWorkspace.ts
import { FunctionDefinition } from "./FunctionDefinition";
import { FunctionDomainError, FunctionId } from "./types";

/**
 * Workspace aggregate for multiple functions.
 * UI-agnostic, persists in memory for now.
 */
export interface FunctionWorkspaceProps {
  id: string;
  name: string;
  functions?: FunctionDefinition[];
}

export class FunctionWorkspace {
  readonly id: string;
  name: string;

  private functions: Map<FunctionId, FunctionDefinition>;

  constructor(props: FunctionWorkspaceProps) {
    const name = props.name?.trim();
    if (!name) {
      throw new FunctionDomainError(
        "WORKSPACE_NAME_REQUIRED",
        "Workspace name cannot be empty."
      );
    }

    this.id = props.id;
    this.name = name;

    this.functions = new Map();
    for (const fn of props.functions ?? []) {
      this.addFunction(fn);
    }
  }

  rename(newName: string) {
    const name = newName?.trim();
    if (!name) {
      throw new FunctionDomainError(
        "WORKSPACE_NAME_REQUIRED",
        "Workspace name cannot be empty."
      );
    }
    this.name = name;
  }

  addFunction(fn: FunctionDefinition) {
    if (this.functions.has(fn.id)) {
      throw new FunctionDomainError(
        "FUNCTION_ID_DUPLICATE",
        `Function with id ${fn.id} already exists in workspace.`,
        { functionId: fn.id }
      );
    }
    this.functions.set(fn.id, fn);
  }

  removeFunction(functionId: FunctionId) {
    this.functions.delete(functionId);
  }

  getFunction(functionId: FunctionId): FunctionDefinition | undefined {
    return this.functions.get(functionId);
  }

  listFunctions(): FunctionDefinition[] {
    return [...this.functions.values()];
  }
}
