export const infraErroTypes = ["fibonacci_response_timeout"] as const;

export type InfraErrorType = (typeof infraErroTypes)[number];

export class InfraError extends Error {
  private _type: InfraErrorType;

  constructor(type: InfraErrorType) {
    super(`InfraError "${type}"`);
    this._type = type;
  }

  public get type(): InfraErrorType {
    return this._type;
  }
}
