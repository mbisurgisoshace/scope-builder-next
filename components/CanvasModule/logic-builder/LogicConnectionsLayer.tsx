// logic/LogicConnectionsLayer.tsx
"use client";

import React, { useMemo } from "react";
import { Shape as IShape } from "../types";
import { useLogicGraph } from "./LogicGraphContext";
import { LogicPortSide, PortId } from "./types";
import { SelectableConnectionArrow } from "../SelectableConnectionArrow";

type Props = {
  shapes: IShape[];
};

function getAnchor(
  shape: IShape,
  side: LogicPortSide | undefined,
  portId?: PortId
): { x: number; y: number } {
  const s = side ?? "right";
  const { x, y, width: w, height: h } = shape;

  if (s === "top") {
    return { x: x + w / 2, y };
  }

  if (s === "bottom") {
    // Align with your UI: "then" bottom-left, "else" bottom-right, others center
    if (portId === ("then" as PortId)) {
      return { x: x + w * 0.25, y: y + h };
    }
    if (portId === ("else" as PortId)) {
      return { x: x + w * 0.75, y: y + h };
    }
    return { x: x + w / 2, y: y + h };
  }

  if (s === "left") {
    return { x, y: y + h / 2 };
  }

  // right
  return { x: x + w, y: y + h / 2 };
}

export const LogicConnectionsLayer: React.FC<Props> = ({ shapes }) => {
  const { graph, registry } = useLogicGraph();

  const shapeById = useMemo(() => {
    const m = new Map<string, IShape>();
    for (const s of shapes) m.set(s.id, s);
    return m;
  }, [shapes]);

  const connections = graph.listConnections();

  return (
    <>
      {connections.map((conn) => {
        const fromNode = graph.getNode(conn.fromNodeId);
        const toNode = graph.getNode(conn.toNodeId);
        if (!fromNode || !toNode) return null;

        if (!fromNode.shapeId || !toNode.shapeId) return null;

        const fromShape = shapeById.get(fromNode.shapeId);
        const toShape = shapeById.get(toNode.shapeId);
        if (!fromShape || !toShape) return null;

        const fromDef = registry.getDefinition(fromNode.typeId);
        const toDef = registry.getDefinition(toNode.typeId);
        if (!fromDef || !toDef) return null;

        const fromPort = fromDef.getPort(conn.fromPortId as PortId);
        const toPort = toDef.getPort(conn.toPortId as PortId);
        if (!fromPort || !toPort) return null;

        const fromSide = (fromPort.side ?? "right") as LogicPortSide;
        const toSide = (toPort.side ?? "left") as LogicPortSide;

        const fromPos = getAnchor(
          fromShape,
          fromSide,
          conn.fromPortId as PortId
        );
        const toPos = getAnchor(toShape, toSide, conn.toPortId as PortId);

        return (
          <SelectableConnectionArrow
            key={conn.id}
            id={conn.id}
            from={fromPos}
            to={toPos}
            fromSide={fromSide}
            toSide={toSide}
            bend={0.5}
            strokeWidth={2}
            color="#22C55E"
          />
        );
      })}
    </>
  );
};
