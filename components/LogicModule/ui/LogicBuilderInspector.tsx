"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useFunctionDomain } from "./FunctionProvider";
import { Value } from "../domain/model/ValueSource";

/** --- helpers (UI-side) --- */
function coerceLiteral(input: string): unknown {
  const s = input.trim();
  if (!s) return "";

  // Try JSON array literal first: [1, 2, 3] or ["a","b"]
  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        // Optionally auto-coerce numeric-looking items
        return parsed.map((item) => {
          if (typeof item === "string") {
            const t = item.trim();
            if (t !== "" && Number.isFinite(Number(t))) {
              return Number(t);
            }
          }
          return item;
        });
      }
    } catch {
      // fall through to number/string
    }
  }

  // number?
  const n = Number(s);
  if (Number.isFinite(n) && s !== "") return n;

  // otherwise keep as string
  return input;
}

/**
 * Walk backwards via incoming edges until we hit a fn/function node.
 * Returns the owning function shape id or null.
 */
function resolveOwningFunctionId(
  nodeId: string,
  shapes: any[],
  connections: { fromShapeId: string; toShapeId: string }[],
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

  const isFunction = selectedLogicTypeId === "fn/function";
  const isVariable = selectedLogicTypeId === "fn/var";
  const isReturn = selectedLogicTypeId === "fn/return";
  const isLogic = selectedLogicTypeId === "fn/add";
  const isParam = selectedLogicTypeId === "fn/param";

  /** pick store based on owning function */
  const fnId = useMemo(() => {
    if (!selectedShapeId) return "fn_local";
    return (
      resolveOwningFunctionId(selectedShapeId, shapes, connections) ??
      "fn_local"
    );
  }, [selectedShapeId, shapes, connections]);

  const fnStore = useMemo(() => {
    return fnId === "fn_local" ? defaultStore : getStore(fnId);
  }, [fnId, defaultStore, getStore]);

  const [text, setText] = useState("");

  /** Visible symbols for the selected node (scoped store) */
  const visibleSymbols = useMemo(() => {
    if (!selectedShapeId) return [];
    return fnStore.getVisibleSymbols(selectedShapeId).map((s: any) => s.name);
  }, [selectedShapeId, fnStore, version]);

  /** Params in this function (names) */
  const paramNames = useMemo(() => {
    return fnStore.getParameters();
  }, [fnStore, version]);

  /** For logic targets: prefer non-param symbols */
  const variableSymbolCandidates = useMemo(() => {
    const set = new Set(paramNames);
    return visibleSymbols.filter((s) => !set.has(s));
  }, [visibleSymbols, paramNames]);

  /** Variable declarations (with sources) */
  const declarations = useMemo(() => {
    if (!selectedShapeId || !isVariable) return [];
    return fnStore.getVariableDeclarations(selectedShapeId);
  }, [selectedShapeId, isVariable, fnStore, version]);

  /** --- Logic node editor state (simple assignment v1) --- */
  const [logicTarget, setLogicTarget] = useState("");
  const [logicKind, setLogicKind] = useState<"literal" | "symbolRef">(
    "literal",
  );
  const [logicLiteral, setLogicLiteral] = useState<string>("0");
  const [logicRef, setLogicRef] = useState<string>("");

  /** Logic mode: simple assignment vs reduceEach */
  const [logicMode, setLogicMode] = useState<"simple" | "reduceEach">("simple");

  /** reduceEach config state */
  const [reduceInputArray, setReduceInputArray] = useState<string>("");
  const [reduceItemVar, setReduceItemVar] = useState<string>("item");
  const [reduceAccVar, setReduceAccVar] = useState<string>("");
  const [reduceInitialExpr, setReduceInitialExpr] = useState<string>("0");
  const [reduceBodyExpr, setReduceBodyExpr] = useState<string>("");

  /** Sync textarea for variable/param, and sync logic editor state for fn/add */
  useEffect(() => {
    if (!selectedShapeId) return;

    // PARAM editor: simple list (one per line)
    if (isParam) {
      setText(fnStore.getParameters().join("\n"));
      return;
    }

    // VARIABLE editor: list declarations (one per line)
    if (isVariable) {
      const stmt: any = fnStore.getStatement(selectedShapeId);
      const names = (stmt?.declarations ?? []).map((d: any) => d.name);
      setText(names.join("\n"));
      return;
    }

    // LOGIC editor: either "simple assignment" or "reduceEach" config
    if (isLogic) {
      const stmt: any = fnStore.getStatement(selectedShapeId);
      const cfg = stmt?.reduceEachConfig ?? null;

      if (cfg) {
        // ---- reduceEach mode ----
        setLogicMode("reduceEach");

        setReduceInputArray(cfg.inputArray ?? "");
        setReduceItemVar(cfg.itemVar ?? "item");
        setReduceAccVar(cfg.accVar ?? "");
        setReduceInitialExpr(cfg.initialExpr ?? "0");
        setReduceBodyExpr(cfg.bodyExpr ?? "");

        // Clear simple-logic UI state (not used in this mode)
        setLogicTarget("");
        setLogicKind("literal");
        setLogicLiteral("0");
        setLogicRef("");
      } else {
        // ---- simple assignment mode ----
        setLogicMode("simple");

        const a = fnStore.getLogicAssignment?.(selectedShapeId) ?? null;

        if (a) {
          setLogicTarget(a.target ?? "");
          if (a.expr?.kind === "symbolRef") {
            setLogicKind("symbolRef");
            setLogicRef(a.expr.name ?? "");
            setLogicLiteral("0");
          } else {
            setLogicKind("literal");
            setLogicLiteral(String(a.expr?.value ?? ""));
            setLogicRef("");
          }
        } else {
          // defaults
          setLogicTarget(variableSymbolCandidates[0] ?? "");
          setLogicKind("literal");
          setLogicLiteral("0");
          setLogicRef(visibleSymbols[0] ?? "");
        }
      }

      setText("");
      return;
    }

    // everything else
    setText("");
  }, [
    selectedShapeId,
    isParam,
    isVariable,
    isLogic,
    fnStore,
    version,
    variableSymbolCandidates,
    visibleSymbols,
  ]);

  if (!selectedShapeId) return null;

  return (
    <div className="absolute top-4 right-4 z-40 w-[360px] bg-white/90 backdrop-blur rounded-xl shadow p-3 text-xs">
      <div className="font-semibold mb-2">Inspector</div>

      <div className="text-[11px] text-gray-500 mb-2 break-all">
        {selectedLogicTypeId ?? "unknown"} · {selectedShapeId} · store: {fnId}
      </div>

      {isFunction && (
        <div className="text-sm">
          Function node selected. (Editing name next — or whenever you say
          “go”.)
        </div>
      )}

      {isParam && (
        <div className="flex flex-col gap-3">
          <div className="font-medium">Parameters</div>
          <div className="text-[11px] text-gray-500">
            One per line. Visible only inside this function’s graph.
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
            One per line. These become visible downstream (within this
            function).
          </div>

          <textarea
            className="w-full h-32 rounded-md border p-2 text-xs font-mono"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"total\nnet\nfee"}
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
                        next,
                      );
                      bump();
                      console.log(fnStore.computeRuntimeValues());
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isLogic && (
        <div className="flex flex-col gap-3">
          <div className="font-medium">Logic node</div>

          {/* Mode selector */}
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-gray-600">Mode:</span>
            <button
              className={`px-2 py-1 rounded border text-xs ${
                logicMode === "simple"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
              onClick={() => setLogicMode("simple")}
            >
              Simple
            </button>
            <button
              className={`px-2 py-1 rounded border text-xs ${
                logicMode === "reduceEach"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
              onClick={() => setLogicMode("reduceEach")}
            >
              ForEach / Reduce
            </button>
          </div>

          {logicMode === "simple" ? (
            <>
              <div className="text-[11px] text-gray-500">
                Assign a literal or a reference to a target variable.
              </div>

              <div className="grid grid-cols-[90px_1fr] gap-2 items-center">
                <div className="text-[11px] text-gray-600">Target</div>

                {variableSymbolCandidates.length > 0 ? (
                  <select
                    className="border rounded-md px-2 py-1 text-xs"
                    value={logicTarget}
                    onChange={(e) => setLogicTarget(e.target.value)}
                  >
                    <option value="" disabled>
                      Select variable…
                    </option>
                    {variableSymbolCandidates.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="border rounded-md px-2 py-1 text-xs"
                    value={logicTarget}
                    onChange={(e) => setLogicTarget(e.target.value)}
                    placeholder="e.g. total"
                  />
                )}
              </div>

              <div className="grid grid-cols-[90px_1fr] gap-2 items-center">
                <div className="text-[11px] text-gray-600">Expr kind</div>

                <select
                  className="border rounded-md px-2 py-1 text-xs"
                  value={logicKind}
                  onChange={(e) => setLogicKind(e.target.value as any)}
                >
                  <option value="literal">literal</option>
                  <option value="symbolRef">ref</option>
                </select>
              </div>

              {logicKind === "literal" ? (
                <div className="grid grid-cols-[90px_1fr] gap-2 items-center">
                  <div className="text-[11px] text-gray-600">Literal</div>
                  <input
                    className="border rounded-md px-2 py-1 text-xs"
                    value={logicLiteral}
                    onChange={(e) => setLogicLiteral(e.target.value)}
                    placeholder="e.g. 100"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-[90px_1fr] gap-2 items-center">
                  <div className="text-[11px] text-gray-600">Ref</div>
                  <select
                    className="border rounded-md px-2 py-1 text-xs"
                    value={logicRef}
                    onChange={(e) => setLogicRef(e.target.value)}
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
                </div>
              )}

              <div className="text-[11px] text-gray-500">
                Tip: typing <span className="font-mono">123</span> becomes
                number <span className="font-mono">123</span>.
              </div>
            </>
          ) : (
            <>
              <div className="text-[11px] text-gray-500">
                Iterate over an array symbol and accumulate into a target
                variable using an expression.
              </div>

              {/* Input array symbol */}
              <div className="grid grid-cols-[110px_1fr] gap-2 items-center">
                <div className="text-[11px] text-gray-600">Input array</div>
                <select
                  className="border rounded-md px-2 py-1 text-xs"
                  value={reduceInputArray}
                  onChange={(e) => setReduceInputArray(e.target.value)}
                >
                  <option value="">Select symbol…</option>
                  {visibleSymbols.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Item variable name */}
              <div className="grid grid-cols-[110px_1fr] gap-2 items-center">
                <div className="text-[11px] text-gray-600">Item variable</div>
                <input
                  className="border rounded-md px-2 py-1 text-xs font-mono"
                  value={reduceItemVar}
                  onChange={(e) => setReduceItemVar(e.target.value)}
                  placeholder="e.g. item"
                />
              </div>

              {/* Accumulator variable name */}
              <div className="grid grid-cols-[110px_1fr] gap-2 items-center">
                <div className="text-[11px] text-gray-600">
                  Accumulator symbol
                </div>
                <input
                  className="border rounded-md px-2 py-1 text-xs font-mono"
                  value={reduceAccVar}
                  onChange={(e) => setReduceAccVar(e.target.value)}
                  placeholder="e.g. total"
                />
              </div>

              {/* Initial expression */}
              <div className="grid grid-cols-[110px_1fr] gap-2 items-center">
                <div className="text-[11px] text-gray-600">Initial expr</div>
                <input
                  className="border rounded-md px-2 py-1 text-xs font-mono"
                  value={reduceInitialExpr}
                  onChange={(e) => setReduceInitialExpr(e.target.value)}
                  placeholder="e.g. 0"
                />
              </div>

              {/* Body expression */}
              <div className="grid grid-cols-[110px_1fr] gap-2 items-center">
                <div className="text-[11px] text-gray-600">Body expr</div>
                <input
                  className="border rounded-md px-2 py-1 text-xs font-mono"
                  value={reduceBodyExpr}
                  onChange={(e) => setReduceBodyExpr(e.target.value)}
                  placeholder="e.g. acc + item"
                />
              </div>

              <div className="text-[11px] text-gray-500">
                At runtime:{" "}
                <span className="font-mono">{reduceAccVar || "acc"}</span>{" "}
                starts at{" "}
                <span className="font-mono">{reduceInitialExpr || "0"}</span>{" "}
                and for each element of{" "}
                <span className="font-mono">{reduceInputArray || "array"}</span>{" "}
                we evaluate{" "}
                <span className="font-mono">
                  {reduceBodyExpr || "acc + item"}
                </span>
                .
              </div>
            </>
          )}

          <button
            className="rounded-md bg-blue-600 text-white text-xs py-2"
            onClick={() => {
              const stmt: any = fnStore.getStatement(selectedShapeId);
              if (!stmt || stmt.type !== "logic") return;

              if (logicMode === "reduceEach") {
                const inputArray = reduceInputArray.trim();
                const itemVar = (reduceItemVar || "item").trim();
                const accVar = reduceAccVar.trim();
                const initialExpr = (reduceInitialExpr || "0").trim();
                const bodyExpr = reduceBodyExpr.trim();

                if (!inputArray || !accVar || !bodyExpr) {
                  // super simple guard; later we can surface a nicer error
                  return;
                }

                stmt.reduceEachConfig = {
                  inputArray,
                  itemVar,
                  accVar,
                  initialExpr,
                  bodyExpr,
                };

                // In reduceEach mode, we can ignore simple assignments
                bump();
                return;
              }

              // ---- simple assignment mode ----
              const target = logicTarget.trim();
              if (!target) return;

              const expr =
                logicKind === "symbolRef"
                  ? { kind: "symbolRef" as const, name: logicRef }
                  : {
                      kind: "literal" as const,
                      value: coerceLiteral(logicLiteral),
                    };

              // Clear any reduceEach config when using simple mode
              if (stmt) {
                stmt.reduceEachConfig = undefined;
              }

              fnStore.setLogicAssignment(selectedShapeId, { target, expr });
              bump();
            }}
          >
            Apply
          </button>
        </div>
      )}

      {isReturn && (
        <ReturnEditor
          key={`${selectedShapeId}:${version}`}
          statementId={selectedShapeId}
          fnStore={fnStore}
          bump={bump}
          visibleSymbols={visibleSymbols}
        />
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
      | { kind: "expression"; expr: string },
  ) => void;
}) {
  const kind: "literal" | "symbolRef" | "expression" =
    source?.kind === "symbolRef"
      ? "symbolRef"
      : source?.kind === "expression"
        ? "expression"
        : "literal";

  // Show arrays/objects as JSON so they round-trip nicely
  const literalValue =
    source?.kind === "literal"
      ? Array.isArray(source.value) || typeof source.value === "object"
        ? JSON.stringify(source.value)
        : (source.value ?? "")
      : "";

  const symbolName = source?.kind === "symbolRef" ? (source.name ?? "") : "";
  const exprText = source?.kind === "expression" ? (source.expr ?? "") : "";

  return (
    <div className="grid grid-cols-[1fr_105px_1fr] gap-2 items-center">
      <div className="font-mono text-xs truncate" title={name}>
        {name}
      </div>

      <select
        className="border rounded-md px-2 py-1 text-xs"
        value={kind}
        onChange={(e) => {
          const nextKind = e.target.value as typeof kind;

          if (nextKind === "literal") {
            onChange({ kind: "literal", value: "" });
            return;
          }

          if (nextKind === "symbolRef") {
            onChange({ kind: "symbolRef", name: visibleSymbols[0] ?? "" });
            return;
          }

          onChange({ kind: "expression", expr: "" });
        }}
      >
        <option value="literal">literal</option>
        <option value="symbolRef">ref</option>
        <option value="expression">expr</option>
      </select>

      {kind === "literal" ? (
        <input
          className="border rounded-md px-2 py-1 text-xs"
          value={String(literalValue)}
          onChange={(e) =>
            onChange({
              kind: "literal",
              value: coerceLiteral(e.target.value), // 👈 parse numbers & arrays
            })
          }
          placeholder="e.g. 100 or [1,2,3,4]"
        />
      ) : kind === "symbolRef" ? (
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
      ) : (
        <input
          className="border rounded-md px-2 py-1 text-xs font-mono"
          value={String(exprText)}
          onChange={(e) =>
            onChange({ kind: "expression", expr: e.target.value })
          }
          placeholder="e.g. subtotal * 5"
        />
      )}
    </div>
  );
}

function ReturnEditor({
  statementId,
  fnStore,
  bump,
  visibleSymbols,
}: {
  statementId: string;
  fnStore: any;
  bump: () => void;
  visibleSymbols: string[];
}) {
  const [kind, setKind] = useState<"literal" | "symbolRef" | "expression">(
    "literal",
  );
  const [literal, setLiteral] = useState<string>("");
  const [symbol, setSymbol] = useState<string>("");
  const [expr, setExpr] = useState<string>("");

  // Load current return source on mount/changes
  useEffect(() => {
    const src = fnStore.getReturnSource(statementId);
    if (!src) return;

    if (src.kind === "literal") {
      setKind("literal");
      setLiteral(src.value == null ? "" : String(src.value));
      return;
    }

    if (src.kind === "symbolRef") {
      setKind("symbolRef");
      setSymbol(src.name ?? "");
      return;
    }

    if (src.kind === "expression") {
      setKind("expression");
      setExpr(src.expr ?? "");
      return;
    }
  }, [statementId, fnStore]);

  return (
    <div className="flex flex-col gap-3">
      <div className="font-medium">Return</div>
      <div className="text-[11px] text-gray-500">
        Choose a value to return (within this function and upstream scope).
      </div>

      <div className="grid grid-cols-[105px_1fr] gap-2 items-center">
        <select
          className="border rounded-md px-2 py-1 text-xs"
          value={kind}
          onChange={(e) => setKind(e.target.value as any)}
        >
          <option value="literal">literal</option>
          <option value="symbolRef">ref</option>
          <option value="expression">expression</option>
        </select>

        {kind === "literal" && (
          <input
            className="border rounded-md px-2 py-1 text-xs"
            value={literal}
            onChange={(e) => setLiteral(e.target.value)}
            placeholder="e.g. 500"
          />
        )}

        {kind === "symbolRef" && (
          <select
            className="border rounded-md px-2 py-1 text-xs"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
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

        {kind === "expression" && (
          <input
            className="border rounded-md px-2 py-1 text-xs font-mono"
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            placeholder="e.g. subtotal * 5"
          />
        )}
      </div>

      <button
        className="rounded-md bg-blue-600 text-white text-xs py-2"
        onClick={() => {
          // if (kind === "literal") {
          //   // auto-coerce numeric
          //   const n = Number(literal);
          //   const v = literal.trim() !== "" && Number.isFinite(n) ? n : literal;
          //   fnStore.setReturnSource(statementId, Value.literal(v));
          // } else if (kind === "symbolRef") {
          //   fnStore.setReturnSource(statementId, Value.ref(symbol));
          // } else {
          //   fnStore.setReturnSource(statementId, Value.expr(expr));
          // }
          if (kind === "literal") {
            const n = Number(literal);
            const v = literal.trim() !== "" && Number.isFinite(n) ? n : literal;
            fnStore.setReturnSource(statementId, Value.literal(v));
          } else if (kind === "symbolRef") {
            fnStore.setReturnSource(statementId, Value.ref(symbol));
          } else {
            const raw = expr.trim();
            const isIdent = /^[A-Za-z_][A-Za-z0-9_]*$/.test(raw);

            if (isIdent && visibleSymbols.includes(raw)) {
              fnStore.setReturnSource(statementId, Value.ref(raw));
            } else {
              fnStore.setReturnSource(statementId, Value.expr(raw));
            }
          }
          bump();
        }}
      >
        Apply
      </button>
    </div>
  );
}
