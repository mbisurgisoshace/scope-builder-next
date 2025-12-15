// components/CanvasModule/logic-builder/logicPortLayout.ts

import { NodeTypeId } from "./types";

export type PortSide = "top" | "bottom" | "left" | "right";

export interface PortLayoutEntry {
  portId: string;
  label: string;
  side: PortSide;
  index: number; // position among ports on that side
  countOnSide: number; // total ports on that side
}

export type PortLayout = Record<NodeTypeId, PortLayoutEntry[]>;

/**
 * UI-only description of where to draw ports for each node type.
 * IMPORTANT: `portId` should match the ids you used in NodeDefinition.
 *
 * Adjust portIds if your actual ids differ.
 */
export const LOGIC_PORT_LAYOUT: PortLayout = {
  "logic/if": [
    // control in (top)
    { portId: "in", label: "in", side: "top", index: 0, countOnSide: 1 },

    // condition data (left)
    {
      portId: "cond",
      label: "cond",
      side: "left",
      index: 0,
      countOnSide: 1,
    },

    // then branch (right)
    {
      portId: "then",
      label: "then",
      side: "right",
      index: 0,
      countOnSide: 1,
    },

    // else branch (bottom)
    {
      portId: "else",
      label: "else",
      side: "bottom",
      index: 0,
      countOnSide: 1,
    },
  ],
};
