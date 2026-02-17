import { FibonacciPersistentStorage } from "../../../core/data/data_sources/FibonacciPersistentStorage";
import {
  FibonacciIndex,
  FibonacciNumbers,
  FibonacciResult,
} from "../../../core/entities/Fibonacci";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export class FibonacciInMemoryPeristentStorage implements FibonacciPersistentStorage {
  private map = new Map<number, FibonacciResult>();

  async findByIndex(index: FibonacciIndex): Promise<FibonacciNumbers | null> {
    await delay(100);

    const found = this.map.get(index.value);
    if (!found) return null;

    return new FibonacciNumbers(index, found);
  }

  async save(numbers: FibonacciNumbers): Promise<void> {
    await delay(100);
    this.map.set(numbers.index, new FibonacciResult(numbers.result));
  }

  async clearAll(): Promise<void> {
    await delay(100);
    this.map = new Map();
  }
}
