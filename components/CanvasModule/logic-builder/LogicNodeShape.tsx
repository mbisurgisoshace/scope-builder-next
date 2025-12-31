"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import type { Shape as IShape } from "../../CanvasModule/types";
import { useLogicGraph } from "./LogicGraphContext";
import { ShapeFrameProps } from "../blocks/BlockFrame";
import type { NodeInstanceId, NodeTypeId } from "./types";

type Props = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
};

const PORT_SIZE = 10;

function Port({
  nodeId,
  portId,
  title,
  style,
  onMouseDown,
  onMouseUp,
}: {
  nodeId: string;
  portId: string;
  title: string;
  style: React.CSSProperties;
  onMouseDown?: React.MouseEventHandler<HTMLDivElement>;
  onMouseUp?: React.MouseEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      title={title}
      data-node-id={nodeId}
      data-port-id={portId}
      className="absolute rounded-full bg-white border border-black/20 shadow cursor-crosshair"
      style={{ width: PORT_SIZE, height: PORT_SIZE, ...style }}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
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

  // Always derive a stable nodeTypeId for this shape
  const nodeTypeId = (shape.logicTypeId ?? "fn/param") as NodeTypeId;

  // Ensure node exists in logic graph (one per canvas shape)
  useEffect(() => {
    service.ensureNode({
      id: shape.id as NodeInstanceId,
      typeId: nodeTypeId,
      shapeId: shape.id,
      config: (shape.logicConfig ?? {}) as Record<string, any>,
    });
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape.id, nodeTypeId, shape.logicConfig]);

  // Compute node/def WITHOUT early returns (prevents hook-order changes)
  const node = useMemo(
    () => graph.getNode(shape.id as NodeInstanceId),
    [graph, shape.id]
  );

  const def = useMemo(
    () => (node ? registry.getDefinition(node.typeId) : undefined),
    [registry, node]
  );

  // Port click behavior (n8n-ish)
  const handlePortMouseDown = useCallback(
    (nodeId: string, portId: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!interactive) return;
      // Start connection from this port
      beginConnection(nodeId, portId);
    },
    [beginConnection, interactive]
  );

  const handlePortMouseUp = useCallback(
    (nodeId: string, portId: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!interactive) return;
      // If a connection is in progress, complete it here
      if (connectingFrom) {
        completeConnection(nodeId, portId);
      }
    },
    [completeConnection, connectingFrom, interactive]
  );

  // Clicking on empty node surface should cancel any in-progress connection
  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!interactive) return;
      // if the user is mid-connection and clicks elsewhere, cancel it
      if (connectingFrom) cancelConnection();
      onMouseDown?.(e as any);
    },
    [interactive, connectingFrom, cancelConnection, onMouseDown]
  );

  // -------- Render (safe even if node/def missing) --------

  // Unknown / not-yet-ready node state
  if (!node) {
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
        onMouseDown={interactive ? handleNodeMouseDown : undefined}
      >
        <div className="px-3 py-2 text-sm font-semibold truncate">Loading…</div>
      </div>
    );
  }

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
        onMouseDown={interactive ? handleNodeMouseDown : undefined}
      >
        <div className="font-semibold">Unknown node type</div>
        <div className="mt-1">{String(node.typeId)}</div>
      </div>
    );
  }

  const inputs = def.ports.filter((p) => p.kind === "input");
  const outputs = def.ports.filter((p) => p.kind === "output");

  const TOP_PAD = 36;
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
      onMouseDown={interactive ? handleNodeMouseDown : undefined}
    >
      <div className="px-3 py-2 text-sm font-semibold truncate flex items-center justify-between">
        <span>{def.label}</span>
      </div>

      {/* Inputs */}
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
            onMouseDown={handlePortMouseDown(node.id, port.id)}
            onMouseUp={handlePortMouseUp(node.id, port.id)}
          />
          <div
            className="absolute text-[11px] text-black/60 select-none"
            style={{ left: 10, top, transform: "translateY(-50%)" }}
          >
            {port.name}
          </div>
        </React.Fragment>
      ))}

      {/* Outputs */}
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
            onMouseDown={handlePortMouseDown(node.id, port.id)}
            onMouseUp={handlePortMouseUp(node.id, port.id)}
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
