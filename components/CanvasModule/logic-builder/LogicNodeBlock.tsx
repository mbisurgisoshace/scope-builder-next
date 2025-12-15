"use client";

import React, { useMemo } from "react";
import { Shape as IShape } from "../types";
import { ShapeFrame, ShapeFrameProps } from "../blocks/BlockFrame";
import { useLogicGraph } from "./LogicGraphContext";
import { useLogicConnection } from "./LogicConnectionContext";
import { LogicPortSide, NodeInstanceId, PortId } from "./types";

type SpawnLinkedNodeArgs = {
  fromNodeId: NodeInstanceId;
  fromPortId: PortId;
};

type Props = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onSpawnLinkedNode?: (args: SpawnLinkedNodeArgs) => void;
};

export const LogicNodeBlock: React.FC<Props> = (props) => {
  const { shape, onSpawnLinkedNode } = props;
  const { graph, registry, service, refresh } = useLogicGraph();
  const { drag, beginDrag, endDrag } = useLogicConnection();

  // 1) Decide the node id we want to use for this shape
  const nodeId: NodeInstanceId =
    ((shape as any).logicNodeId as NodeInstanceId) ??
    (shape.id as NodeInstanceId);

  // 2) Ensure the node exists in the domain graph
  const node = useMemo(() => {
    try {
      const n = service.ensureNode({
        id: nodeId,
        typeId: "logic/if",
        shapeId: shape.id,
        config: {},
      });
      return n;
    } catch (err) {
      console.error("Failed to ensure logic node:", err);
      return undefined;
    }
    // we only want to re-run if shape.id or nodeId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, shape.id]);

  const def = useMemo(
    () => (node ? registry.getDefinition(node.typeId) : null),
    [node, registry]
  );

  // If for some reason definition is missing, show the fallback card
  if (!node || !def) {
    return (
      <ShapeFrame
        {...props}
        resizable={false}
        showConnectors={props.isSelected && props.selectedCount === 1}
      >
        <div className="w-full h-full flex items-center justify-center text-xs text-red-600 bg-red-50 border border-dashed border-red-300 rounded-lg">
          Missing logic node or definition for this shape.
        </div>
      </ShapeFrame>
    );
  }

  const isAnyDragActive = !!drag;

  const handleBranchClick =
    (portId: PortId) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (!onSpawnLinkedNode) return;
      onSpawnLinkedNode({ fromNodeId: node.id, fromPortId: portId });
    };

  const handlePortMouseDown =
    (portId: PortId) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      beginDrag({
        fromNodeId: node.id,
        fromPortId: portId,
        fromPos: { x: cx, y: cy },
      });
    };

  const handlePortMouseUp =
    (portId: PortId) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (!drag) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // 1) Tell the domain: from → to
      try {
        service.connectPorts({
          fromNodeId: drag.fromNodeId as NodeInstanceId,
          fromPortId: drag.fromPortId as PortId,
          toNodeId: node.id as NodeInstanceId,
          toPortId: portId,
        });
      } catch (err) {
        console.error("Failed to connect logic ports:", err);
        // later we can surface this in the UI (toast, inline error, etc.)
      }

      // 2) Finish the visual drag (your existing connection context)
      endDrag({
        toNodeId: node.id,
        toPortId: portId,
        pos: { x: cx, y: cy },
      });

      // 3) Ask React to repaint things that depend on connections
      refresh();
    };

  function getPortPosition(side: LogicPortSide | undefined, order = 0) {
    const s = side ?? "right";
    const inset = 8; // distance from corner
    const spacing = 16; // for multiple ports on same side

    const x = shape.x;
    const y = shape.y;
    const w = shape.width;
    const h = shape.height;

    if (s === "top") {
      return {
        x: x + w / 2 + (order - 0.5) * spacing,
        y: y,
      };
    }
    if (s === "bottom") {
      return {
        x: x + w / 2 + (order - 0.5) * spacing,
        y: y + h,
      };
    }
    if (s === "left") {
      return {
        x: x,
        y: y + h / 2 + (order - 0.5) * spacing,
      };
    }
    // right
    return {
      x: x + w,
      y: y + h / 2 + (order - 0.5) * spacing,
    };
  }

  const inner = (
    <div className="relative w-full h-full bg-[#020617] rounded-3xl shadow-lg flex flex-col text-xs text-slate-50 overflow-visible z-[2]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#020617]/90 border-b border-slate-800">
        <span className="font-semibold text-sm truncate">{def.label}</span>
        <span className="text-[11px] text-slate-400">Logic node</span>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-3 space-y-2 text-[12px] leading-relaxed">
        <div className="text-[11px] text-slate-400">
          (Domain node id:{" "}
          <span className="font-mono text-[10px]">{node.id}</span>)
        </div>
        <div className="text-[11px] text-slate-400">
          Type: <span className="font-mono">{node.typeId}</span>
        </div>

        <div className="mt-2 text-[12px]">
          Here we’ll later render:
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Ports (control &amp; data)</li>
            <li>Connections to other nodes</li>
            <li>Config (condition, assignments, etc.)</li>
          </ul>
        </div>
      </div>

      {/* Ports */}

      {/* Top center: control input "in" */}
      <button
        type="button"
        aria-label="If: control in"
        onMouseDown={handlePortMouseDown("in" as PortId)}
        onMouseUp={handlePortMouseUp("in" as PortId)}
        className={[
          "absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2",
          "border-sky-300 bg-sky-500 shadow pointer-events-auto",
          isAnyDragActive ? "scale-[1.05]" : "",
        ].join(" ")}
      />

      {/* Bottom-left: control output "then" */}
      <button
        type="button"
        aria-label="If: then branch"
        // onMouseDown={handlePortMouseDown("then" as PortId)}
        // onMouseUp={handlePortMouseUp("then" as PortId)}
        onClick={handleBranchClick("then" as PortId)}
        className={[
          "absolute -bottom-2 left-6 w-4 h-4 rounded-full border-2",
          "border-sky-300 bg-sky-500 shadow pointer-events-auto",
          isAnyDragActive ? "scale-[1.05]" : "",
        ].join(" ")}
      />

      {/* Bottom-right: control output "else" */}
      <button
        type="button"
        aria-label="If: else branch"
        // onMouseDown={handlePortMouseDown("else" as PortId)}
        // onMouseUp={handlePortMouseUp("else" as PortId)}
        onClick={handleBranchClick("else" as PortId)}
        className={[
          "absolute -bottom-2 right-6 w-4 h-4 rounded-full border-2",
          "border-sky-300 bg-sky-500 shadow pointer-events-auto",
          isAnyDragActive ? "scale-[1.05]" : "",
        ].join(" ")}
      />

      {/* Right middle: data input "cond" */}
      <button
        type="button"
        aria-label="If: condition input"
        onMouseDown={handlePortMouseDown("cond" as PortId)}
        onMouseUp={handlePortMouseUp("cond" as PortId)}
        className={[
          "absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 rounded-full border-2",
          "border-emerald-300 bg-emerald-500 shadow pointer-events-auto",
          isAnyDragActive ? "scale-[1.05]" : "",
        ].join(" ")}
      />
    </div>
  );

  return (
    <ShapeFrame {...props} resizable={false} showConnectors={false}>
      {inner}
    </ShapeFrame>
  );
};
