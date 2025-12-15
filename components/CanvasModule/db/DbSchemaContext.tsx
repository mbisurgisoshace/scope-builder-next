// components/CanvasModule/db/DbSchemaContext.tsx

"use client";

import React, {
  useMemo,
  useState,
  useContext,
  createContext,
  PropsWithChildren,
} from "react";

import { SqlSchema } from "./SqlModule/SqlSchema";
import { DbSchemaService } from "./SqlModule/SqlSchemaService";

// You can swap this for uuidv4 if you prefer
const genId = () => crypto.randomUUID();

export interface DbSchemaContextValue {
  schema: SqlSchema;
  service: DbSchemaService;
  refresh: () => void;
}

const DbSchemaContext = createContext<DbSchemaContextValue | null>(null);

export function DbSchemaProvider({ children }: PropsWithChildren) {
  // single SqlSchema instance per app
  const [schema] = useState(() => new SqlSchema());
  // used just to force re-renders when schema mutates
  const [version, setVersion] = useState(0);

  const service = useMemo(() => new DbSchemaService(schema, genId), [schema]);

  const refresh = () => setVersion((v) => v + 1);

  const value = useMemo(
    () => ({ schema, service, refresh }),
    [schema, service, version] // version forces new object
  );

  return (
    <DbSchemaContext.Provider value={value}>
      {children}
    </DbSchemaContext.Provider>
  );
}

export function useDbSchema() {
  const ctx = useContext(DbSchemaContext);
  if (!ctx) {
    throw new Error("useDbSchema must be used inside DbSchemaProvider");
  }
  return ctx;
}
