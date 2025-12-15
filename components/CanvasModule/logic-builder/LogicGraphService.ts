// logic/LogicGraphService.ts
import { LogicGraph } from "./LogicGraph";
import { NodeInstance } from "./NodeInstance";
import {
  LogicConnection,
  NodeInstanceId,
  NodeTypeId,
  ConnectionId,
  PortId,
} from "./types";

export interface EnsureNodeOptions {
  id: NodeInstanceId;
  typeId: NodeTypeId;
  /** Initial config for this node (if new) or patch (if exists). */
  config?: Record<string, any>;
  /** Optional link to a canvas shape id. */
  shapeId?: string;
}

export interface ConnectPortsOptions {
  fromNodeId: NodeInstanceId;
  fromPortId: PortId;
  toNodeId: NodeInstanceId;
  toPortId: PortId;
}

export class LogicGraphService {
  constructor(
    private graph: LogicGraph,
    private generateId: () => string = () => crypto.randomUUID()
  ) {}

  // ──────────────────────────
  // Nodes
  // ──────────────────────────

  /**
   * Ensure there is a node with the given id & type.
   * - If it exists, we can optionally patch its config and shapeId.
   * - If it doesn't, we create it with the provided config and shapeId.
   */
  ensureNode(opts: EnsureNodeOptions): NodeInstance {
    const existing = this.graph.getNode(opts.id);

    if (existing) {
      // Optional: if you want, patch config & shapeId when node already exists
      if (opts.config && Object.keys(opts.config).length > 0) {
        existing.updateConfig(opts.config);
      }
      if (opts.shapeId && existing.shapeId !== opts.shapeId) {
        existing.shapeId = opts.shapeId;
      }
      return existing;
    }

    const node = new NodeInstance({
      id: opts.id,
      typeId: opts.typeId,
      config: opts.config ?? {},
      shapeId: opts.shapeId,
    });

    this.graph.addNode(node);
    return node;
  }

  getNode(nodeId: NodeInstanceId): NodeInstance | undefined {
    return this.graph.getNode(nodeId);
  }

  removeNode(nodeId: NodeInstanceId): void {
    this.graph.removeNode(nodeId);
  }

  listNodes(): NodeInstance[] {
    return this.graph.listNodes();
  }

  // ──────────────────────────
  // Connections
  // ──────────────────────────

  connectPorts(opts: ConnectPortsOptions): LogicConnection {
    const id = this.generateId() as ConnectionId;

    const conn: LogicConnection = {
      id,
      fromNodeId: opts.fromNodeId,
      fromPortId: opts.fromPortId,
      toNodeId: opts.toNodeId,
      toPortId: opts.toPortId,
    };

    // uses your real domain method
    this.graph.addConnection(conn);

    return conn;
  }

  removeConnection(connectionId: ConnectionId): void {
    this.graph.removeConnection(connectionId);
  }

  listConnections(): LogicConnection[] {
    return this.graph.listConnections();
  }
}
