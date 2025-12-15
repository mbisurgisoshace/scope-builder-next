// logic/NodeInstance.ts
import { NodeInstanceId, NodeTypeId } from "./types";
import { NodeDefinition } from "./NodeDefinition";

export interface NodeInstanceProps {
  id: NodeInstanceId;
  typeId: NodeTypeId;
  config?: Record<string, any>;
  // optional: link back to UI shape
  shapeId?: string; // InfiniteCanvas shape id
}

/**
 * A concrete node placed in a graph.
 * Knows its typeId, config values, and optional shape mapping.
 *
 * It does NOT know the actual NodeDefinition – the graph or a registry does.
 */
export class NodeInstance {
  id: NodeInstanceId;
  typeId: NodeTypeId;
  config: Record<string, any>;
  shapeId?: string;

  constructor(props: NodeInstanceProps) {
    this.id = props.id;
    this.typeId = props.typeId;
    this.config = { ...(props.config ?? {}) };
    this.shapeId = props.shapeId;
  }

  updateConfig(patch: Partial<Record<string, any>>) {
    this.config = {
      ...this.config,
      ...patch,
    };
  }
}
