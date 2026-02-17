import { FibonacciIndex, FibonacciNumbers } from "../entities/Fibonacci";

export interface FibonacciService {
  calculate(index: FibonacciIndex): Promise<FibonacciNumbers>;
}
