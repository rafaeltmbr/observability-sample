import express from "express";

import { FibonacciController } from "../controllers/FibonacciController";
import { FibonacciRepositoryImpl } from "../../../../core/data/repositories/impl/FibonacciRepositoryImpl";
import { FibonacciInMemoryPeristentStorage } from "../../../data/data_sources/FibonacciInMemoryPersistentStorage";
import { FibonacciRemoteService } from "../../../services/FibonacciRemoteService";
import { FibonacciRedisCache } from "../../../data/data_sources/FibonacciRedisCache";
import { config } from "../../../config";

export const fibonacciRouter = express.Router();

const repository = new FibonacciRepositoryImpl(
  new FibonacciRedisCache(config.cacheExpireInMs, config.redisUrl),
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
