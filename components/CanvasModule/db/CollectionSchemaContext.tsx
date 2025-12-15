// CanvasModule/db/collections/DbCollectionContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CollectionSchema } from "./CollectionModule/CollectionSchema";
import { CollectionSchemaService } from "./CollectionModule/CollectionSchemaService";

type DbCollectionContextValue = {
  schema: CollectionSchema;
  service: CollectionSchemaService;
  refresh: () => void; // 👈 same “refresh thingy” as DbSchemaContext
};

const DbCollectionContext = createContext<DbCollectionContextValue | null>(
  null
);

export const DbCollectionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Shared domain instances
  const [schema] = useState(() => new CollectionSchema());
  const [service] = useState(
    () => new CollectionSchemaService(schema, () => crypto.randomUUID())
  );

  // Rerender trigger
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  const value = useMemo(
    () => ({ schema, service, refresh }),
    [schema, service, version]
  );

  return (
    <DbCollectionContext.Provider value={value}>
      {children}
    </DbCollectionContext.Provider>
  );
};

export function useDbCollectionContext(): DbCollectionContextValue {
  const ctx = useContext(DbCollectionContext);
  if (!ctx) {
    throw new Error(
      "useDbCollectionContext must be used within a DbCollectionProvider"
    );
  }
  return ctx;
}
