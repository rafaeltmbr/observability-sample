import {
  FibonacciIndex,
  FibonacciNumbers,
  FibonacciResult,
} from "../../core/entities/Fibonacci";
import { FibonacciService } from "../../core/services/FibonacciService";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export class FibonacciMockedService implements FibonacciService {
  async calculate(index: FibonacciIndex): Promise<FibonacciNumbers> {
    await delay(1_000);
    return new FibonacciNumbers(index, new FibonacciResult(index.value));
  }
}
