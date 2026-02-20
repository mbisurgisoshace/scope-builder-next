// logic/LogicGraph.ts
import { NodeDefinitionRegistry } from "./NodeRegistry";
import { NodeInstance } from "./NodeInstance";
import { LogicConnection, ConnectionId, NodeInstanceId } from "./types";

export interface LogicGraphMeta {
  id: string;
  name: string;
}

export class LogicGraph {
  private nodes = new Map<NodeInstanceId, NodeInstance>();
  private connections = new Map<ConnectionId, LogicConnection>();

  constructor(
    public meta: LogicGraphMeta,
    private registry: NodeDefinitionRegistry
  ) {}

  // ──────────────────────────
  // Nodes
  // ──────────────────────────

  addNode(node: NodeInstance) {
    // Validate node type exists
    const def = this.registry.getDefinition(node.typeId);
    if (!def) {
      throw new Error(`Unknown node type: ${node.typeId}`);
    }
    this.nodes.set(node.id, node);
  }

  getNode(id: NodeInstanceId): NodeInstance | undefined {
    return this.nodes.get(id);
  }

  removeNode(id: NodeInstanceId) {
    this.nodes.delete(id);
    // remove connections involving this node
    for (const [cid, c] of this.connections) {
      if (c.fromNodeId === id || c.toNodeId === id) {
        this.connections.delete(cid);
      }
    }
  }

  listNodes(): NodeInstance[] {
    return Array.from(this.nodes.values());
  }

  // ──────────────────────────
  // Connections
  // ──────────────────────────

  addConnection(conn: LogicConnection) {
    // Validate both nodes exist
    const fromNode = this.nodes.get(conn.fromNodeId);
    const toNode = this.nodes.get(conn.toNodeId);
    if (!fromNode) throw new Error(`fromNode not found: ${conn.fromNodeId}`);
    if (!toNode) throw new Error(`toNode not found: ${conn.toNodeId}`);

    // Validate ports exist on definitions
    const fromDef = this.registry.getDefinition(fromNode.typeId);
    const toDef = this.registry.getDefinition(toNode.typeId);
    if (!fromDef) throw new Error(`Unknown node type: ${fromNode.typeId}`);
    if (!toDef) throw new Error(`Unknown node type: ${toNode.typeId}`);

    const fromPort = fromDef.ports.find((p) => p.id === conn.fromPortId);
    const toPort = toDef.ports.find((p) => p.id === conn.toPortId);
    if (!fromPort) throw new Error(`Unknown fromPort: ${conn.fromPortId}`);
    if (!toPort) throw new Error(`Unknown toPort: ${conn.toPortId}`);

    this.connections.set(conn.id, conn);
  }

  removeConnection(id: ConnectionId) {
    this.connections.delete(id);
  }

  listConnections(): LogicConnection[] {
    return Array.from(this.connections.values());
  }

  // ──────────────────────────
  // Debug / Inspect
  // ──────────────────────────

  toJSON() {
    return {
      meta: this.meta,
      nodes: this.listNodes().map((n) => n.toJSON()),
      connections: this.listConnections().map((c) => ({ ...c })),
    };
  }

  toDebugString() {
    const j = this.toJSON();
    const lines: string[] = [];

    lines.push(`Graph: ${j.meta.name} (${j.meta.id})`);
    lines.push(`Nodes: ${j.nodes.length}`);
    for (const n of j.nodes) {
      lines.push(`  - ${n.id}  type=${n.typeId}  shape=${n.shapeId ?? "∅"}`);
    }

    lines.push(`Connections: ${j.connections.length}`);
    for (const c of j.connections) {
      lines.push(
        `  - ${c.id}: ${c.fromNodeId}.${c.fromPortId} -> ${c.toNodeId}.${c.toPortId}`
      );
    }

    return lines.join("\n");
  }
}
