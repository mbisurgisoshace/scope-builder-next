export interface SelectableConnectionArrowProps {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  fromSide?: "top" | "right" | "bottom" | "left"; // ✅
  toSide?: "top" | "right" | "bottom" | "left"; // ✅
  selected?: boolean;
  onSelect?: (id: string) => void;
  color?: string;
  strokeWidth?: number;
  zIndex?: number;
  bend?: number;
}

export const SelectableConnectionArrow: React.FC<
  SelectableConnectionArrowProps
> = ({
  id,
  from,
  to,
  fromSide,
  toSide,
  selected = false,
  onSelect,
  color = "#3B82F6",
  strokeWidth = 2,
  zIndex = 400,
  bend = 40,
}) => {
  const pad = 40;
  const minX = Math.min(from.x, to.x) - pad;
  const minY = Math.min(from.y, to.y) - pad;
  const maxX = Math.max(from.x, to.x) + pad;
  const maxY = Math.max(from.y, to.y) + pad;
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  const fx = from.x - minX,
    fy = from.y - minY;
  const tx = to.x - minX,
    ty = to.y - minY;

  const normalFor = (side?: "top" | "right" | "bottom" | "left") => {
    switch (side) {
      case "top":
        return { nx: 0, ny: -1 };
      case "bottom":
        return { nx: 0, ny: 1 };
      case "left":
        return { nx: -1, ny: 0 };
      case "right":
        return { nx: 1, ny: 0 };
      default:
        return null;
    }
  };

  const fromN = normalFor(fromSide);
  const toN = normalFor(toSide);

  let cp1: { x: number; y: number };
  let cp2: { x: number; y: number };

  // same idea as preview: push cp1 OUT of the source, cp2 OUT of the target,
  // so the curve enters/exits perpendicular to borders.
  if (fromN) cp1 = { x: fx + fromN.nx * bend, y: fy + fromN.ny * bend };
  else cp1 = { x: fx + (tx - fx) * 0.3, y: fy };

  if (toN) cp2 = { x: tx + toN.nx * bend, y: ty + toN.ny * bend }; // ✅ plus
  else cp2 = { x: tx - (tx - fx) * 0.3, y: ty };

  const d = `M ${fx},${fy} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${tx},${ty}`;
  const markerId = `arrowhead-${id}`;

  return (
    <svg
      className="absolute"
      style={{
        left: `${minX}px`,
        top: `${minY}px`,
        width,
        height,
        zIndex,
        overflow: "visible",
      }}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto-start-reverse" // ✅ fixes head orientation
          markerUnits="strokeWidth"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={selected ? "#2563EB" : color}
          />
        </marker>
      </defs>

      {/* fat hit area */}
      <path
        d={d}
        stroke="transparent"
        strokeWidth={16}
        fill="none"
        style={{ cursor: "pointer" }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onSelect?.(id);
        }}
      />

      <path
        d={d}
        stroke={selected ? "#2563EB" : color}
        strokeWidth={selected ? strokeWidth + 1 : strokeWidth}
        fill="none"
        markerEnd={`url(#${markerId})`}
        pointerEvents="none"
      />
    </svg>
  );
};
