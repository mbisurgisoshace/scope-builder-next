// logic-builder/function-domain/FunctionParam.ts
import { FunctionDomainError, FunctionValueType, ParamId } from "./types";

export interface FunctionParamProps {
  id: ParamId;
  name: string;
  description?: string;
  type: FunctionValueType;
}

export class FunctionParam {
  id: ParamId;
  name: string;
  description?: string;
  type: FunctionValueType;

  constructor(props: FunctionParamProps) {
    const name = props.name?.trim();
    if (!name) {
      throw new FunctionDomainError(
        "PARAM_NAME_REQUIRED",
        "Param name cannot be empty."
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
        "PARAM_NAME_REQUIRED",
        "Param name cannot be empty."
      );
    }
    this.name = name;
  }

  setType(type: FunctionValueType) {
    this.type = type ?? "any";
  }
}
