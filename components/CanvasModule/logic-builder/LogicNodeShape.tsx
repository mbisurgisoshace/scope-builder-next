// logic/LogicNodeShape.tsx
"use client";

import React, { useEffect, useCallback } from "react";
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
  kind,
  title,
  style,
  isConnecting,
  onStart,
  onComplete,
}: {
  nodeId: string;
  portId: string;
  kind: "input" | "output";
  title: string;
  style: React.CSSProperties;
  isConnecting: boolean;
  onStart: (nodeId: string, portId: string) => void;
  onComplete: (nodeId: string, portId: string) => void;
}) {
  return (
    <div
      title={title}
      data-node-id={nodeId}
      data-port-id={portId}
      data-port-kind={kind}
      className={[
        "absolute rounded-full border shadow",
        "bg-white border-black/20",
        kind === "output" ? "cursor-crosshair" : "cursor-pointer",
        isConnecting ? "ring-2 ring-blue-400" : "",
      ].join(" ")}
      style={{
        width: PORT_SIZE,
        height: PORT_SIZE,
        ...style,
      }}
      onMouseDown={(e) => {
        // Only start a connection from OUTPUT ports (n8n-ish)
        if (kind !== "output") return;

        e.preventDefault();
        e.stopPropagation();
        onStart(nodeId, portId);
      }}
      onMouseUp={(e) => {
        // Only complete a connection on INPUT ports
        if (kind !== "input") return;

        e.preventDefault();
        e.stopPropagation();
        onComplete(nodeId, portId);
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
  const {
    service,
    graph,
    registry,
    refresh,
    connectingFrom,
    beginConnection,
    completeConnection,
    cancelConnection,
  } = useLogicGraph();

  console.log("graph", graph);
  console.log("service", service);

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
      return { port: p, top: TOP_PAD + t * usableH };
    });
  };

  const inputPlacements = placePorts(inputs);
  const outputPlacements = placePorts(outputs);

  const onStart = useCallback(
    (nodeId: string, portId: string) => {
      beginConnection(nodeId, portId);
    },
    [beginConnection]
  );

  const onComplete = useCallback(
    (nodeId: string, portId: string) => {
      completeConnection(nodeId, portId);
    },
    [completeConnection]
  );

  const isThisNodeConnectingFrom = connectingFrom?.nodeId === node.id;

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
      onMouseUp={(e) => {
        // If user releases somewhere on the node (not on an input port),
        // cancel any in-progress connection.
        if (!connectingFrom) return;

        const t = e.target as HTMLElement;
        const isPort = !!t.closest?.("[data-port-id]");
        if (!isPort) cancelConnection();
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 text-sm font-semibold truncate flex items-center justify-between">
        <span>{def.label}</span>
      </div>

      {/* Inputs (left) */}
      {inputPlacements.map(({ port, top }) => (
        <React.Fragment key={`in-${port.id}`}>
          <Port
            nodeId={node.id}
            portId={port.id}
            kind="input"
            title={port.name}
            isConnecting={false}
            onStart={onStart}
            onComplete={onComplete}
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
            kind="output"
            title={port.name}
            isConnecting={
              isThisNodeConnectingFrom && connectingFrom?.portId === port.id
            }
            onStart={onStart}
            onComplete={onComplete}
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
