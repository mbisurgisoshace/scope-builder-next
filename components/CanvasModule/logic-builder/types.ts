// logic/types.ts

// What kind of port is this?
export type LogicPortKind = "input" | "output" | "branch" | "body";

// Is this port for control flow or data flow?
export type LogicPortChannel = "control" | "data" | "flow";

// Simple value types for data ports (can extend later)
export type LogicValueType =
  | "any"
  | "flow"
  | "json"
  | "array"
  | "string"
  | "number"
  | "object"
  | "boolean";

// Unique ID types for clarity
export type PortId = string;
export type NodeTypeId = string; // e.g. "if", "assign", "loop"
export type ConnectionId = string;
export type NodeInstanceId = string;

export type LogicPortSide = "top" | "right" | "bottom" | "left";

// A single port on a node definition
export interface LogicPortDefinition {
  id: PortId;
  name: string; // e.g. "in", "out", "true", "false", "body"
  kind: LogicPortKind; // input/output/branch/body
  channel: LogicPortChannel; // control vs data
  valueType?: LogicValueType; // only for data ports
  // later: cardinality, optional, etc.
  side?: LogicPortSide; // default = right
  order?: number;
}

// Runtime instance of a connection between two ports
export interface LogicConnection {
  id: ConnectionId;
  toPortId: PortId;
  fromPortId: PortId;
  toNodeId: NodeInstanceId;
  fromNodeId: NodeInstanceId;
}
