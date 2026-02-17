import amqp from "amqplib";
import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

import { FibonacciService } from "../../core/services/FibonacciService";
import {
  FibonacciIndex,
  FibonacciNumbers,
  FibonacciResult,
} from "../../core/entities/Fibonacci";
import { InfraError } from "../errors/InfraError";

type ResponseCallback = (
  error: Error | null,
  numbers: FibonacciNumbers,
) => void;

export class FibonacciRemoteService implements FibonacciService {
  private channel: amqp.Channel | null = null;
  private responseMap = new Map<string, ResponseCallback>();

  constructor(
    private amqpBrokerUrl: string,
    private amqpQueue: string,
    private grpcServerAddress: string,
    private responseTimeoutMs: number,
  ) {
    this.setupAmqpProducer();
    this.setupGrpcServer();
  }

  async setupAmqpProducer() {
    try {
      const connection = await amqp.connect(this.amqpBrokerUrl);
      process.on("SIGINT", () => connection.close());

      this.channel = await connection.createChannel();
      await this.channel.prefetch(1);

      await this.channel.assertQueue(this.amqpQueue, { durable: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("AMQP setup error:", message);
    }
  }

  async setupGrpcServer() {
    try {
      const protoPath = path.resolve(
        __dirname,
        "../../../proto/fibonacci.proto",
      );
      const packageDefinition = await protoLoader.load(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });
      const fibonacciService: any =
        grpc.loadPackageDefinition(packageDefinition)["fibonacci"];

      if (!fibonacciService) {
        throw new Error("Unable to load fibonacci service.");
      }

      const server = new grpc.Server();

      server.addService(fibonacciService["Fibonacci"].service, {
        response: this.grpcFibonacciResponseHandler.bind(this),
      });

      server.bindAsync(
        this.grpcServerAddress,
        grpc.ServerCredentials.createInsecure(),
        (err, port) => {
          if (err) {
            return console.error(err);
          }

          console.log(`gRPC server listening at localhost:${port}`);
        },
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("gRPC setup error:", message);
    }
  }

  private grpcFibonacciResponseHandler(call: any, grpcCallback: any) {
    try {
      const correlationId = call.request.correlation_id;
      const index = new FibonacciIndex(call.request.index);
      const result = new FibonacciResult(call.request.result);
      const responseCallback = this.responseMap.get(correlationId);

      if (!responseCallback) {
        throw new Error("Unable to find correlation id.");
      }

      responseCallback(null, new FibonacciNumbers(index, result));
      grpcCallback(null, null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("gRPC response error:", message);
      grpcCallback(e, null);
    }
  }

  async calculate(index: FibonacciIndex): Promise<FibonacciNumbers> {
    if (!this.channel) {
      throw new Error("Unable to create AMQP channel.");
    }

    const correlationId = `${Date.now()}:${Math.random()}`;

    const requestPayload = Buffer.from(JSON.stringify(index.value));
    this.channel.sendToQueue(this.amqpQueue, requestPayload, {
      persistent: false,
      correlationId,
    });

    return new Promise<FibonacciNumbers>((res, rej) => {
      const descriptor = setTimeout(() => {
        rej(new InfraError("fibonacci_response_timeout"));
      }, this.responseTimeoutMs);

      this.responseMap.set(correlationId, (error, numbers) => {
        clearTimeout(descriptor);
        this.responseMap.delete(correlationId);

        if (error) {
          return rej(error);
        }

        res(numbers);
      });
    });
  }
}
