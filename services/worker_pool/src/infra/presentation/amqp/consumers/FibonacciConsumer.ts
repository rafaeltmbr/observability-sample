import "dotenv/config";
import amqp from "amqplib";
import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

import {
  FibonacciIndex,
  FibonacciNumbers,
} from "../../../../core/entities/Fibonacci";
import { FibonacciService } from "../../../../core/service/FibonacciService";

export class FibonacciConsumer {
  private grpcResponseClient!: FibonacciResponseGrpcClient;
  private fibonacciService = new FibonacciService();

  constructor(
    private ampqBrokerUrl: string,
    private amqpQueue: string,
    private grpcServerAddress: string,
    private grpcFeedbackTimeoutMs: number,
  ) {
    this.setupAmqpConsumer();
    this.setupGrpcClient();
  }

  private async setupAmqpConsumer() {
    try {
      const connection = await amqp.connect(this.ampqBrokerUrl);

      const channel = await connection.createChannel();

      await channel.assertQueue(this.amqpQueue, { durable: false });

      channel.consume(
        this.amqpQueue,
        async (message) => {
          if (message) {
            this.handleAmqpRequest(message);
          }
        },
        { noAck: true },
      );

      process.on("SIGINT", () => {
        connection.close();
        process.exit(0);
      });

      console.log("[AMQP] consumer created.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn("[AMQP] setup error:", message);
    }
  }

  private setupGrpcClient() {
    this.grpcResponseClient = new FibonacciResponseGrpcClient(
      this.grpcServerAddress,
      this.grpcFeedbackTimeoutMs,
    );
  }

  private async handleAmqpRequest(message: amqp.ConsumeMessage) {
    try {
      const index = new FibonacciIndex(JSON.parse(message.content.toString()));
      const correlationId: string = message.properties.correlationId;
      console.log(
        `[AMQP] received (index=${index.value}, correlationId=${correlationId})`,
      );
      const numbers = await this.fibonacciService.execute(index);
      await this.grpcResponseClient.sendResponse(numbers, correlationId);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn("Fibonacci amqp request error:", message);
    }
  }
}

class FibonacciResponseGrpcClient {
  private client: any;

  constructor(
    private serverAddress: string,
    private feedbackTimeoutMs: number,
  ) {
    this.setupGrpcClient();
  }

  private async setupGrpcClient() {
    try {
      const protoPath = path.resolve(
        __dirname,
        "../../../../../proto/fibonacci.proto",
      );
      const packageDefinition = await protoLoader.load(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const fibonacciPackage: any =
        grpc.loadPackageDefinition(packageDefinition)["fibonacci"];
      if (!fibonacciPackage) return;

      this.client = new fibonacciPackage.Fibonacci(
        this.serverAddress,
        grpc.credentials.createInsecure(),
      );
      console.log("[gRPC] client created.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn("[gRPC] setup error:", message);
    }
  }

  async sendResponse(
    numbers: FibonacciNumbers,
    correlationId: string,
  ): Promise<void> {
    return new Promise<void>((res, rej) => {
      const obj = {
        index: numbers.index,
        result: numbers.result,
        correlation_id: correlationId,
      };

      const descriptor = setTimeout(() => {
        rej(new Error("[gRPC] response timeout."));
      }, this.feedbackTimeoutMs);

      console.log(
        `[gRPC] send response (index=${numbers.index}, correlationId=${correlationId})`,
      );
      this.client.response(obj, (error: any) => {
        clearTimeout(descriptor);

        if (error) {
          console.log(
            `[gRPC] response failed (index=${numbers.index}, correlationId=${correlationId})`,
            error,
          );
          return rej(error);
        }

        res();
      });
    });
  }
}
