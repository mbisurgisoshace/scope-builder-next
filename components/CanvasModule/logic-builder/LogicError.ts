// logic/LogicErrors.ts

export class LogicDomainError extends Error {
  code: string;
  context?: Record<string, any>;

  constructor(code: string, message: string, context?: Record<string, any>) {
    super(message);
    this.code = code;
    this.context = context;
  }
}
