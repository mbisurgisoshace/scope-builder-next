// logic-builder/function-domain/FunctionReturn.ts
import { FunctionDomainError, FunctionValueType, ReturnId } from "./types";

export interface FunctionReturnProps {
  id: ReturnId;
  name: string; // e.g. "result"
  type: FunctionValueType;
  description?: string;
}

export class FunctionReturn {
  id: ReturnId;
  name: string;
  type: FunctionValueType;
  description?: string;

  constructor(props: FunctionReturnProps) {
    const name = props.name?.trim();
    if (!name) {
      throw new FunctionDomainError(
        "RETURN_NAME_REQUIRED",
        "Return name cannot be empty."
      );
    }

    this.id = props.id;
    this.name = name;
    this.type = props.type ?? "any";
    this.description = props.description;
  }

  rename(newName: string) {
    const name = newName?.trim();
    if (!name) {
      throw new FunctionDomainError(
        "RETURN_NAME_REQUIRED",
        "Return name cannot be empty."
      );
    }
    this.name = name;
  }

  setType(type: FunctionValueType) {
    this.type = type ?? "any";
  }
}
