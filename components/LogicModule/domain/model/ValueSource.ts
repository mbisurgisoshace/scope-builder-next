// domain/model/ValueSource.ts
export type ValueSource =
  | { kind: "literal"; value: unknown }
  | { kind: "symbolRef"; name: string }
  | { kind: "expression"; expr: string };

// Helpers (optional)
export const Value = {
  literal(value: unknown): ValueSource {
    return { kind: "literal", value };
  },
  ref(name: string): ValueSource {
    return { kind: "symbolRef", name };
  },
  expr(expr: string): ValueSource {
    return { kind: "expression", expr };
  },
};
