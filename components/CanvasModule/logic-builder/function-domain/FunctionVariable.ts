// logic-builder/function-domain/FunctionVariable.ts
import { FunctionDomainError, FunctionValueType, VariableId } from "./types";

export interface FunctionVariableProps {
  id: VariableId;
  name: string;
  description?: string;
  type: FunctionValueType;
}

export class FunctionVariable {
  id: VariableId;
  name: string;
  description?: string;
  type: FunctionValueType;

  constructor(props: FunctionVariableProps) {
    const name = props.name?.trim();
    if (!name) {
      throw new FunctionDomainError(
        "VAR_NAME_REQUIRED",
        "Variable name cannot be empty."
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
        "VAR_NAME_REQUIRED",
        "Variable name cannot be empty."
      );
    }
    this.name = name;
  }

  setType(type: FunctionValueType) {
    this.type = type ?? "any";
  }
}
