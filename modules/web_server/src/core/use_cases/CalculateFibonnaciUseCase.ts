import { FibonacciRepository } from "../data/repositories/FibonacciRepository";
import { FibonacciIndex, FibonacciNumbers } from "../entities/Fibonacci";
import { FibonacciService } from "../services/FibonacciService";

export interface CalculateFibonacciParams {
  index: FibonacciIndex;
  enablePersistence: boolean;
}

export class CalculateFibonacciUseCase {
  constructor(
    private fibonacciService: FibonacciService,
    private fibonacciRepository: FibonacciRepository,
  ) {}

  async execute(params: CalculateFibonacciParams): Promise<FibonacciNumbers> {
    if (params.enablePersistence) {
      const found = await this.fibonacciRepository.findByIndex(params.index);
      if (found) return found;
    }

    const numbers = await this.fibonacciService.calculate(params.index);

    if (params.enablePersistence) {
      await this.fibonacciRepository.save(numbers);
    }

    return numbers;
  }
}
