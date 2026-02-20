// logic/NodeLibrary.ts
import {
  InMemoryNodeDefinitionRegistry,
  NodeDefinitionRegistry,
} from "./NodeRegistry";
import { NodeDefinition } from "./NodeDefinition";

function registerOnce(registry: NodeDefinitionRegistry, def: NodeDefinition) {
  if (registry.getDefinition(def.typeId)) return;
  // InMemoryNodeDefinitionRegistry has register(), interface does not
  (registry as any).register(def);
}

/**
 * Creates the default node registry with all built-in node types.
 * This is PURE domain config – no React, no canvas knowledge.
 */
export function createDefaultNodeRegistry(): NodeDefinitionRegistry {
  const registry = new InMemoryNodeDefinitionRegistry();

  // ─────────────────────────────────────────────
  // IF NODE
  // ─────────────────────────────────────────────
  registerOnce(
    registry,
    new NodeDefinition({
      typeId: "if",
      label: "If",
      ports: [
        {
          id: "condition",
          name: "condition",
          kind: "input",
          channel: "data",
          valueType: "boolean",
        },
        {
          id: "true",
          name: "true",
          kind: "output",
          channel: "control",
        },
        {
          id: "false",
          name: "false",
          kind: "output",
          channel: "control",
        },
      ],
    })
  );

  // ─────────────────────────────────────────────
  // FUNCTION PARAMETER
  // ─────────────────────────────────────────────
  registerOnce(
    registry,
    new NodeDefinition({
      typeId: "fn/param",
      label: "Parameter",
      ports: [
        {
          id: "value",
          name: "value",
          kind: "output",
          channel: "data",
          valueType: "number", // can be generic later
        },
      ],
    })
  );

  // ─────────────────────────────────────────────
  // VARIABLE DECLARATION
  // ─────────────────────────────────────────────
  registerOnce(
    registry,
    new NodeDefinition({
      typeId: "fn/var",
      label: "Variable",
      ports: [
        {
          id: "in",
          name: "set",
          kind: "input",
          channel: "data",
        },
        {
          id: "out",
          name: "get",
          kind: "output",
          channel: "data",
        },
      ],
    })
  );

  // ─────────────────────────────────────────────
  // ADD (a + b)
  // ─────────────────────────────────────────────
  registerOnce(
    registry,
    new NodeDefinition({
      typeId: "fn/add",
      label: "Add",
      ports: [
        {
          id: "a",
          name: "a",
          kind: "input",
          channel: "data",
          valueType: "number",
        },
        {
          id: "b",
          name: "b",
          kind: "input",
          channel: "data",
          valueType: "number",
        },
        {
          id: "result",
          name: "result",
          kind: "output",
          channel: "data",
          valueType: "number",
        },
      ],
    })
  );

  // ─────────────────────────────────────────────
  // RETURN
  // ─────────────────────────────────────────────
  registerOnce(
    registry,
    new NodeDefinition({
      typeId: "fn/return",
      label: "Return",
      ports: [
        {
          id: "value",
          name: "value",
          kind: "input",
          channel: "data",
        },
      ],
    })
  );

  return registry;
}
