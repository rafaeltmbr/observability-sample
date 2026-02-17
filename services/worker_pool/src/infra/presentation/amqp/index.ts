import { config } from "../../config";
import { FibonacciConsumer } from "./consumers/FibonacciConsumer";

new FibonacciConsumer(
  config.amqpBrokerUrl,
  config.amqpFibonacciQueue,
  config.grpcServerAddress,
  config.grpcFeedbackTimeoutMs,
);
