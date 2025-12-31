// logic/LogicNodeShape.tsx
"use client";

import React, { useEffect } from "react";
import type { Shape as IShape } from "../../CanvasModule/types";
import { useLogicGraph } from "./LogicGraphContext";
import { ShapeFrameProps } from "../blocks/BlockFrame";
import { NodeInstanceId, NodeTypeId } from "./types";

type Props = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
};

const PORT_SIZE = 10;

function Port({
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
  return (
    <div
      title={title}
      data-node-id={nodeId}
      data-port-id={portId}
      className="absolute rounded-full bg-white border border-black/20 shadow"
      style={{
        width: PORT_SIZE,
        height: PORT_SIZE,
        ...style,
      }}
    />
  );
}

export function LogicNodeShape({
  shape,
  interactive = true,
  isSelected,
  onMouseDown,
}: Props) {
  const { service, graph, registry, refresh } = useLogicGraph();

  // Ensure node exists in logic graph (one per canvas shape)
  useEffect(() => {
    service.ensureNode({
      id: shape.id as NodeInstanceId,
      typeId: (shape.logicTypeId ?? "fn/param") as NodeTypeId,
      shapeId: shape.id,
      config: (shape.logicConfig ?? {}) as Record<string, any>,
    });
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape.id]);

  const node = graph.getNode(shape.id as NodeInstanceId);
  if (!node) return null;

  const def = registry.getDefinition(node.typeId);
  if (!def) {
    return (
      <div
        data-shapeid={shape.id}
        className="absolute rounded-xl bg-red-50 border border-red-300 shadow-sm p-2 text-xs text-red-700"
        style={{
          left: shape.x,
          top: shape.y,
          width: shape.width,
          height: shape.height,
        }}
        onMouseDown={interactive ? onMouseDown : undefined}
      >
        <div className="font-semibold">Unknown node type</div>
        <div className="mt-1">{String(node.typeId)}</div>
      </div>
    );
  }

  // Separate ports by kind for left/right placement
  const inputs = def.ports.filter((p) => p.kind === "input");
  const outputs = def.ports.filter((p) => p.kind === "output");

  // Simple vertical spacing (n8n-ish)
  const TOP_PAD = 36; // space for header
  const BOT_PAD = 12;
  const usableH = Math.max(1, shape.height - TOP_PAD - BOT_PAD);

  const placePorts = (ports: typeof def.ports) => {
    const n = Math.max(1, ports.length);
    return ports.map((p, idx) => {
      const t = n === 1 ? 0.5 : (idx + 1) / (n + 1);
      return {
        port: p,
        top: TOP_PAD + t * usableH,
      };
    });
  };

  const inputPlacements = placePorts(inputs);
  const outputPlacements = placePorts(outputs);

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
      {/* Header */}
      <div className="px-3 py-2 text-sm font-semibold truncate flex items-center justify-between">
        <span>{def.label}</span>
        {/* Optional: show typeId small for debugging */}
        {/* <span className="text-[10px] text-black/40">{def.typeId}</span> */}
      </div>

      {/* Inputs (left) */}
      {inputPlacements.map(({ port, top }) => (
        <React.Fragment key={`in-${port.id}`}>
          <Port
            nodeId={node.id}
            portId={port.id}
            title={port.name}
            style={{
              left: -PORT_SIZE / 2,
              top,
              transform: "translateY(-50%)",
            }}
          />
          <div
            className="absolute text-[11px] text-black/60 select-none"
            style={{
              left: 10,
              top,
              transform: "translateY(-50%)",
            }}
          >
            {port.name}
          </div>
        </React.Fragment>
      ))}

      {/* Outputs (right) */}
      {outputPlacements.map(({ port, top }) => (
        <React.Fragment key={`out-${port.id}`}>
          <Port
            nodeId={node.id}
            portId={port.id}
            title={port.name}
            style={{
              right: -PORT_SIZE / 2,
              top,
              transform: "translateY(-50%)",
            }}
          />
          <div
            className="absolute text-[11px] text-black/60 select-none"
            style={{
              right: 10,
              top,
              transform: "translateY(-50%)",
              textAlign: "right",
            }}
          >
            {port.name}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
