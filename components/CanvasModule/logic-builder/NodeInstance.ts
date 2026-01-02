// logic/NodeInstance.ts
import { NodeInstanceId, NodeTypeId } from "./types";

export interface NodeInstanceInit {
  id: NodeInstanceId;
  typeId: NodeTypeId;
  config?: Record<string, any>;
  shapeId?: string;
}

export class NodeInstance {
  id: NodeInstanceId;
  typeId: NodeTypeId;
  config: Record<string, any>;
  shapeId?: string;

  constructor(init: NodeInstanceInit) {
    this.id = init.id;
    this.typeId = init.typeId;
    this.config = init.config ?? {};
    this.shapeId = init.shapeId;
  }

  updateConfig(patch: Record<string, any>) {
    this.config = { ...this.config, ...patch };
  }

  toJSON() {
    return {
      id: this.id,
      typeId: this.typeId,
      shapeId: this.shapeId ?? null,
      config: this.config ?? {},
    };
  }
}
