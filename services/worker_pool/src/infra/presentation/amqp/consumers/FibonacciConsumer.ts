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
  private grpcClient: any;
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

      console.log("Fibonacci AMQP consumer created.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn("Fibonacci amqp setup error:", message);
    }
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

      this.grpcClient = new fibonacciPackage.Fibonacci(
        this.grpcServerAddress,
        grpc.credentials.createInsecure(),
      );
      console.log("Fibonacci gRPC client created.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn("Fibonacci gRPC client setup error:", message);
    }
  }

  private async handleAmqpRequest(message: amqp.ConsumeMessage) {
    try {
      const index = new FibonacciIndex(JSON.parse(message.content.toString()));
      const correlationId: string = message.properties.correlationId;
      const numbers = await this.fibonacciService.execute(index);
      await this.sendGrpcReponse(numbers, correlationId);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn("Fibonacci amqp request error:", message);
    }
  }

  private async sendGrpcReponse(
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
        rej(new Error("gRPC response timeout."));
      }, this.grpcFeedbackTimeoutMs);

      this.grpcClient.response(obj, (error: any) => {
        clearTimeout(descriptor);

        if (error) {
          console.log("f", error);
          return rej(error);
        }

        res();
      });
    });
  }
}
