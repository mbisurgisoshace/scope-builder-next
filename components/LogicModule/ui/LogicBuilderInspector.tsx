"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useFunctionDomain } from "./FunctionProvider";

/**
 * Resolve the owning function node for any node by walking "incoming" edges.
 * If we ever reach a fn/function node, that's the function scope owner.
 */
function resolveOwningFunctionId(
  nodeId: string,
  shapes: any[],
  connections: { fromShapeId: string; toShapeId: string }[]
): string | null {
  const byId = new Map(shapes.map((s) => [s.id, s] as const));
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

function uniq(list: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of list) {
    const t = String(x ?? "").trim();
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export function LogicBuilderInspector({
  shapes,
  connections,
  selectedShapeId,
  selectedLogicTypeId,
}: {
  shapes: any[];
  connections: { fromShapeId: string; toShapeId: string }[];
  selectedShapeId: string | null;
  selectedLogicTypeId?: string | null;
}) {
  const { store: defaultStore, bump, version, getStore } = useFunctionDomain();
  const [text, setText] = useState("");

  const isFunction = selectedLogicTypeId === "fn/function";
  const isParam = selectedLogicTypeId === "fn/param";
  const isVariable = selectedLogicTypeId === "fn/var";
  const isLogic = selectedLogicTypeId === "fn/add";
  const isReturn = selectedLogicTypeId === "fn/return";

  /**
   * Pick the correct function store for the currently selected node.
   * - If the selected node IS the function node: it owns itself -> fnId = selectedShapeId
   * - Otherwise: walk incoming edges until we find fn/function
   * - Fallback: fn_local
   */
  const fnId = useMemo(() => {
    if (!selectedShapeId) return "fn_local";
    if (isFunction) return selectedShapeId;

    return (
      resolveOwningFunctionId(selectedShapeId, shapes, connections) ??
      "fn_local"
    );
  }, [selectedShapeId, isFunction, shapes, connections]);

  const fnStore = useMemo(() => {
    return fnId === "fn_local" ? defaultStore : getStore(fnId);
  }, [fnId, defaultStore, getStore]);

  /**
   * CRITICAL: Ensure the domain statement exists *inside the correct fnStore*
   * once a node becomes owned by a function.
   *
   * This fixes the "Apply does nothing" problem when:
   * - you drop a var node (statement created in default store / or not created),
   * - later connect it to a function,
   * - inspector switches to fnStore(functionId) and cannot find the statement.
   */
  useEffect(() => {
    if (!selectedShapeId) return;

    // Only statements need backing domain statements
    const needsStatement = isVariable || isLogic || isReturn;
    if (!needsStatement) return;

    // If it already exists in the current fnStore, do nothing
    const existing = fnStore.getStatement(selectedShapeId);
    if (existing) return;

    // Create it in the correct store (based on node type)
    try {
      if (isVariable) fnStore.addStatementWithId("variable", selectedShapeId);
      else if (isLogic) fnStore.addStatementWithId("logic", selectedShapeId);
      else if (isReturn) fnStore.addStatementWithId("return", selectedShapeId);

      bump();
    } catch (e) {
      console.warn("Failed to ensure statement in function store:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShapeId, fnStore, isVariable, isLogic, isReturn]);

  // Visible symbols for the selected node (scoped)
  const visibleSymbols = useMemo(() => {
    if (!selectedShapeId) return [];
    try {
      return fnStore.getVisibleSymbols(selectedShapeId).map((s: any) => s.name);
    } catch {
      return [];
    }
  }, [selectedShapeId, fnStore, version]);

  // Current declarations (with sources) for variable node
  const declarations = useMemo(() => {
    if (!selectedShapeId || !isVariable) return [];
    return fnStore.getVariableDeclarations(selectedShapeId);
  }, [selectedShapeId, isVariable, fnStore, version]);

  // Parameters text (for param editor UI)
  const paramsText = useMemo(() => {
    return fnStore.getParameters().join("\n");
  }, [fnStore, version]);

  /**
   * Function symbols:
   * - params in this function store
   * - ALL variable declaration names that exist in this function store
   *
   * Note: we intentionally do NOT include upstream-only filtering here;
   * this is "what exists in the function" (good for debugging).
   */
  const functionSymbols = useMemo(() => {
    if (!isFunction) return [];

    const params = fnStore.getParameters();

    const varDecls =
      fnStore
        .getStatements()
        .filter((s: any) => s.type === "variable")
        .flatMap((v: any) => (v.declarations ?? []).map((d: any) => d.name)) ??
      [];

    return uniq([...params, ...varDecls]);
  }, [isFunction, fnStore, version]);

  // Load text area content based on selected node type
  useEffect(() => {
    if (!selectedShapeId) return;

    if (isParam) {
      setText(paramsText);
      return;
    }

    if (isVariable) {
      const stmt: any = fnStore.getStatement(selectedShapeId);
      const names = (stmt?.declarations ?? []).map((d: any) => d.name);
      setText(names.join("\n"));
      return;
    }

    // Function / Logic / Return currently don't use the textarea
    setText("");
  }, [selectedShapeId, isParam, isVariable, fnStore, version, paramsText]);

  if (!selectedShapeId) return null;

  return (
    <div className="absolute top-4 right-4 z-40 w-[340px] bg-white/90 backdrop-blur rounded-xl shadow p-3 text-xs">
      <div className="font-semibold mb-2">Inspector</div>

      <div className="text-[11px] text-gray-500 mb-2 break-all">
        {selectedLogicTypeId ?? "unknown"} · {selectedShapeId}
      </div>

      {/* FUNCTION */}
      {isFunction && (
        <div className="flex flex-col gap-3">
          <div className="font-medium">Function scope</div>

          <div className="text-[11px] text-gray-500">
            Symbols available inside this function (params + variables).
          </div>

          <div className="rounded-md border bg-white p-2">
            {functionSymbols.length === 0 ? (
              <div className="text-[11px] text-gray-500">(none)</div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {functionSymbols.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-1 rounded-full border text-[11px] bg-gray-50"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="text-[11px] text-gray-500">
            Tip: params become available only when Param nodes belong to this
            function (connected by flow).
          </div>
        </div>
      )}

      {/* PARAM */}
      {isParam && (
        <div className="flex flex-col gap-3">
          <div className="font-medium">Parameters</div>
          <div className="text-[11px] text-gray-500">
            One per line. These are symbols available to nodes in this function.
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

      {/* VARIABLE */}
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

      {/* LOGIC */}
      {isLogic && (
        <div className="text-sm">
          Logic node editing comes next (simple assignment).
        </div>
      )}

      {/* RETURN */}
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
