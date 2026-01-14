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
  const { store: fnStore, bump, version } = useFunctionDomain();
  const [text, setText] = useState("");

  const isVariable = selectedLogicTypeId === "fn/var";
  const isReturn = selectedLogicTypeId === "fn/return";
  const isLogic = selectedLogicTypeId === "fn/add";
  const isParam = selectedLogicTypeId === "fn/param";

  // Visible symbols for the selected node (params + upstream declarations)
  const visibleSymbols = useMemo(() => {
    if (!selectedShapeId) return [];
    return fnStore.getVisibleSymbols(selectedShapeId).map((s: any) => s.name);
  }, [selectedShapeId, fnStore, version]);

  // Current declarations (with sources)
  const declarations = useMemo(() => {
    if (!selectedShapeId || !isVariable) return [];
    return fnStore.getVariableDeclarations(selectedShapeId);
  }, [selectedShapeId, isVariable, fnStore, version]);

  const paramsText = useMemo(() => {
    return fnStore.getParameters().join("\n");
  }, [fnStore, version]);

  // Load current variable declarations into textarea when selection changes
  // useEffect(() => {
  //   if (!selectedShapeId || !isVariable) {
  //     setText("");
  //     return;
  //   }
  //   const stmt: any = fnStore.getStatement(selectedShapeId);
  //   const names = (stmt?.declarations ?? []).map((d: any) => d.name);
  //   setText(names.join("\n"));
  // }, [selectedShapeId, isVariable, fnStore, version]);

  useEffect(() => {
    if (!selectedShapeId) return;

    if (isParam) {
      setText(paramsText);
      return;
    }

    // existing variable logic stays the same
    if (!isVariable) {
      setText("");
      return;
    }

    const stmt: any = fnStore.getStatement(selectedShapeId);
    const names = (stmt?.declarations ?? []).map((d: any) => d.name);
    setText(names.join("\n"));
  }, [selectedShapeId, isVariable, isParam, fnStore, version, paramsText]);

  if (!selectedShapeId) return null;

  return (
    <div className="absolute top-4 right-4 z-40 w-[340px] bg-white/90 backdrop-blur rounded-xl shadow p-3 text-xs">
      <div className="font-semibold mb-2">Inspector</div>

      <div className="text-[11px] text-gray-500 mb-2 break-all">
        {selectedLogicTypeId ?? "unknown"} · {selectedShapeId}
      </div>

      {isParam && (
        <div className="flex flex-col gap-3">
          <div className="font-medium">Parameters</div>
          <div className="text-[11px] text-gray-500">
            One per line. These are global symbols visible everywhere.
          </div>

          <textarea
            className="w-full h-32 rounded-md border p-2 text-xs font-mono"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"amount\nrate\ndays"}
          />

          <button
            className="rounded-md bg-blue-600 text-white text-xs py-2"
            onClick={() => {
              const names = text.split("\n");
              fnStore.setParameters(names);
              bump();
            }}
          >
            Apply
          </button>
        </div>
      )}

      {isVariable && (
        <div className="flex flex-col gap-3">
          <div className="font-medium">Declarations</div>
          <div className="text-[11px] text-gray-500">
            One per line. These become visible downstream.
          </div>

          <textarea
            className="w-full h-32 rounded-md border p-2 text-xs font-mono"
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

          {/* Per-declaration sources */}
          <div className="mt-2 border-t pt-2">
            <div className="font-medium mb-2">Sources</div>

            {declarations.length === 0 ? (
              <div className="text-gray-500 text-[11px]">
                (No declarations yet)
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {declarations.map((d: any) => (
                  <DeclarationRow
                    key={d.name}
                    name={d.name}
                    source={d.source}
                    // Don’t let a declaration reference itself
                    visibleSymbols={visibleSymbols.filter((s) => s !== d.name)}
                    onChange={(next) => {
                      fnStore.setVariableDeclarationSource(
                        selectedShapeId,
                        d.name,
                        next
                      );
                      bump();
                    }}
                  />
                ))}
              </div>
            )}
          </div>
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

function DeclarationRow({
  name,
  source,
  visibleSymbols,
  onChange,
}: {
  name: string;
  source: any;
  visibleSymbols: string[];
  onChange: (
    next:
      | { kind: "literal"; value: unknown }
      | { kind: "symbolRef"; name: string }
  ) => void;
}) {
  const kind: "literal" | "symbolRef" =
    source?.kind === "symbolRef" ? "symbolRef" : "literal";

  const literalValue = source?.kind === "literal" ? source.value ?? "" : "";

  const symbolName = source?.kind === "symbolRef" ? source.name ?? "" : "";

  return (
    <div className="grid grid-cols-[1fr_105px_1fr] gap-2 items-center">
      <div className="font-mono text-xs truncate" title={name}>
        {name}
      </div>

      <select
        className="border rounded-md px-2 py-1 text-xs"
        value={kind}
        onChange={(e) => {
          const nextKind = e.target.value as "literal" | "symbolRef";
          if (nextKind === "literal") onChange({ kind: "literal", value: "" });
          else onChange({ kind: "symbolRef", name: visibleSymbols[0] ?? "" });
        }}
      >
        <option value="literal">literal</option>
        <option value="symbolRef">ref</option>
      </select>

      {kind === "literal" ? (
        <input
          className="border rounded-md px-2 py-1 text-xs"
          value={String(literalValue)}
          onChange={(e) => onChange({ kind: "literal", value: e.target.value })}
          placeholder="e.g. 100"
        />
      ) : (
        <select
          className="border rounded-md px-2 py-1 text-xs"
          value={symbolName}
          onChange={(e) =>
            onChange({ kind: "symbolRef", name: e.target.value })
          }
        >
          <option value="" disabled>
            Select symbol…
          </option>
          {visibleSymbols.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
