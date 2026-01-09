import { RefObject, useEffect, useState } from "react";
import { Marquee, Position, Shape } from "../types";

interface UseMarqueeSelectionParams {
  scale: number;
  position: Position; // pan (world offset)
  shapes: Shape[];
  canvasRef: RefObject<HTMLDivElement | null>;
  setSelectedShapeIds: (ids: string[]) => void;
  setMarquee?: (marquee: Marquee | null) => void;
  // optional QoL
  clickTolerancePx2?: number; // area threshold: treat tiny drags as click
  mode?: "intersect" | "contain"; // default: intersect
}

export function useMarqueeSelection({
  scale,
  shapes,
  position,
  canvasRef,
  setSelectedShapeIds,
  setMarquee: externalSetMarquee,
  clickTolerancePx2 = 9, // <= 3x3 area acts like a click
  mode = "intersect",
}: UseMarqueeSelectionParams) {
  const [marquee, internalSetMarquee] = useState<Marquee | null>(null);
  const [lastMousePos, setLastMousePos] = useState<Position>({ x: 0, y: 0 });

  const setMarquee = externalSetMarquee || internalSetMarquee;

  // Client (screen) -> World (canvas) coords
  const clientToWorld = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const offX = rect ? clientX - rect.left : clientX;
    const offY = rect ? clientY - rect.top : clientY;
    return {
      x: (offX - position.x) / scale,
      y: (offY - position.y) / scale,
    };
  };

  // Helpers
  const rectIntersects = (
    a: Marquee,
    b: { x: number; y: number; w: number; h: number }
  ) => {
    const aRight = a.x + a.w;
    const aBottom = a.y + a.h;
    const bRight = b.x + b.w;
    const bBottom = b.y + b.h;
    return !(aRight < b.x || bRight < a.x || aBottom < b.y || bBottom < a.y);
  };

  const rectContains = (
    a: Marquee,
    b: { x: number; y: number; w: number; h: number }
  ) => {
    return (
      a.x <= b.x &&
      a.y <= b.y &&
      a.x + a.w >= b.x + b.w &&
      a.y + a.h >= b.y + b.h
    );
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!marquee) return;

      // start (stored as client), current (client) -> both to world
      const start = clientToWorld(lastMousePos.x, lastMousePos.y);
      const curr = clientToWorld(e.clientX, e.clientY);

      // normalized marquee (always +w/+h)
      setMarquee({
        x: Math.min(start.x, curr.x),
        y: Math.min(start.y, curr.y),
        w: Math.abs(curr.x - start.x),
        h: Math.abs(curr.y - start.y),
      });
    };

    const handleMouseUp = () => {
      if (!marquee) return;

      document.body.style.userSelect = "";

      // Tiny drag => treat like click: do nothing here and let your click logic run elsewhere
      const area = marquee.w * marquee.h;
      if (area <= clickTolerancePx2) {
        setMarquee(null);
        return;
      }

      // Pick predicate (default: intersects)
      const pick = mode === "contain" ? rectContains : rectIntersects;

      const selected = shapes
        .filter((s) => {
          // assume s.x, s.y, s.width, s.height are world coords & AABBs
          return pick(marquee, { x: s.x, y: s.y, w: s.width, h: s.height });
        })
        .map((s) => s.id);

      setSelectedShapeIds(selected);
      setMarquee(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    marquee,
    lastMousePos,
    position,
    scale,
    shapes,
    setSelectedShapeIds,
    clickTolerancePx2,
    mode,
  ]);

  const startMarquee = (clientX: number, clientY: number) => {
    document.body.style.userSelect = "none";
    // store raw client start (for accurate world conversion during drag)
    setLastMousePos({ x: clientX, y: clientY });

    // also initialize marquee in world space at zero size (helps render the origin immediately)
    const start = clientToWorld(clientX, clientY);
    setMarquee({ x: start.x, y: start.y, w: 0, h: 0 });
  };

  return { marquee, startMarquee, setLastMousePos };
}
