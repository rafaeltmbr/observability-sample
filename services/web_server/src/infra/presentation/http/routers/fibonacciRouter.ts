import express from "express";

import { FibonacciController } from "../controllers/FibonacciController";
import { FibonacciRepositoryImpl } from "../../../../core/data/repositories/impl/FibonacciRepositoryImpl";
import { FibonacciRemoteService } from "../../../services/FibonacciRemoteService";
import { FibonacciRedisCache } from "../../../data/data_sources/FibonacciRedisCache";
import { FibonacciPostgresPersistentStorage } from "../../../data/data_sources/FibonacciPostresPersistentState";
import { config } from "../../../config";

export const fibonacciRouter = express.Router();

const repository = new FibonacciRepositoryImpl(
  new FibonacciRedisCache(config.cacheExpireInMs, config.redisUrl),
  FibonacciPostgresPersistentStorage.getInstace(config.postgresUrl),
);

const service = new FibonacciRemoteService(
  config.amqpBrokerUrl,
  config.amqpFibonacciQueue,
  config.grpcServerAddress,
  config.responseTimeoutMs,
);
const controller = new FibonacciController(repository, service);

fibonacciRouter.get("/:index", controller.find.bind(controller));
