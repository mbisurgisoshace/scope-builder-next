// logic-builder/function-domain/types.ts

export type FunctionId = string;

export type FunctionValueType =
  | "any"
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "array";

export type ParamId = string;
export type VariableId = string;
export type ReturnId = string;

export class FunctionDomainError extends Error {
  readonly code: string;
  readonly details?: Record<string, any>;

  constructor(code: string, message: string, details?: Record<string, any>) {
    super(message);
    this.name = "FunctionDomainError";
    this.code = code;
    this.details = details;
  }
}

export const FN_NODE_TYPES = {
  PARAM: "fn/param",
  VAR: "fn/var",
  RETURN: "fn/return",
  ADD: "fn/add", // fixed operation for now
  // later:
  // LOOP: "fn/loop",
} as const;

export type FnNodeTypeId = (typeof FN_NODE_TYPES)[keyof typeof FN_NODE_TYPES];

export type ParamNodeConfig = {
  paramId: ParamId;
};

export type VarNodeConfig = {
  variableId: VariableId;
};

export type ReturnNodeConfig = {
  returnId: ReturnId;
};

export type AddNodeConfig = {
  // no extra config needed for fixed add for now
  // later could include "mode" or "coerce" etc.
};
