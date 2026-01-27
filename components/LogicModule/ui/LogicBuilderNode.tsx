"use client";
import React from "react";
import { cn } from "@/lib/utils"; // if you have it, otherwise remove
import { Shape as IShape } from "@/components/CanvasModule/types";
import { ShapeFrameProps } from "@/components/CanvasModule/blocks/BlockFrame";

type Props = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
};

function titleFor(shape: any) {
  const t = shape?.logicTypeId;
  if (t === "fn/param") return "Parameter";
  if (t === "fn/var") return "Variable";
  if (t === "fn/add") return "Logic";
  if (t === "fn/return") return "Return";
  if (t === "fn/function") return "Function";
  return "LogicBuilder";
}

function subtitleFor(shape: any) {
  const t = shape?.logicTypeId;
  if (t === "fn/param") {
    const name = shape?.data?.fnParamName;
    return name ? name : "(unnamed)";
  }
  if (t === "fn/function") {
    return shape?.data?.fnName ?? "Untitled";
  }
  return t ?? "";
}

export default function LogicBuilderNode({
  shape,
  interactive,
  isSelected,
  onMouseDown,
  onConnectorMouseDown,
}: Props) {
  const t = (shape as any)?.logicTypeId as string | undefined;

  const isParam = t === "fn/param";
  const isFunction = t === "fn/function";
  const isStatement = t === "fn/var" || t === "fn/add" || t === "fn/return";

  return (
    <div
      onMouseDown={interactive ? onMouseDown : undefined}
      className={cn(
        "absolute rounded-2xl shadow-sm border bg-white select-none",
        isSelected ? "ring-2 ring-blue-500" : "ring-0",
      )}
      style={{
        left: shape.x,
        top: shape.y,
        width: shape.width,
        height: shape.height,
      }}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b">
        <div className="text-sm font-semibold text-[#111827]">
          {titleFor(shape)}
        </div>
        <div className="text-xs text-[#6B7280] mt-0.5">
          {subtitleFor(shape)}
        </div>
      </div>

      {/* Body placeholder */}
      <div className="px-3 py-2 text-xs text-[#374151]">
        {isParam && <div>Defines a function parameter.</div>}
        {isStatement && <div>Participates in execution flow.</div>}
        {!isParam && !isStatement && <div>Unknown node type.</div>}
      </div>

      {/* Connectors (reuse your existing connector API) */}
      {interactive &&
        onConnectorMouseDown &&
        (isStatement || isParam || isFunction) && (
          <>
            {/* top */}
            <Connector
              x="50%"
              y={0}
              onMouseDown={(e) => onConnectorMouseDown(e, shape.id, "top")}
            />
            {/* right */}
            <Connector
              x="100%"
              y="50%"
              onMouseDown={(e) => onConnectorMouseDown(e, shape.id, "right")}
            />
            {/* bottom */}
            <Connector
              x="50%"
              y="100%"
              onMouseDown={(e) => onConnectorMouseDown(e, shape.id, "bottom")}
            />
            {/* left */}
            <Connector
              x={0}
              y="50%"
              onMouseDown={(e) => onConnectorMouseDown(e, shape.id, "left")}
            />
          </>
        )}
    </div>
  );
}

function Connector({
  x,
  y,
  onMouseDown,
}: {
  x: number | string;
  y: number | string;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown(e);
      }}
      className="absolute w-3 h-3 rounded-full bg-blue-600 border border-white shadow cursor-crosshair"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}
