// hooks/useBorderSnapping.ts
import { useMemo } from "react";
import type { Position, Shape, Side } from "../types";

export type SnapResult = {
  shapeId: string;
  snappedPosition: Position; // coordenadas absolutas (mundo)
  side: Side; // "top" | "right" | "bottom" | "left"
  anchor: { x: number; y: number }; // relativas [0..1] dentro del shape
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
const clamp01 = (v: number) => clamp(v, 0, 1);

/**
 * Snapea el mouse al borde más cercano. El umbral está en píxeles de pantalla (escala-consistente).
 */
export function useBorderSnapping(
  connectingMousePos: Position | null,
  shapes: Shape[],
  scale: number,
  excludeShapeId?: string | null
) {
  const snapResult = useMemo<SnapResult | null>(() => {
    if (!connectingMousePos) return null;

    const thresholdPx = 14;
    let best: ({ distPx: number } & SnapResult) | null = null;

    for (const s of shapes) {
      if (!s) continue;
      if (excludeShapeId && s.id === excludeShapeId) continue;

      const left = s.x;
      const right = s.x + s.width;
      const top = s.y;
      const bottom = s.y + s.height;
      const w = Math.max(1, s.width);
      const h = Math.max(1, s.height);

      // Helpers relativos
      const relX = (absX: number) => clamp01((absX - left) / w);
      const relY = (absY: number) => clamp01((absY - top) / h);

      // Candidatos por lado (con anchor relativo)
      const cx = clamp(connectingMousePos.x, left, right);
      const cy = clamp(connectingMousePos.y, top, bottom);

      const candidates: SnapResult[] = [
        {
          shapeId: s.id as string,
          side: "top",
          snappedPosition: { x: cx, y: top },
          anchor: { x: relX(cx), y: 0 },
        },
        {
          shapeId: s.id as string,
          side: "bottom",
          snappedPosition: { x: cx, y: bottom },
          anchor: { x: relX(cx), y: 1 },
        },
        {
          shapeId: s.id as string,
          side: "left",
          snappedPosition: { x: left, y: cy },
          anchor: { x: 0, y: relY(cy) },
        },
        {
          shapeId: s.id as string,
          side: "right",
          snappedPosition: { x: right, y: cy },
          anchor: { x: 1, y: relY(cy) },
        },
      ];

      // Elegir el más cercano dentro del umbral
      for (const c of candidates) {
        const dx = c.snappedPosition.x - connectingMousePos.x;
        const dy = c.snappedPosition.y - connectingMousePos.y;
        const distPx = Math.hypot(dx, dy) * scale;

        if (distPx <= thresholdPx) {
          if (!best || distPx < best.distPx) best = { distPx, ...c };
        }
      }
    }

    return best
      ? {
          shapeId: best.shapeId,
          snappedPosition: best.snappedPosition,
          side: best.side,
          anchor: best.anchor,
        }
      : null;
  }, [connectingMousePos, shapes, scale, excludeShapeId]);

  return { snapResult };
}
