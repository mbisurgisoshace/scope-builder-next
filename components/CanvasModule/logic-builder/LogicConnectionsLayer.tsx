// logic/LogicConnectionsLayer.tsx
"use client";

import React, { useMemo } from "react";
import type { Shape as IShape } from "../types";
import { useLogicGraph } from "./LogicGraphContext";
import { OrthogonalArrow } from "../OrthogonalArrow";
import type {
  LogicPortDefinition,
  LogicPortSide,
  NodeInstanceId,
  PortId,
} from "./types";

type Point = { x: number; y: number };

type Props = {
  shapes: IShape[];
  mousePos?: Point | null; // world coords (same coords as shapes)
};

const PORT_SIZE = 10;

// Keep this aligned with LogicNodeShape visual layout
const TOP_PAD = 36;
const BOT_PAD = 12;

function defaultSideForPort(p: LogicPortDefinition): LogicPortSide {
  if (p.side) return p.side;
  // sensible defaults
  if (p.kind === "input") return "left";
  if (p.kind === "output") return "right";
  // branch/body/control-ish: bottom feels “n8n-ish”
  if (p.kind === "branch" || p.kind === "body") return "bottom";
  return "right";
}

function rectForShape(s: IShape) {
  return { x: s.x, y: s.y, width: s.width, height: s.height };
}

function placePortsOnSide(
  shape: IShape,
  ports: LogicPortDefinition[],
  side: LogicPortSide
) {
  const usableH = Math.max(1, shape.height - TOP_PAD - BOT_PAD);
  const usableW = Math.max(1, shape.width - 24); // small padding effect for top/bottom distribution

  // Sort by explicit order first, then stable by id
  const sorted = [...ports].sort((a, b) => {
    const ao = a.order ?? 0;
    const bo = b.order ?? 0;
    if (ao !== bo) return ao - bo;
    return String(a.id).localeCompare(String(b.id));
  });

  const n = Math.max(1, sorted.length);

  return sorted.map((p, idx) => {
    const t = n === 1 ? 0.5 : (idx + 1) / (n + 1);

    // Compute anchor point at the edge (matching how the dot sits visually)
    if (side === "left") {
      return { port: p, x: shape.x, y: shape.y + TOP_PAD + t * usableH };
    }
    if (side === "right") {
      return {
        port: p,
        x: shape.x + shape.width,
        y: shape.y + TOP_PAD + t * usableH,
      };
    }
    if (side === "top") {
      return {
        port: p,
        x: shape.x + shape.width / 2 + (t - 0.5) * usableW,
        y: shape.y,
      };
    }
    // bottom
    return {
      port: p,
      x: shape.x + shape.width / 2 + (t - 0.5) * usableW,
      y: shape.y + shape.height,
    };
  });
}

function getPortWorldPos(
  shape: IShape,
  defPorts: LogicPortDefinition[],
  portId: PortId
) {
  const p = defPorts.find((x) => x.id === portId);
  if (!p) return null;

  const side = defaultSideForPort(p);

  // group ports by side to distribute nicely
  const bySide = defPorts.filter((pp) => defaultSideForPort(pp) === side);
  const placed = placePortsOnSide(shape, bySide, side);
  const hit = placed.find((it) => it.port.id === portId);
  if (!hit) return null;

  return {
    pos: { x: hit.x, y: hit.y },
    side,
  };
}

function pickSideFromVector(from: Point, to: Point): LogicPortSide {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  }
  return dy >= 0 ? "bottom" : "top";
}

export function LogicConnectionsLayer({ shapes, mousePos }: Props) {
  const { graph, registry, connectingFrom } = useLogicGraph();

  // fast shape lookup
  const shapeById = useMemo(() => {
    const m = new Map<string, IShape>();
    for (const s of shapes) m.set(s.id, s);
    return m;
  }, [shapes]);

  const conns = graph.listConnections();

  const arrows = conns
    .map((c) => {
      const fromNode = graph.getNode(c.fromNodeId as NodeInstanceId);
      const toNode = graph.getNode(c.toNodeId as NodeInstanceId);
      if (!fromNode || !toNode) return null;

      const fromShapeId = fromNode.shapeId ?? fromNode.id;
      const toShapeId = toNode.shapeId ?? toNode.id;

      const fromShape = shapeById.get(fromShapeId);
      const toShape = shapeById.get(toShapeId);
      if (!fromShape || !toShape) return null;

      const fromDef = registry.getDefinition(fromNode.typeId);
      const toDef = registry.getDefinition(toNode.typeId);
      if (!fromDef || !toDef) return null;

      const fromPort = getPortWorldPos(fromShape, fromDef.ports, c.fromPortId);
      const toPort = getPortWorldPos(toShape, toDef.ports, c.toPortId);
      if (!fromPort || !toPort) return null;

      return (
        <OrthogonalArrow
          key={c.id}
          id={c.id}
          from={fromPort.pos}
          to={toPort.pos}
          fromSide={fromPort.side}
          toSide={toPort.side}
          fromRect={rectForShape(fromShape)}
          toRect={rectForShape(toShape)}
          selected={false}
          onSelect={() => {}}
          zIndex={6}
        />
      );
    })
    .filter(Boolean);

  // Preview while connecting
  const preview = (() => {
    if (!connectingFrom || !mousePos) return null;

    const fromNode = graph.getNode(connectingFrom.nodeId as NodeInstanceId);
    if (!fromNode) return null;

    const fromShapeId = fromNode.shapeId ?? fromNode.id;
    const fromShape = shapeById.get(fromShapeId);
    if (!fromShape) return null;

    const fromDef = registry.getDefinition(fromNode.typeId);
    if (!fromDef) return null;

    const fromPort = getPortWorldPos(
      fromShape,
      fromDef.ports,
      connectingFrom.portId as PortId
    );
    if (!fromPort) return null;

    const toSide = pickSideFromVector(fromPort.pos, mousePos);

    return (
      <OrthogonalArrow
        id="logic-preview"
        from={fromPort.pos}
        to={mousePos}
        fromSide={fromPort.side}
        toSide={toSide}
        fromRect={rectForShape(fromShape)}
        // no toRect for mouse
        selected={false}
        onSelect={() => {}}
        zIndex={7}
      />
    );
  })();

  return (
    <>
      {arrows}
      {preview}
    </>
  );
}
