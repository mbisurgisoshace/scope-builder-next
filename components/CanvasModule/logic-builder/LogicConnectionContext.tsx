"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NodeInstanceId, PortId } from "./types";

type Point = { x: number; y: number };

export interface LogicDragState {
  fromNodeId: NodeInstanceId;
  fromPortId: PortId;
  fromPos: Point;
  currentPos: Point;
}

interface LogicConnectionContextValue {
  drag: LogicDragState | null;
  beginDrag: (opts: {
    fromNodeId: NodeInstanceId;
    fromPortId: PortId;
    fromPos: Point;
  }) => void;
  updateDrag: (pos: Point) => void;
  endDrag: (opts: {
    toNodeId?: NodeInstanceId;
    toPortId?: PortId;
    pos?: Point;
  }) => void;
  cancelDrag: () => void;
}

const LogicConnectionContext =
  createContext<LogicConnectionContextValue | null>(null);

export const LogicConnectionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [drag, setDrag] = useState<LogicDragState | null>(null);

  const beginDrag = useCallback(
    (opts: {
      fromNodeId: NodeInstanceId;
      fromPortId: PortId;
      fromPos: Point;
    }) => {
      setDrag({
        fromNodeId: opts.fromNodeId,
        fromPortId: opts.fromPortId,
        fromPos: opts.fromPos,
        currentPos: opts.fromPos,
      });
    },
    []
  );

  const updateDrag = useCallback((pos: Point) => {
    setDrag((prev) => (prev ? { ...prev, currentPos: pos } : prev));
  }, []);

  const cancelDrag = useCallback(() => {
    setDrag(null);
  }, []);

  const endDrag = useCallback(
    (opts: { toNodeId?: NodeInstanceId; toPortId?: PortId; pos?: Point }) => {
      if (!drag) return;

      // For now: just log what *would* be connected.
      console.log("[logic] connection end", {
        fromNodeId: drag.fromNodeId,
        fromPortId: drag.fromPortId,
        toNodeId: opts.toNodeId ?? null,
        toPortId: opts.toPortId ?? null,
      });

      setDrag(null);
    },
    [drag]
  );

  // Global mousemove / mouseup while dragging
  useEffect(() => {
    if (!drag) return;

    const handleMove = (e: MouseEvent) => {
      updateDrag({ x: e.clientX, y: e.clientY });
    };

    const handleUp = (_e: MouseEvent) => {
      // Released in empty space → cancel
      cancelDrag();
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [drag, updateDrag, cancelDrag]);

  const value = useMemo(
    () => ({ drag, beginDrag, updateDrag, endDrag, cancelDrag }),
    [drag, beginDrag, updateDrag, endDrag, cancelDrag]
  );

  return (
    <LogicConnectionContext.Provider value={value}>
      {children}
    </LogicConnectionContext.Provider>
  );
};

export function useLogicConnection() {
  const ctx = useContext(LogicConnectionContext);
  if (!ctx) {
    throw new Error(
      "useLogicConnection must be used inside a <LogicConnectionProvider>"
    );
  }
  return ctx;
}
