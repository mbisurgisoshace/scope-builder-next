// domain/model/Symbols.ts
import { StatementId } from "./ids";

export type SymbolKind = "param" | "variable";

export interface SymbolInfo {
  kind: SymbolKind;
  name: string;
  producedBy?: StatementId; // only for variables
}
