import "dotenv/config";

export const config = {
  amqpBrokerUrl: process.env["AMQP_BROKER_URL"] ?? "",
  amqpFibonacciQueue: process.env["AMQP_FIBONACCI_QUEUE"] ?? "",
  grpcServerAddress: process.env["GRPC_SERVER_ADDRESS"] ?? "",
  grpcFeedbackTimeoutMs: parseInt(
    process.env["GRPC_FEEDBACK_TIMEOUT_MS"] ?? "1000",
  ),
};
