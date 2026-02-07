import { FibonacciCache } from "../../../core/data/data_sources/FibonacciCache";
import {
  FibonacciIndex,
  FibonacciNumbers,
  FibonacciResult,
} from "../../../core/entities/Fibonacci";

export class FibonacciInMemoryCache implements FibonacciCache {
  private data = new Map<number, CachedResult>();

  constructor(private expireInMs: number) {
    this.validate();
  }

  private validate() {
    ExporiationTime.validate(this.expireInMs);
  }

  async findByIndex(index: FibonacciIndex): Promise<FibonacciNumbers | null> {
    const cached = this.data.get(index.value);
    if (!cached) return null;

    if (cached.isExpired) {
      this.data.delete(index.value);
    }

    return new FibonacciNumbers(index, cached.value);
  }

  async save(numbers: FibonacciNumbers): Promise<void> {
    const cached = new CachedResult(
      new FibonacciResult(numbers.result),
      new ExporiationTime(this.expireInMs),
    );

    this.data.set(numbers.index, cached);
  }

  async clearAll(): Promise<void> {
    this.data = new Map();
  }
}

class CachedResult {
  private _result: FibonacciResult;

  constructor(
    result: FibonacciResult,
    private expirationTime: ExporiationTime,
  ) {
    this._result = result;
  }

  get value(): FibonacciResult {
    return this._result;
  }

  get isExpired(): boolean {
    return this.expirationTime.isExpired();
  }
}

class ExporiationTime {
  private date: Date;

  constructor(expireInMs: number) {
    ExporiationTime.validate(expireInMs);
    this.date = new Date(Date.now() + expireInMs);
  }

  static validate(ms: number) {
    if (!Number.isInteger(ms)) {
      throw new Error("Mocked cache expiration time must be an integer.");
    }

    if (ms < 0) {
      throw new Error(
        "Mocked cache expiration time must be a positive number.",
      );
    }
  }

  isExpired(): boolean {
    return this.date.getTime() < Date.now();
  }
}
