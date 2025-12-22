// logic-builder/function-domain/registerFunctionNodes.ts
import { FN_NODE_TYPES } from "./types";
import { NodeDefinition } from "../NodeDefinition";
import { NodeDefinitionRegistry } from "../NodeRegistry";

export function registerFunctionNodes(registry: NodeDefinitionRegistry) {
  // Param node: emits a value
  registry.register(
    new NodeDefinition({
      typeId: FN_NODE_TYPES.PARAM,
      label: "Param",
      ports: [
        {
          id: "out",
          name: "out",
          kind: "output",
          channel: "data",
          valueType: "any", // could be typed later based on param.type
        },
      ],
    })
  );

  // Variable node: can be read (out) and written (in) depending on UX
  registry.register(
    new NodeDefinition({
      typeId: FN_NODE_TYPES.VAR,
      label: "Variable",
      ports: [
        {
          id: "set",
          name: "set",
          kind: "input",
          channel: "data",
          valueType: "any",
        },
        {
          id: "out",
          name: "out",
          kind: "output",
          channel: "data",
          valueType: "any",
        },
      ],
    })
  );

  // Add op: a + b -> out
  registry.register(
    new NodeDefinition({
      typeId: FN_NODE_TYPES.ADD,
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
          id: "out",
          name: "out",
          kind: "output",
          channel: "data",
          valueType: "number",
        },
      ],
    })
  );

  // Return node: consumes a value and represents the return output
  registry.register(
    new NodeDefinition({
      typeId: FN_NODE_TYPES.RETURN,
      label: "Return",
      ports: [
        {
          id: "in",
          name: "in",
          kind: "input",
          channel: "data",
          valueType: "any", // typed later from return.type
        },
      ],
    })
  );
}
