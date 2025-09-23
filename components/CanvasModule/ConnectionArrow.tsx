// CanvasModule/ConnectionArrow.tsx
import React, { useMemo } from "react";
import { Side, Connection, ArrowHead, ArrowDash } from "./types";

type Pt = { x: number; y: number };

function tangentTowardSide(end: Pt, side: Side, magnitude = 40): Pt {
  switch (side) {
    case "top":
      return { x: end.x, y: end.y + magnitude }; // apunta hacia abajo
    case "bottom":
      return { x: end.x, y: end.y - magnitude }; // apunta hacia arriba
    case "left":
      return { x: end.x + magnitude, y: end.y }; // apunta a derecha
    case "right":
      return { x: end.x - magnitude, y: end.y }; // apunta a izquierda
  }
}

function controlPointsCurve(
  from: Pt,
  to: Pt,
  fromSide: Side,
  toSide: Side
): [Pt, Pt] {
  // primeros control points siguiendo la normal al lado
  const c1 = tangentTowardSide(from, fromSide, 80);
  const c2 = tangentTowardSide(to, toSide, 80);
  return [c1, c2];
}

function orthogonalRoute(
  from: Pt,
  to: Pt,
  fromSide: Side,
  toSide: Side
): string {
  // Ruta en “L”/“┐” simple con codos redondeables por stroke-linejoin/linecap
  // Heurística: primero salir normal al lado, luego girar.
  const o1 = tangentTowardSide(from, fromSide, 24);
  const o2 = tangentTowardSide(to, toSide, 24);
  // unir puntos intermedios en rectas
  // punto de quiebre “medio”:
  const mid: Pt = { x: (o1.x + o2.x) / 2, y: (o1.y + o2.y) / 2 };
  return `M ${from.x},${from.y} L ${o1.x},${o1.y} L ${mid.x},${mid.y} L ${o2.x},${o2.y} L ${to.x},${to.y}`;
}

function dashToSvg(d: ArrowDash) {
  if (d === "dashed") return "6 6";
  if (d === "dotted") return "2 6";
  return undefined;
}

function headId(h: ArrowHead) {
  return `ah-${h}`;
}

function HeadDefs({ color }: { color: string }) {
  // defs reutilizables (usar markerUnits="strokeWidth" para escalar con width)
  return (
    <defs>
      {/* triangle */}
      <marker
        id={headId("triangle")}
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="8"
        markerHeight="8"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
      </marker>
      {/* circle */}
      <marker
        id={headId("circle")}
        viewBox="0 0 10 10"
        refX="5"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <circle cx="5" cy="5" r="4" fill={color} />
      </marker>
      {/* diamond */}
      <marker
        id={headId("diamond")}
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="8"
        markerHeight="8"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M 5 0 L 10 5 L 5 10 L 0 5 z" fill={color} />
      </marker>
      {/* bar (linea transversal) */}
      <marker
        id={headId("bar")}
        viewBox="0 0 10 10"
        refX="6"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M 0 0 L 0 10" stroke={color} strokeWidth="2" />
      </marker>
    </defs>
  );
}

export function ConnectionArrow({
  from,
  to,
  fromSide,
  toSide,
  color,
  width,
  rounded,
  style,
  dash,
  ends, // { start, end }
  zIndex = 20,
}: {
  from: Pt;
  to: Pt;
  fromSide: Side;
  toSide: Side;
  color: string;
  width: number;
  rounded: boolean;
  style: "curve" | "straight" | "orthogonal";
  dash: ArrowDash;
  ends: { start: ArrowHead; end: ArrowHead };
  zIndex?: number;
}) {
  // bbox local para no clipear en pan/zoom
  const pad = 60;
  const minX = Math.min(from.x, to.x) - pad;
  const minY = Math.min(from.y, to.y) - pad;
  const maxX = Math.max(from.x, to.x) + pad;
  const maxY = Math.max(from.y, to.y) + pad;

  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);

  const F = { x: from.x - minX, y: from.y - minY };
  const T = { x: to.x - minX, y: to.y - minY };

  const pathD = useMemo(() => {
    if (style === "straight") {
      return `M ${F.x},${F.y} L ${T.x},${T.y}`;
    }
    if (style === "orthogonal") {
      return orthogonalRoute(F, T, fromSide, toSide);
    }
    // curve
    const [c1, c2] = controlPointsCurve(F, T, fromSide, toSide);
    return `M ${F.x},${F.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${T.x},${T.y}`;
  }, [F.x, F.y, T.x, T.y, fromSide, toSide, style]);

  const linecap = rounded ? "round" : "butt";
  const linejoin = rounded ? "round" : "miter";
  const markerStart =
    ends.start !== "none" ? `url(#${headId(ends.start)})` : undefined;
  const markerEnd =
    ends.end !== "none" ? `url(#${headId(ends.end)})` : undefined;

  return (
    <svg
      className="absolute pointer-events-none"
      style={{ left: minX, top: minY, width: w, height: h, zIndex }}
    >
      <HeadDefs color={color} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap={linecap}
        strokeLinejoin={linejoin}
        strokeDasharray={dashToSvg(dash)}
        markerStart={markerStart}
        markerEnd={markerEnd}
      />
    </svg>
  );
}
