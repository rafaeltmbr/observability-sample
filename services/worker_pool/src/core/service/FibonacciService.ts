import {
  FibonacciIndex,
  FibonacciNumbers,
  FibonacciResult,
} from "../entities/Fibonacci";

export class FibonacciService {
  async execute(index: FibonacciIndex): Promise<FibonacciNumbers> {
    const result = new FibonacciResult(FibonacciService.fib(index.value));
    return new FibonacciNumbers(index, result);
  }

  private static fib(n: number): number {
    if (n <= 1) return n;

    return FibonacciService.fib(n - 1) + FibonacciService.fib(n - 2);
  }
}
