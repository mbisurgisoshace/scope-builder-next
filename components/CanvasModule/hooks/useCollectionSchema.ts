// CanvasModule/db/collections/useCollectionSchema.ts
"use client";

import { useCallback, useMemo, useState } from "react";
import { CollectionSchema } from "../db/CollectionModule/CollectionSchema";
import { CollectionSchemaService } from "../db/CollectionModule/CollectionSchemaService";

// Very small hook that owns a single in-memory CollectionSchema for now
export function useCollectionSchema() {
  // schema + service are created once
  const [schema] = useState(() => new CollectionSchema());
  const [service] = useState(
    () => new CollectionSchemaService(schema, () => crypto.randomUUID())
  );

  // force re-render when domain changes
  const [, setVersion] = useState(0);
  const bump = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  return useMemo(
    () => ({
      schema,
      service,
      bump,
    }),
    [schema, service, bump]
  );
}
