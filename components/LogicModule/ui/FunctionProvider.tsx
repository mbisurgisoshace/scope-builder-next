"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { FunctionStore } from "../application/FunctionStore";
// adjust path

type Ctx = {
  store: FunctionStore;
  version: number;
  bump: () => void;
};

const C = createContext<Ctx | null>(null);

export function FunctionDomainProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = useMemo(() => new FunctionStore(), []);
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

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
