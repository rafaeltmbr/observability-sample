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
  private responseMap = new Map<string, ResponseCallback>();
  private requestQueue!: FibonacciRequestAmqpQueue;

  constructor(
    private amqpBrokerUrl: string,
    private amqpQueue: string,
    private grpcServerAddress: string,
    private responseTimeoutMs: number,
  ) {
    this.setupRequestQueue();
    this.setupResponseServer();
  }

  private async setupRequestQueue() {
    this.requestQueue = new FibonacciRequestAmqpQueue(
      this.amqpBrokerUrl,
      this.amqpQueue,
    );
  }

  private async setupResponseServer() {
    new FibonacciResponseGrpcServer(
      this.grpcServerAddress,
      this.handleResponse.bind(this),
    );
  }

  private handleResponse(response: FibonacciResponse) {
    const responseCallback = this.responseMap.get(response.correlationId);

    if (!responseCallback) {
      throw new Error("Unable to find correlation id.");
    }

    responseCallback(null, response.numbers);
  }

  async calculate(index: FibonacciIndex): Promise<FibonacciNumbers> {
    const correlationId = `${Date.now()}${Math.random()}`;
    this.requestQueue.sendRequest(index, correlationId);

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

class FibonacciRequestAmqpQueue {
  private channel: amqp.Channel | null = null;

  constructor(
    private brokerUrl: string,
    private queue: string,
  ) {
    this.setup();
  }

  private async setup() {
    try {
      const connection = await amqp.connect(this.brokerUrl);
      process.on("SIGINT", () => {
        connection.close();
        process.exit(0);
      });

      this.channel = await connection.createChannel();
      await this.channel.prefetch(1);

      await this.channel.assertQueue(this.queue, { durable: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("AMQP setup error:", message);
    }
  }

  sendRequest(index: FibonacciIndex, correlationId: string) {
    if (!this.channel) throw new Error("Unable to send amqp request.");

    const requestPayload = Buffer.from(JSON.stringify(index.value));

    this.channel.sendToQueue(this.queue, requestPayload, {
      persistent: false,
      correlationId,
    });
  }
}

interface FibonacciResponse {
  correlationId: string;
  numbers: FibonacciNumbers;
}

class FibonacciResponseGrpcServer {
  private server!: grpc.Server;

  constructor(
    private serverAddress: string,
    private onRequest: (response: FibonacciResponse) => void,
  ) {
    this.setup();
  }

  private async setup() {
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

      this.server = new grpc.Server();

      this.server.addService(fibonacciService["Fibonacci"].service, {
        response: this.responseHandler.bind(this),
      });

      this.start();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("gRPC setup error:", message);
    }
  }

  private start() {
    this.server.bindAsync(
      this.serverAddress,
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) return console.error(err);

        console.log(`gRPC server listening at localhost:${port}`);
      },
    );
  }

  private responseHandler(call: any, grpcCallback: any) {
    try {
      const correlationId = call.request.correlation_id;
      const index = new FibonacciIndex(call.request.index);
      const result = new FibonacciResult(call.request.result);
      const numbers = new FibonacciNumbers(index, result);

      this.onRequest({ correlationId, numbers });

      grpcCallback(null, null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("gRPC response error:", message);
      grpcCallback(e, null);
    }
  }
}
