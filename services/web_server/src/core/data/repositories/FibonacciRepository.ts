import { FibonacciIndex, FibonacciNumbers } from "../../entities/Fibonacci";

export interface FibonacciRepository {
  findByIndex(index: FibonacciIndex): Promise<FibonacciNumbers | null>;
  save(numbers: FibonacciNumbers): Promise<void>;
  clearAll(): Promise<void>;
}
