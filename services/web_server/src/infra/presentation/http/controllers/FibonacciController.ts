import { Request, Response } from "express";

import { FibonacciService } from "../../../../core/services/FibonacciService";
import { FibonacciRepository } from "../../../../core/data/repositories/FibonacciRepository";
import {
  CalculateFibonacciParams,
  CalculateFibonacciUseCase,
} from "../../../../core/use_cases/CalculateFibonnaciUseCase";
import { FibonacciIndex } from "../../../../core/entities/Fibonacci";

export class FibonacciController {
  constructor(
    private fibonacciRepository: FibonacciRepository,
    private fibonacciService: FibonacciService,
  ) {}

  async find(req: Request, res: Response): Promise<void> {
    const calculateFibonacci = new CalculateFibonacciUseCase(
      this.fibonacciService,
      this.fibonacciRepository,
    );

    const index = Number((req.params["index"] as string) ?? "0");

    const params: CalculateFibonacciParams = {
      index: new FibonacciIndex(index),
      enablePersistence: req.query["persist"] === "true",
    };

    console.log("\n-----------------------------------\n");
    console.log(`[HTTP] calculate (index=${index}).`);

    const numbers = await calculateFibonacci.execute(params);

    console.log(`[HTTP] response (index=${index}, result=${numbers.result}).`);

    res.json({ data: numbers.result });
  }
}
