// logic/LogicGraph.ts
import {
  LogicConnection,
  ConnectionId,
  NodeInstanceId,
  NodeTypeId,
  PortId,
} from "./types";
import { NodeInstance } from "./NodeInstance";
import { NodeDefinition } from "./NodeDefinition";
import { LogicDomainError } from "./LogicError";
import { NodeDefinitionRegistry } from "./NodeRegistry";

export interface LogicGraphProps {
  id: string;
  name: string;
}

export class LogicGraph {
  readonly id: string;
  name: string;

  private nodes: Map<NodeInstanceId, NodeInstance>;
  private connections: Map<ConnectionId, LogicConnection>;
  private definitionRegistry: NodeDefinitionRegistry;

  constructor(props: LogicGraphProps, registry: NodeDefinitionRegistry) {
    this.id = props.id;
    this.name = props.name;
    this.nodes = new Map();
    this.connections = new Map();
    this.definitionRegistry = registry;
  }

  // ──────────────────────────
  // Node operations
  // ──────────────────────────

  addNode(node: NodeInstance) {
    if (this.nodes.has(node.id)) {
      throw new LogicDomainError(
        "NODE_ID_DUPLICATE",
        `Node with id ${node.id} already exists.`,
        { nodeId: node.id }
      );
    }

    const def = this.definitionRegistry.getDefinition(node.typeId);
    if (!def) {
      throw new LogicDomainError(
        "NODE_TYPE_UNKNOWN",
        `Unknown node type: ${node.typeId}`,
        { typeId: node.typeId }
      );
    }

    this.nodes.set(node.id, node);
  }

  removeNode(nodeId: NodeInstanceId) {
    if (!this.nodes.has(nodeId)) return;

    // Remove all connections touching this node
    for (const [id, conn] of [...this.connections.entries()]) {
      if (conn.fromNodeId === nodeId || conn.toNodeId === nodeId) {
        this.connections.delete(id);
      }
    }

    this.nodes.delete(nodeId);
  }

  getNode(nodeId: NodeInstanceId): NodeInstance | undefined {
    return this.nodes.get(nodeId);
  }

  listNodes(): NodeInstance[] {
    return [...this.nodes.values()];
  }

  // ──────────────────────────
  // Connection operations
  // ──────────────────────────

  addConnection(conn: LogicConnection) {
    if (this.connections.has(conn.id)) {
      throw new LogicDomainError(
        "CONNECTION_ID_DUPLICATE",
        `Connection ${conn.id} already exists.`,
        { connectionId: conn.id }
      );
    }

    const fromNode = this.nodes.get(conn.fromNodeId);
    const toNode = this.nodes.get(conn.toNodeId);
    if (!fromNode || !toNode) {
      throw new LogicDomainError(
        "CONNECTION_NODE_NOT_FOUND",
        `Connection references unknown node(s).`,
        { connection: conn }
      );
    }

    const fromDef = this.definitionRegistry.getDefinition(fromNode.typeId);
    const toDef = this.definitionRegistry.getDefinition(toNode.typeId);
    if (!fromDef || !toDef) {
      throw new LogicDomainError(
        "CONNECTION_NODE_TYPE_UNKNOWN",
        `One or both node types are unknown for connection.`,
        { connection: conn }
      );
    }

    const fromPort = fromDef.getPort(conn.fromPortId);
    const toPort = toDef.getPort(conn.toPortId);

    if (!fromPort || !toPort) {
      throw new LogicDomainError(
        "CONNECTION_PORT_NOT_FOUND",
        `One or both ports not found for connection.`,
        { connection: conn }
      );
    }

    // Basic invariant: control→control, data→data
    if (fromPort.channel !== toPort.channel) {
      throw new LogicDomainError(
        "CONNECTION_CHANNEL_MISMATCH",
        `Cannot connect ${fromPort.channel} to ${toPort.channel}.`,
        { fromPort, toPort }
      );
    }

    // If data ports: basic type compatibility check
    if (fromPort.channel === "data") {
      const a = fromPort.valueType ?? "any";
      const b = toPort.valueType ?? "any";
      if (a !== "any" && b !== "any" && a !== b) {
        // we could allow some promotions later
        throw new LogicDomainError(
          "CONNECTION_TYPE_MISMATCH",
          `Cannot connect ${a} to ${b}.`,
          { fromPort, toPort }
        );
      }
    }

    // Later: we can check for multiple inputs, cycles, etc.
    this.connections.set(conn.id, conn);
  }

  removeConnection(connectionId: ConnectionId) {
    this.connections.delete(connectionId);
  }

  listConnections(): LogicConnection[] {
    return [...this.connections.values()];
  }
}
