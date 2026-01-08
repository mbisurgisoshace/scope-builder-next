"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { FunctionStore } from "../application/FunctionStore";

type Ctx = {
  store: FunctionStore;
  version: number;
  bump: () => void;
};

const C = createContext<Ctx | null>(null);

const STORAGE_KEY = "logicbuilder:function:v1";

export function FunctionDomainProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = useMemo(() => new FunctionStore(), []);
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  // Prevent saving an empty initial store before we try to hydrate
  const [hydrated, setHydrated] = useState(false);

  // 1) Hydrate once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const snapshot = JSON.parse(raw);
        store.hydrate(snapshot);
        // force a re-render so inspector/debug picks up hydrated state
        setVersion((v) => v + 1);
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
      const snap = store.serialize();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
    } catch (e) {
      console.warn("Failed to persist LogicBuilder snapshot:", e);
    }
  }, [version, hydrated, store]);

  return <C.Provider value={{ store, version, bump }}>{children}</C.Provider>;
}

export function useFunctionDomain() {
  const ctx = useContext(C);
  if (!ctx)
    throw new Error(
      "useFunctionDomain must be used inside FunctionDomainProvider"
    );
  return ctx;
}
