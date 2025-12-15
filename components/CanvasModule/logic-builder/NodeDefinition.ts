// logic/NodeDefinition.ts
import {
  NodeTypeId,
  LogicPortDefinition,
  LogicPortChannel,
  LogicPortKind,
} from "./types";

export interface NodeBehavior {
  // High-level flags we can use in UI or execution engine:
  eventDriven?: boolean; // Node-RED / event style
  typedDataFlow?: boolean; // stricter type checking
  sequentialFlow?: boolean; // classic flowchart style
  allowsChildren?: boolean; // e.g. "body" / nested blocks
  // later: asyncExecution, sideEffects, etc.
}

export interface NodeDefinitionProps {
  label: string;
  icon?: string; // name or path used by UI
  category?: string; // e.g. "Control", "Data", "UI", etc.
  typeId: NodeTypeId;
  description?: string;
  behavior?: NodeBehavior;
  ports: LogicPortDefinition[];
  // UI hints (optional)
  // default config for new instances
  defaultConfig?: Record<string, any>;
}

/**
 * Immutable-ish definition of a node type.
 * You usually configure these once in a registry.
 */
export class NodeDefinition {
  readonly typeId: NodeTypeId;
  readonly label: string;
  readonly description?: string;
  readonly ports: LogicPortDefinition[];
  readonly behavior: NodeBehavior;
  readonly category?: string;
  readonly icon?: string;
  readonly defaultConfig: Record<string, any>;

  constructor(props: NodeDefinitionProps) {
    this.typeId = props.typeId;
    this.label = props.label;
    this.description = props.description;
    this.ports = [...props.ports];
    this.behavior = props.behavior ?? {};
    this.category = props.category;
    this.icon = props.icon;
    this.defaultConfig = props.defaultConfig ?? {};

    // later we can validate ports here (unique ids, etc.)
  }

  getPort(portId: string): LogicPortDefinition | undefined {
    return this.ports.find((p) => p.id === portId);
  }

  /**
   * Convenience: returns all control-flow output ports
   * (for rendering flowchart / node-red style)
   */
  getControlOutputs() {
    return this.ports.filter(
      (p) => p.channel === "control" && p.kind !== "input"
    );
  }

  getControlInputs() {
    return this.ports.filter(
      (p) => p.channel === "control" && p.kind === "input"
    );
  }

  getDataInputs() {
    return this.ports.filter((p) => p.channel === "data" && p.kind === "input");
  }

  getDataOutputs() {
    return this.ports.filter((p) => p.channel === "data" && p.kind !== "input");
  }
}
