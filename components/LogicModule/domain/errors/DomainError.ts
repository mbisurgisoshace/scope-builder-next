// domain/errors/DomainError.ts
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class InvariantError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvariantError";
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
