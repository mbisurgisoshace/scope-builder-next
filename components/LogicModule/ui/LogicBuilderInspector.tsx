"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useFunctionDomain } from "./FunctionProvider";

export function LogicBuilderInspector({
  shapes,
  connections,
  selectedShapeId,
  selectedLogicTypeId,
}: {
  shapes: any;
  connections: any;
  selectedShapeId: string | null;
  selectedLogicTypeId?: string | null;
}) {
  const { store: defaultStore, bump, version, getStore } = useFunctionDomain();
  const [text, setText] = useState("");

  const isVariable = selectedLogicTypeId === "fn/var";
  const isReturn = selectedLogicTypeId === "fn/return";
  const isLogic = selectedLogicTypeId === "fn/add";
  const isParam = selectedLogicTypeId === "fn/param";
  const isFunction = selectedLogicTypeId === "fn/function";

  function resolveOwningFunctionId(
    nodeId: string,
    shapes: any[],
    connections: { fromShapeId: string; toShapeId: string }[]
  ): string | null {
    const byId = new Map(shapes.map((s) => [s.id, s] as const));

    // If the selected node IS a function block, it owns itself.
    const self = byId.get(nodeId);
    if (self?.logicTypeId === "fn/function") return nodeId;

    const visited = new Set<string>();
    const queue: string[] = [nodeId];

    while (queue.length) {
      const cur = queue.shift()!;
      if (visited.has(cur)) continue;
      visited.add(cur);

      const incoming = connections.filter((c) => c.toShapeId === cur);
      for (const edge of incoming) {
        const from = edge.fromShapeId;
        const fromShape = byId.get(from);
        if (fromShape?.logicTypeId === "fn/function") return fromShape.id;
        queue.push(from);
      }
    }
    return null;
  }

  const owningFnId = selectedShapeId
    ? resolveOwningFunctionId(selectedShapeId, shapes, connections)
    : null;

  const hasOwningFunction = !!owningFnId;
  const fnId = owningFnId ?? "fn_local";
  const fnStore = fnId === "fn_local" ? defaultStore : getStore(fnId);

  // Visible symbols for the selected node (params + upstream declarations)
  const visibleSymbols = useMemo(() => {
    if (!selectedShapeId) return [];

    const symbols = fnStore
      .getVisibleSymbols(selectedShapeId)
      .map((s: any) => s.name);

    // If this node is not connected to any function,
    // params must not be visible (even if fn_local has some).
    if (!hasOwningFunction) {
      const paramNames = new Set(defaultStore.getParameters());
      return symbols.filter((name) => !paramNames.has(name));
    }

    return symbols;
  }, [selectedShapeId, fnStore, version, hasOwningFunction, defaultStore]);

  // Current declarations (with sources)
  const declarations = useMemo(() => {
    if (!selectedShapeId || !isVariable) return [];
    return fnStore.getVariableDeclarations(selectedShapeId);
  }, [selectedShapeId, isVariable, fnStore, version]);

  const paramsText = useMemo(() => {
    return fnStore.getParameters().join("\n");
  }, [fnStore, version]);

  useEffect(() => {
    if (!selectedShapeId) return;

    if (isParam) {
      // If not connected to a function, don't load from fn_local.
      if (!hasOwningFunction) {
        setText("");
        return;
      }
      setText(paramsText);
      return;
    }

    if (!isVariable) {
      setText("");
      return;
    }

    const stmt: any = fnStore.getStatement(selectedShapeId);
    const names = (stmt?.declarations ?? []).map((d: any) => d.name);
    setText(names.join("\n"));
  }, [
    selectedShapeId,
    isVariable,
    isParam,
    fnStore,
    version,
    paramsText,
    hasOwningFunction,
  ]);

  if (!selectedShapeId) return null;

  return (
    <div className="absolute top-4 right-4 z-40 w-[340px] bg-white/90 backdrop-blur rounded-xl shadow p-3 text-xs">
      <div className="font-semibold mb-2">Inspector</div>

      <div className="text-[11px] text-gray-500 mb-2 break-all">
        {selectedLogicTypeId ?? "unknown"} · {selectedShapeId}
      </div>

      {isParam && !hasOwningFunction && (
        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2 mb-3">
          This Param node is not connected to a Function yet.
          <br />
          Connect it to a Function to edit that function’s parameters.
        </div>
      )}

      {isParam && (
        <div className="flex flex-col gap-3">
          <div className="font-medium">Parameters</div>
          <div className="text-[11px] text-gray-500">
            One per line. These are visible only inside the owning Function.
          </div>

          <textarea
            className="w-full h-32 rounded-md border p-2 text-xs font-mono"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"amount\nrate\ndays"}
            disabled={!hasOwningFunction}
          />

          <button
            className="rounded-md bg-blue-600 text-white text-xs py-2 disabled:opacity-50"
            disabled={!hasOwningFunction}
            onClick={() => {
              if (!hasOwningFunction) return;
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

              // ✅ ensure statement exists in the selected function store
              const existing = fnStore.getStatement(selectedShapeId);
              if (!existing) {
                fnStore.addStatementWithId("variable", selectedShapeId);
              }

              fnStore.setVariableDeclarations(selectedShapeId, names);
              bump();
            }}
          >
            Apply
          </button>

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

      {isFunction && (
        <div className="text-sm">
          Function editing comes next (name, signature, etc.).
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
