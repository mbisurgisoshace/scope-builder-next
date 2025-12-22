// logic/NodeRegistry.ts
import { NodeTypeId } from "./types";
import { NodeDefinition } from "./NodeDefinition";

export interface NodeDefinitionRegistry {
  register(def: NodeDefinition): void;
  getDefinition(typeId: NodeTypeId): NodeDefinition | undefined;
  listDefinitions(): NodeDefinition[];
}

/**
 * Simple in-memory implementation of the registry.
 * You can later replace this with a more dynamic system if you want.
 */
export class InMemoryNodeDefinitionRegistry implements NodeDefinitionRegistry {
  private defs: Map<NodeTypeId, NodeDefinition>;

  constructor() {
    this.defs = new Map();
  }

  register(def: NodeDefinition) {
    if (this.defs.has(def.typeId)) {
      throw new Error(
        `NodeDefinition with typeId "${def.typeId}" is already registered.`
      );
    }
    this.defs.set(def.typeId, def);
  }

  getDefinition(typeId: NodeTypeId): NodeDefinition | undefined {
    return this.defs.get(typeId);
  }

  listDefinitions(): NodeDefinition[] {
    return [...this.defs.values()];
  }
}
