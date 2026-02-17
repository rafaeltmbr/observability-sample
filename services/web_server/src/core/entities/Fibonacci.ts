import { DomainError } from "../errors/DomainError";

export class FibonacciNumbers {
  private _index: FibonacciIndex;
  private _result: FibonacciResult;

  constructor(index: FibonacciIndex, result: FibonacciResult) {
    this._index = index;
    this._result = result;
  }

  public get index(): number {
    return this._index.value;
  }

  public get result(): number {
    return this._result.value;
  }
}

export class FibonacciIndex {
  private _value: number;

  constructor(value: number) {
    this._value = value;
    this.validate();
  }

  private validate() {
    if (!Number.isInteger(this.value)) {
      throw new DomainError("fibonacci_non_integer_index");
    }

    if (this.value <= 0) {
      throw new DomainError("fibonacci_non_positive_index");
    }
  }

  public get value(): number {
    return this._value;
  }
}

export class FibonacciResult {
  private _value: number;

  constructor(value: number) {
    this._value = value;
    this.validate();
  }

  private validate() {
    if (!Number.isInteger(this.value)) {
      throw new DomainError("fibonacci_non_integer_result");
    }

    if (this.value < 0) {
      throw new DomainError("fibonacci_negative_result");
    }
  }

  public get value(): number {
    return this._value;
  }
}
