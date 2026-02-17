import "dotenv/config";

export const config = {
  httpServerPort: parseInt(process.env["HTTP_SERVER_PORT"] ?? "80"),
  cacheExpireInMs: parseInt(process.env["CACHE_EXPIRE_IN_MS"] ?? "5000"),
  responseTimeoutMs: parseInt(process.env["RESPONSE_TIMEOUT_MS"] ?? "60000"),
  amqpBrokerUrl: process.env["AMQP_BROKER_URL"] ?? "",
  amqpFibonacciQueue: process.env["AMQP_FIBONACCI_QUEUE"] ?? "",
  grpcServerAddress: process.env["GRPC_SERVER_ADDRESS"] ?? "",
};
