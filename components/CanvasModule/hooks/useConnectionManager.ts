"use client";

import { useMemo, useState } from "react";
import { LiveList, LiveObject } from "@liveblocks/client";
import { useMutation, useStorage } from "@liveblocks/react";
import type { Shape, Position, Side } from "../types";

/** Relative anchor inside a shape (0..1 in both axes) */
export type Anchor = { x: number; y: number };

/** Arrow visual style */
export type ArrowStyle = "curve" | "straight" | "orthogonal";
export type ArrowHead = "none" | "triangle" | "circle" | "diamond" | "bar";
export type ArrowDash = "solid" | "dashed" | "dotted";

export interface ConnectionStyle {
  color: string; // stroke color
  width: number; // stroke width
  style: ArrowStyle; // curve | straight | orthogonal
  rounded: boolean; // strokeLinecap/Join
  dash: ArrowDash; // solid | dashed | dotted
  ends: { start: ArrowHead; end: ArrowHead }; // heads
}

/** A persisted connection between two shapes via relative anchors */
export type Connection = {
  id: string;
  fromShapeId: Shape["id"];
  fromAnchor: Anchor;
  fromSide: Side; // NEW: lado de salida
  toShapeId: Shape["id"];
  toAnchor: Anchor;
  toSide: Side; // NEW: lado de entrada
  style: ConnectionStyle; // NEW: estilos visuales
};

/** Defaults Miro-like */
export const DEFAULT_CONNECTION_STYLE: ConnectionStyle = {
  color: "#111827",
  width: 2,
  style: "curve",
  rounded: true,
  dash: "solid",
  ends: { start: "none", end: "triangle" },
};

/** Helper: absolute pos from a shape + relative anchor */
export function getAbsoluteAnchorPosition(
  shape: Shape,
  anchor: Anchor
): Position {
  return {
    x: shape.x + shape.width * anchor.x,
    y: shape.y + shape.height * anchor.y,
  };
}

/** Helper: convert absolute point to relative anchor for a given shape */
export function computeRelativeAnchor(shape: Shape, point: Position): Anchor {
  const w = shape.width || 1;
  const h = shape.height || 1;
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  return {
    x: clamp01((point.x - shape.x) / w),
    y: clamp01((point.y - shape.y) / h),
  };
}

/** Helper: find a shape by id (tiny convenience) */
function byId(shapes: Shape[], id: Shape["id"]) {
  return shapes.find((s) => s.id === id) || null;
}

/**
 * Centralized connection manager (Liveblocks-powered):
 * - Reads connections from Liveblocks Storage (root.connections: LiveList<LiveObject>)
 * - Adds/removes/updates connections via mutations
 * - Computes absolute endpoints for rendering
 *
 * Selection state is kept local (not shared).
 */
export function useConnectionManager() {
  const storage = useStorage((root) => root);
  const liveConnections = useStorage((root) => root.connections);

  /** READ snapshot */
  const connections: Connection[] = useMemo(() => {
    if (!liveConnections) return [];
    // Si tu Storage ya guarda objetos plain, este cast funciona bien.
    // Si en tu setup son LiveObjects, puedes transformar uno por uno.
    return liveConnections as unknown as Connection[];
  }, [liveConnections, storage]);

  /** WRITE: push a new connection */
  const addConnectionRelative = useMutation(
    (
      { storage },
      input: Omit<Connection, "id" | "style" | "fromSide" | "toSide"> & {
        id?: string;
        style?: ConnectionStyle;
        fromSide: Side;
        toSide: Side;
      }
    ) => {
      const list = storage.get("connections") as LiveList<any>;
      const id = input.id ?? crypto.randomUUID();
      const conn: Connection = {
        id,
        fromShapeId: input.fromShapeId,
        fromAnchor: input.fromAnchor,
        fromSide: input.fromSide,
        toShapeId: input.toShapeId,
        toAnchor: input.toAnchor,
        toSide: input.toSide,
        style: input.style ?? DEFAULT_CONNECTION_STYLE,
      };
      //@ts-ignore
      list.push(new LiveObject(conn));
      return id;
    },
    []
  );

  /** WRITE: remove by id */
  const removeConnection = useMutation(({ storage }, id: string) => {
    const list = storage.get("connections") as LiveList<any>;
    for (let i = list.length - 1; i >= 0; i--) {
      const lo = list.get(i)!;
      if ((lo.get("id") as string) === id) {
        list.delete(i);
        break;
      }
    }
  }, []);

  /** WRITE: remove multiple */
  const removeConnectionsByIds = useMutation(({ storage }, ids: string[]) => {
    const set = new Set(ids);
    const list = storage.get("connections") as LiveList<any>;
    for (let i = list.length - 1; i >= 0; i--) {
      const lo = list.get(i)!;
      if (set.has(lo.get("id") as string)) list.delete(i);
    }
  }, []);

  /** WRITE: patch/update by id — incluye campos nuevos */
  const updateConnection = useMutation(
    (
      { storage },
      params: {
        id: string;
        patch: Partial<
          Omit<Connection, "id"> & {
            style?: Partial<ConnectionStyle> & {
              ends?: Partial<ConnectionStyle["ends"]>;
            };
          }
        >;
      }
    ) => {
      const list = storage.get("connections") as LiveList<any>;
      for (let i = 0; i < list.length; i++) {
        const lo = list.get(i)!;
        if ((lo.get("id") as string) === params.id) {
          const { patch } = params;

          if (patch.fromShapeId !== undefined)
            lo.set(
              "fromShapeId",
              patch.fromShapeId as Connection["fromShapeId"]
            );
          if (patch.toShapeId !== undefined)
            lo.set("toShapeId", patch.toShapeId as Connection["toShapeId"]);
          if (patch.fromAnchor !== undefined)
            lo.set("fromAnchor", patch.fromAnchor as Anchor);
          if (patch.toAnchor !== undefined)
            lo.set("toAnchor", patch.toAnchor as Anchor);

          if (patch.fromSide !== undefined)
            lo.set("fromSide", patch.fromSide as Side);
          if (patch.toSide !== undefined)
            lo.set("toSide", patch.toSide as Side);

          // Style: set parcial y deep-merge para ends
          if (patch.style !== undefined) {
            const prev = lo.get("style") as ConnectionStyle | undefined;
            const next: ConnectionStyle = {
              ...(prev ?? DEFAULT_CONNECTION_STYLE),
              ...(patch.style as Partial<ConnectionStyle>),
              ends: {
                ...(prev?.ends ?? DEFAULT_CONNECTION_STYLE.ends),
                ...(patch.style?.ends ?? {}),
              },
            };
            lo.set("style", next);
          }

          break;
        }
      }
    },
    []
  );

  /**
   * Finalize a connection from the current “connecting” state + a snap result.
   * Usa `snapResult.side` y `snapResult.anchor` (del hook useBorderSnapping).
   */
  function finalizeFromSnap(args: {
    connecting: {
      fromShapeId: Shape["id"];
      fromDirection: Side; // lado desde el que salió el conector
      fromPosition: Position; // world coords where the drag started (preview)
    };
    snapResult: {
      shapeId: Shape["id"];
      snappedPosition: Position; // world coords donde cayó
      side: Side; // lado donde entró
      anchor: Anchor; // relativo [0..1] dentro del shape destino
    };
    shapes: Shape[];
  }) {
    const { connecting, snapResult, shapes } = args;

    const from = byId(shapes, connecting.fromShapeId);
    const to = byId(shapes, snapResult.shapeId);
    if (!from || !to) return null;

    // fromAnchor: si tu UI arranca exactamente en el borde según fromDirection,
    // podés normalizarlo a middle-of-side; si prefieres precisión del punto,
    // computeRelativeAnchor sobre fromPosition.
    const fromAnchor = connecting.fromPosition
      ? computeRelativeAnchor(from, connecting.fromPosition)
      : middleOfSide(from, connecting.fromDirection);

    const id = addConnectionRelative({
      fromShapeId: connecting.fromShapeId,
      fromAnchor,
      fromSide: connecting.fromDirection,
      toShapeId: snapResult.shapeId,
      toAnchor: snapResult.anchor,
      toSide: snapResult.side,
      // style opcional: usa defaults
    });

    return id;
  }

  /** Punto central del lado (por si no querés usar fromPosition) */
  function middleOfSide(shape: Shape, side: Side): Anchor {
    switch (side) {
      case "top":
        return { x: 0.5, y: 0 };
      case "bottom":
        return { x: 0.5, y: 1 };
      case "left":
        return { x: 0, y: 0.5 };
      case "right":
        return { x: 1, y: 0.5 };
    }
  }

  /** Compute absolute endpoints for rendering against current shapes */
  function useConnectionEndpoints(shapes: Shape[]) {
    return useMemo(
      () =>
        connections
          .map((c) => {
            const from = byId(shapes, c.fromShapeId);
            const to = byId(shapes, c.toShapeId);
            if (!from || !to) return null;
            return {
              id: c.id,
              from: getAbsoluteAnchorPosition(from, c.fromAnchor),
              to: getAbsoluteAnchorPosition(to, c.toAnchor),
              connection: c, // incluye sides + style
            };
          })
          .filter(Boolean) as Array<{
          id: string;
          from: Position;
          to: Position;
          connection: Connection;
        }>,
      [connections, shapes]
    );
  }

  /** Reemplazar un endpoint con punto absoluto (drag de extremos) */
  function replaceEndpointWithAbsolute(args: {
    id: string;
    endpoint: "from" | "to";
    shapeId: Shape["id"];
    absolutePoint: Position;
    shapes: Shape[];
  }) {
    const { id, endpoint, shapeId, absolutePoint, shapes } = args;
    const shape = byId(shapes, shapeId);
    if (!shape) return;

    const anchor = computeRelativeAnchor(shape, absolutePoint);
    if (endpoint === "from") {
      updateConnection({
        id,
        patch: { fromShapeId: shapeId, fromAnchor: anchor },
      });
    } else {
      updateConnection({
        id,
        patch: { toShapeId: shapeId, toAnchor: anchor },
      });
    }
  }

  // Local (non-shared) connection selection
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);
  function selectConnection(id: string | null) {
    setSelectedConnectionId(id);
  }
  function removeSelectedConnection() {
    if (!selectedConnectionId) return;
    removeConnection(selectedConnectionId);
    setSelectedConnectionId(null);
  }

  const selectedConnection = useMemo(
    () =>
      selectedConnectionId
        ? connections.find((c) => c.id === selectedConnectionId) ?? null
        : null,
    [connections, selectedConnectionId]
  );

  return {
    // live snapshots
    connections,

    // core ops (persisted)
    addConnectionRelative,
    removeConnection,
    removeConnectionsByIds,
    updateConnection,
    finalizeFromSnap,

    // selection (local)
    selectedConnectionId,
    selectConnection,
    selectedConnection,
    removeSelectedConnection,

    // computed endpoints for rendering
    useConnectionEndpoints,

    // helpers
    replaceEndpointWithAbsolute,
  };
}
