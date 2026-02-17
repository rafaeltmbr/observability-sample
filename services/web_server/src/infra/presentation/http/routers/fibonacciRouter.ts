import express from "express";

import { FibonacciController } from "../controllers/FibonacciController";
import { FibonacciRepositoryImpl } from "../../../../core/data/repositories/impl/FibonacciRepositoryImpl";
import { FibonacciInMemoryCache } from "../../../data/data_sources/FibonacciInMemoryCache";
import { FibonacciInMemoryPeristentStorage } from "../../../data/data_sources/FibonacciInMemoryPersistentStorage";
import { config } from "../../../config";
import { FibonacciRemoteService } from "../../../services/FibonacciRemoteService";

export const fibonacciRouter = express.Router();

const repository = new FibonacciRepositoryImpl(
  new FibonacciInMemoryCache(config.cacheExpireInMs),
  new FibonacciInMemoryPeristentStorage(),
);

const service = new FibonacciRemoteService(
  config.amqpBrokerUrl,
  config.amqpFibonacciQueue,
  config.grpcServerAddress,
  config.responseTimeoutMs,
);
const controller = new FibonacciController(repository, service);

fibonacciRouter.get("/:index", controller.find.bind(controller));
