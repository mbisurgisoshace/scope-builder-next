// logic/NodeLibrary.ts
import { NodeDefinition } from "./NodeDefinition";
import { InMemoryNodeDefinitionRegistry } from "./NodeRegistry";
import { LogicPortDefinition } from "./types";

function port(
  id: string,
  name: string,
  kind: "input" | "output" | "branch" | "body",
  channel: "control" | "data",
  valueType?: "any" | "string" | "number" | "boolean" | "object" | "array"
): LogicPortDefinition {
  return { id, name, kind, channel, valueType };
}

/**
 * Build the default node library (start, assign, if, log, return…)
 */
export function createDefaultNodeRegistry() {
  const registry = new InMemoryNodeDefinitionRegistry();

  // ─────────────────────────────
  // 1) Start
  // ─────────────────────────────
  registry.register(
    new NodeDefinition({
      typeId: "start",
      label: "Start",
      description: "Entry point: emits a control signal once.",
      category: "Control",
      icon: "start",
      behavior: {
        sequentialFlow: true,
        eventDriven: false,
        allowsChildren: false,
        typedDataFlow: false,
      },
      ports: [
        // no inputs, only one control output
        port("out", "out", "output", "control"),
      ],
    })
  );

  // ─────────────────────────────
  // 2) Assign
  // ─────────────────────────────
  registry.register(
    new NodeDefinition({
      typeId: "assign",
      label: "Assign",
      description:
        "Assigns an expression/value to a variable in the execution context.",
      category: "Variables",
      icon: "assign",
      behavior: {
        sequentialFlow: true,
        typedDataFlow: true,
        allowsChildren: false,
      },
      // Config: variableName is stored in node.config.variableName
      defaultConfig: {
        variableName: "myVar",
      },
      ports: [
        // control flow in and out
        port("in", "in", "input", "control"),
        port("out", "out", "output", "control"),

        // data: value in, result out
        port("value", "value", "input", "data", "any"),
        port("result", "result", "output", "data", "any"),
      ],
    })
  );

  // ─────────────────────────────
  // 3) If
  // ─────────────────────────────
  registry.register(
    new NodeDefinition({
      typeId: "if",
      label: "If",
      description: "Conditional branch on a boolean expression.",
      category: "Control",
      icon: "if",
      behavior: {
        sequentialFlow: true,
        typedDataFlow: true,
        allowsChildren: false,
      },
      ports: [
        // control input
        port("in", "in", "input", "control"),

        // control branches
        port("true", "true", "branch", "control"),
        port("false", "false", "branch", "control"),

        // condition value
        port("condition", "condition", "input", "data", "boolean"),
      ],
    })
  );

  // ─────────────────────────────
  // 4) Log
  // ─────────────────────────────
  registry.register(
    new NodeDefinition({
      typeId: "log",
      label: "Log",
      description: "Logs a value (to console, UI or external logger).",
      category: "Side effects",
      icon: "log",
      behavior: {
        sequentialFlow: true,
        typedDataFlow: true,
      },
      ports: [
        port("in", "in", "input", "control"),
        port("out", "out", "output", "control"),

        port("value", "value", "input", "data", "any"),
      ],
    })
  );

  // ─────────────────────────────
  // 5) Return
  // ─────────────────────────────
  registry.register(
    new NodeDefinition({
      typeId: "return",
      label: "Return",
      description: "Ends the flow and returns a value from this graph.",
      category: "Control",
      icon: "return",
      behavior: {
        sequentialFlow: true,
        typedDataFlow: true,
      },
      ports: [
        port("in", "in", "input", "control"),
        port("value", "value", "input", "data", "any"),
      ],
    })
  );

  return registry;
}
