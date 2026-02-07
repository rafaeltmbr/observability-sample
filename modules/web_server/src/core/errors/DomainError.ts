export const domainErroTypes = [
  "fibonacci_non_integer_index",
  "fibonacci_non_positive_index",
  "fibonacci_non_integer_result",
  "fibonacci_negative_result",
] as const;

export type DomainErrorType = (typeof domainErroTypes)[number];

export class DomainError extends Error {
  private _type: DomainErrorType;

  constructor(type: DomainErrorType) {
    super(`DomainError "${type}"`);
    this._type = type;
  }

  public get type(): DomainErrorType {
    return this._type;
  }
}
