// db/collections/CollectionTypes.ts

/** Scalar + composite field types for a document DB */
export type CollectionFieldType =
  | "string"
  | "number"
  | "boolean"
  | "timestamp"
  | "object"
  | "array";

/**
 * Path to a nested field inside a collection:
 * [] = top level (invalid for concrete operations),
 * ["user"] = field "user" on collection,
 * ["user", "address"] = nested "address" field inside "user" object, etc.
 */
export type FieldPath = string[];

/** Basic domain error for collections (you can swap to your global DomainError later). */
export class CollectionDomainError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "CollectionDomainError";
  }
}
