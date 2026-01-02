// domain/ids/ids.ts
export type EdgeId = string & { readonly __brand: "EdgeId" };
export type FunctionId = string & { readonly __brand: "FunctionId" };
export type StatementId = string & { readonly __brand: "StatementId" };

export function asEdgeId(v: string): EdgeId {
  return v as EdgeId;
}
export function asFunctionId(v: string): FunctionId {
  return v as FunctionId;
}
export function asStatementId(v: string): StatementId {
  return v as StatementId;
}
