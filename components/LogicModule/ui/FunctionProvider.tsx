"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { FunctionStore, FunctionSnapshot } from "../application/FunctionStore";
import { FunctionDefinition } from "../domain/model/FunctionDefinition";
import { asFunctionId } from "../domain/model/ids";

type MultiFnSnapshot = {
  version: 1;
  functions: Record<string, FunctionSnapshot>;
};

type Ctx = {
  store: FunctionStore; // default / legacy store (fn_local)
  getStore: (fnId: string) => FunctionStore;
  version: number;
  bump: () => void;
};

const C = createContext<Ctx | null>(null);

const STORAGE_KEY = "logicbuilder:functions:v1";

export function FunctionDomainProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  const storesRef = useRef(new Map<string, FunctionStore>());

  // Prevent saving an empty initial state before hydrate
  const [hydrated, setHydrated] = useState(false);

  const getStore = useCallback((fnId: string) => {
    const map = storesRef.current;
    const existing = map.get(fnId);
    if (existing) return existing;

    const created = new FunctionStore(
      new FunctionDefinition({
        id: asFunctionId(fnId),
        name: "UntitledFunction",
      })
    );

    map.set(fnId, created);
    return created;
  }, []);

  // Default store for backward compatibility
  const store = useMemo(() => getStore("fn_local"), [getStore]);

  // 1) Hydrate once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MultiFnSnapshot;

        if (parsed?.version === 1 && parsed.functions) {
          for (const [fnId, fnSnap] of Object.entries(parsed.functions)) {
            const s = getStore(fnId);
            s.hydrate(fnSnap);
          }
          // force UI refresh
          setVersion((v) => v + 1);
        }
      }
    } catch (e) {
      console.warn("Failed to hydrate LogicBuilder snapshot:", e);
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Persist on every version change (after hydration)
  useEffect(() => {
    if (!hydrated) return;

    try {
      const out: MultiFnSnapshot = {
        version: 1,
        functions: {},
      };

      for (const [fnId, s] of storesRef.current.entries()) {
        out.functions[fnId] = s.serialize();
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
    } catch (e) {
      console.warn("Failed to persist LogicBuilder snapshot:", e);
    }
  }, [version, hydrated]);

  return (
    <C.Provider value={{ store, getStore, version, bump }}>
      {children}
    </C.Provider>
  );
}

export function useFunctionDomain() {
  const ctx = useContext(C);
  if (!ctx)
    throw new Error(
      "useFunctionDomain must be used inside FunctionDomainProvider"
    );
  return ctx;
}
