"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Shape as IShape } from "../types";
import { ShapeFrame, ShapeFrameProps } from "../blocks/BlockFrame";
import { useLogicGraph } from "./LogicGraphContext";
import { useLogicConnection } from "./LogicConnectionContext";
import { NodeInstanceId, PortId } from "./types";

type Props = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
};

export const FunctionNodeBlock: React.FC<Props> = (props) => {
  const { shape } = props;
  const { registry, service, refresh } = useLogicGraph();
  const { drag, beginDrag, endDrag } = useLogicConnection();

  const nodeId: NodeInstanceId =
    ((shape as any).logicNodeId as NodeInstanceId) ??
    (shape.id as NodeInstanceId);

  const node = useMemo(() => {
    try {
      return service.ensureNode({
        id: nodeId,
        typeId: "logic/function",
        shapeId: shape.id,
        config: {
          //   functionName: "add", // fixed operation
          //   operation: "add", // fixed
        },
      });
    } catch (err) {
      console.error("Failed to ensure function node:", err);
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, shape.id]);

  useEffect(() => {
    if (!node) return;

    const hasName = typeof node.config?.functionName === "string";
    const hasOp = typeof node.config?.operation === "string";

    if (hasName && hasOp) return;

    try {
      service.updateNodeConfig(node.id as NodeInstanceId, {
        functionName: node.config?.functionName ?? "add",
        operation: node.config?.operation ?? "add",
      });
      refresh();
    } catch (err) {
      console.error("Failed to seed function defaults:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.id]);

  const def = useMemo(
    () => (node ? registry.getDefinition(node.typeId) : null),
    [node, registry]
  );

  // local UI state for editable name
  const [nameDraft, setNameDraft] = useState<string>("add");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const n = (node?.config?.functionName as string) ?? "add";
    setNameDraft(n);
  }, [node?.config?.functionName]);

  if (!node || !def) {
    return (
      <ShapeFrame {...props} resizable={false} showConnectors={false}>
        <div className="w-full h-full flex items-center justify-center text-xs text-red-600 bg-red-50 border border-dashed border-red-300 rounded-lg">
          Missing function node or definition.
        </div>
      </ShapeFrame>
    );
  }

  const isAnyDragActive = !!drag;

  const portCenterFromEvent = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };

  const handlePortMouseDown =
    (portId: PortId) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      const pos = portCenterFromEvent(e);
      beginDrag({
        fromNodeId: node.id,
        fromPortId: portId,
        fromPos: pos,
      });
    };

  const handlePortMouseUp =
    (portId: PortId) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (!drag) return;

      const pos = portCenterFromEvent(e);

      try {
        service.connectPorts({
          fromNodeId: drag.fromNodeId as NodeInstanceId,
          fromPortId: drag.fromPortId as PortId,
          toNodeId: node.id as NodeInstanceId,
          toPortId: portId,
        });
      } catch (err) {
        console.error("Failed to connect ports:", err);
      }

      endDrag({
        toNodeId: node.id,
        toPortId: portId,
        pos,
      });

      refresh();
    };

  const commitName = () => {
    const trimmed = nameDraft.trim() || "add";
    try {
      service.updateNodeConfig(node.id as NodeInstanceId, {
        functionName: trimmed,
      });
      setIsEditing(false);
      refresh();
    } catch (err) {
      console.error("Failed to rename function:", err);
    }
  };

  return (
    <ShapeFrame {...props} resizable={false} showConnectors={false}>
      <div className="relative w-full h-full bg-[#0b1220] rounded-3xl shadow-lg flex flex-col text-slate-50 overflow-visible">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-[#0b1220]/90">
          <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
            {isEditing ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitName();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setIsEditing(false);
                    setNameDraft(
                      (node.config?.functionName as string) ?? "add"
                    );
                  }
                }}
                className="bg-transparent border border-slate-600 rounded px-2 py-1 text-sm w-[160px]"
              />
            ) : (
              <button
                className="flex items-center gap-2 min-w-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                title="Rename function"
              >
                <span className="font-semibold text-sm truncate">
                  {node.config?.functionName ?? "add"}
                </span>
                <span className="text-[10px] text-slate-400">✏️</span>
              </button>
            )}
          </div>

          <span className="text-[11px] text-slate-400">Function</span>
        </div>

        {/* Body */}
        <div className="flex-1 px-4 py-3 text-[12px]">
          <div className="text-slate-300">
            Fixed op: <span className="font-mono">add(a, b)</span>
          </div>
          <div className="mt-2 text-slate-400 text-[11px]">
            Inputs: <span className="font-mono">a:number</span>,{" "}
            <span className="font-mono">b:number</span>
            <br />
            Output: <span className="font-mono">return:number</span>
          </div>
        </div>

        {/* Ports */}
        {/* Left: a */}
        <button
          type="button"
          aria-label="arg a"
          onMouseDown={handlePortMouseDown("a" as PortId)}
          onMouseUp={handlePortMouseUp("a" as PortId)}
          className={[
            "absolute top-[70px] -left-2 w-4 h-4 rounded-full border-2",
            "border-emerald-300 bg-emerald-500 shadow pointer-events-auto",
            isAnyDragActive ? "scale-[1.05]" : "",
          ].join(" ")}
          title="a:number"
        />
        {/* Left: b */}
        <button
          type="button"
          aria-label="arg b"
          onMouseDown={handlePortMouseDown("b" as PortId)}
          onMouseUp={handlePortMouseUp("b" as PortId)}
          className={[
            "absolute top-[110px] -left-2 w-4 h-4 rounded-full border-2",
            "border-emerald-300 bg-emerald-500 shadow pointer-events-auto",
            isAnyDragActive ? "scale-[1.05]" : "",
          ].join(" ")}
          title="b:number"
        />
        {/* Right: return */}
        <button
          type="button"
          aria-label="return"
          onMouseDown={handlePortMouseDown("return" as PortId)}
          onMouseUp={handlePortMouseUp("return" as PortId)}
          className={[
            "absolute top-[92px] -right-2 w-4 h-4 rounded-full border-2",
            "border-sky-300 bg-sky-500 shadow pointer-events-auto",
            isAnyDragActive ? "scale-[1.05]" : "",
          ].join(" ")}
          title="return:number"
        />
      </div>
    </ShapeFrame>
  );
};
