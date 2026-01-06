"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useFunctionDomain } from "./FunctionProvider";

export function LogicBuilderInspector({
  selectedShapeId,
  selectedLogicTypeId,
}: {
  selectedShapeId: string | null;
  selectedLogicTypeId?: string | null;
}) {
  const { store: fnStore, bump } = useFunctionDomain();
  const [text, setText] = useState("");

  const isVariable = selectedLogicTypeId === "fn/var";
  const isReturn = selectedLogicTypeId === "fn/return";
  const isLogic = selectedLogicTypeId === "fn/add";
  const isParam = selectedLogicTypeId === "fn/param";

  // Load current variable declarations into textarea when selection changes
  useEffect(() => {
    if (!selectedShapeId || !isVariable) {
      setText("");
      return;
    }
    const stmt: any = fnStore.getStatement(selectedShapeId);
    const names = (stmt?.declarations ?? []).map((d: any) => d.name);
    setText(names.join("\n"));
  }, [selectedShapeId, isVariable, fnStore]);

  if (!selectedShapeId) return null;

  return (
    <div className="absolute top-4 right-4 z-40 w-[340px] bg-white/90 backdrop-blur rounded-xl shadow p-3 text-xs">
      <div className="font-semibold mb-2">Inspector</div>

      <div className="text-[11px] text-gray-500 mb-2 break-all">
        {selectedLogicTypeId ?? "unknown"} · {selectedShapeId}
      </div>

      {isParam && (
        <div className="text-sm">
          Parameter nodes are global inputs (we’ll edit names next).
        </div>
      )}

      {isVariable && (
        <div className="flex flex-col gap-2">
          <div className="font-medium">Declarations</div>
          <div className="text-[11px] text-gray-500">
            One per line. These become visible downstream.
          </div>

          <textarea
            className="w-full h-40 rounded-md border p-2 text-xs font-mono"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"inc\nsav\nexp"}
          />

          <button
            className="rounded-md bg-blue-600 text-white text-xs py-2"
            onClick={() => {
              const names = text.split("\n");
              fnStore.setVariableDeclarations(selectedShapeId, names);
              bump();
            }}
          >
            Apply
          </button>
        </div>
      )}

      {isLogic && (
        <div className="text-sm">
          Logic node editing comes next (assignments).
        </div>
      )}

      {isReturn && (
        <div className="text-sm">
          Return node editing comes next (choose symbol to return).
        </div>
      )}
    </div>
  );
}
