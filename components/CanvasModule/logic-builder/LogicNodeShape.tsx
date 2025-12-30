"use client";

import React, { useEffect, useMemo } from "react";
import type { Shape as IShape } from "../../CanvasModule/types";
import { useLogicGraph } from "./LogicGraphContext";
import { ShapeFrameProps } from "../blocks/BlockFrame";
import { NodeInstanceId, NodeTypeId } from "./types";

type Props = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
};

const PORT_SIZE = 10;

function PortDot({
  nodeId,
  portId,
  style,
  title,
}: {
  nodeId: string;
  portId: string;
  style: React.CSSProperties;
  title: string;
}) {
  const { connectingFrom, beginConnection, completeConnection } =
    useLogicGraph();

  const isArming =
    connectingFrom?.nodeId === nodeId && connectingFrom?.portId === portId;

  return (
    <button
      type="button"
      title={title}
      data-node-id={nodeId}
      data-port-id={portId}
      className={[
        "absolute rounded-full bg-white border border-black/20 shadow",
        "pointer-events-auto",
        isArming ? "ring-2 ring-blue-500" : "",
      ].join(" ")}
      style={{
        width: PORT_SIZE,
        height: PORT_SIZE,
        ...style,
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation(); // 👈 IMPORTANT: don’t start dragging/selecting the shape
        // Click-to-connect UX:
        if (!connectingFrom) beginConnection(String(nodeId), String(portId));
        else completeConnection(String(nodeId), String(portId));
      }}
    />
  );
}

function portLayout(portCount: number, idx: number) {
  // evenly space ports vertically (avoid top title area)
  // 24px top padding for title bar
  const topPad = 28;
  const bottomPad = 10;
  const usable = `calc(100% - ${topPad + bottomPad}px)`;

  // We use CSS calc so it adapts with node size
  const step =
    portCount <= 1 ? "50%" : `calc(${idx} * (${usable} / ${portCount - 1}))`;
  return {
    top: `calc(${topPad}px + ${step})`,
    transform: "translateY(-50%)",
  } as React.CSSProperties;
}

export function LogicNodeShape({
  shape,
  interactive = true,
  isSelected,
  onMouseDown,
}: Props) {
  const {
    service,
    registry,
    refresh,
    connectingFrom,
    beginConnection,
    completeConnection,
    cancelConnection,
  } = useLogicGraph();

  // ✅ Ensure node exists in logic graph (one per canvas shape)
  useEffect(() => {
    if (!shape.logicTypeId) return;

    service.ensureNode({
      id: shape.id as NodeInstanceId,
      typeId: shape.logicTypeId as NodeTypeId,
      shapeId: shape.id,
      config: shape.logicConfig ?? {},
    });
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape.id, shape.logicTypeId, shape.nodeTypeId]);

  const nodeId = shape.id as string;
  const typeId = (shape.logicTypeId ?? shape.nodeTypeId) as string;

  const def = useMemo(
    () => registry.getDefinition(typeId as any),
    [registry, typeId]
  );

  const ports = def?.ports ?? [];
  const inputs = ports.filter((p: any) => p.kind === "input");
  const outputs = ports.filter((p: any) => p.kind === "output");

  const title = def?.label ?? shape.text ?? "Logic Node";

  const handlePortMouseDown =
    (portId: string, kind: "input" | "output") => (e: React.MouseEvent) => {
      e.stopPropagation();

      // n8n-ish behavior:
      // - click output => begin connection
      // - click input while connecting => complete connection
      if (kind === "output") {
        beginConnection(nodeId, portId);
        return;
      }

      // input
      if (connectingFrom) {
        completeConnection(nodeId, portId);
      } else {
        // optional: clicking an input without active connection cancels any pending
        cancelConnection();
      }
    };

  return (
    <div
      data-shapeid={shape.id}
      className={`absolute rounded-xl bg-white border shadow-sm ${
        isSelected ? "ring-2 ring-blue-400" : ""
      }`}
      style={{
        left: shape.x,
        top: shape.y,
        width: shape.width,
        height: shape.height,
      }}
      onMouseDown={interactive ? onMouseDown : undefined}
    >
      {/* Title */}
      <div className="px-3 py-2 text-sm font-semibold truncate">{title}</div>

      {/* LEFT: inputs */}
      {inputs.map((p: any, i: number) => {
        const active =
          connectingFrom?.nodeId === nodeId && connectingFrom?.portId === p.id;
        return (
          <PortDot
            key={p.id}
            nodeId={nodeId}
            portId={p.id}
            title={`${p.name ?? p.id}`}
            style={{
              left: -PORT_SIZE / 2,
              ...portLayout(inputs.length, i),
            }}
            //active={active}
            //onMouseDown={handlePortMouseDown(p.id, "input")}
          />
        );
      })}

      {/* RIGHT: outputs */}
      {outputs.map((p: any, i: number) => {
        const active =
          connectingFrom?.nodeId === nodeId && connectingFrom?.portId === p.id;
        return (
          <PortDot
            key={p.id}
            nodeId={nodeId}
            portId={p.id}
            title={`${p.name ?? p.id}`}
            style={{
              right: -PORT_SIZE / 2,
              ...portLayout(outputs.length, i),
            }}
            //active={active}
            //onMouseDown={handlePortMouseDown(p.id, "output")}
          />
        );
      })}

      {/* Optional: tiny debug line */}
      {/* <div className="absolute bottom-2 left-3 text-[10px] text-black/40">{typeId}</div> */}
    </div>
  );
}
