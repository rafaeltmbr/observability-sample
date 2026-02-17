import { NextFunction, Request, Response } from "express";

import {
  DomainError,
  DomainErrorType,
} from "../../../../core/errors/DomainError";
import { InfraError, InfraErrorType } from "../../../errors/InfraError";

export const errorMiddleware = (
  e: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (e instanceof DomainError) {
    const [status, message] = domainErrorStatusMessageMapping[e.type];
    const error = { type: e.type, message };
    res.status(status).json({ error });
    return;
  }

  if (e instanceof InfraError) {
    const [status, message] = infraErrorStatusMessageMapping[e.type];
    const error = { type: e.type, message };
    res.status(status).json({ error });
    return;
  }

  console.error("Unexpected error:", e);

  const error = { type: "unexpected_error", message: "" };
  res.status(500).json({ error });
};

const domainErrorStatusMessageMapping: Record<
  DomainErrorType,
  [number, string]
> = {
  fibonacci_non_integer_index: [400, "Fibonacci index be an integer number."],
  fibonacci_non_positive_index: [
    400,
    "Fibonacci index should be a positive number.",
  ],
  fibonacci_negative_result: [500, "Fibonacci result shouldn't be a negative."],
  fibonacci_non_integer_result: [
    500,
    "Fibonacci result should be a integer number.",
  ],
};

const infraErrorStatusMessageMapping: Record<InfraErrorType, [number, string]> =
  {
    fibonacci_response_timeout: [504, "Fibonacci response timeout."],
  };
