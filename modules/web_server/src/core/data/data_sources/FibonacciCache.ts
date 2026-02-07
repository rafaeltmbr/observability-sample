import { FibonacciIndex, FibonacciNumbers } from "../../entities/Fibonacci";

export interface FibonacciCache {
  findByIndex(index: FibonacciIndex): Promise<FibonacciNumbers | null>;
  save(numbers: FibonacciNumbers): Promise<void>;
  clearAll(): Promise<void>;
}
