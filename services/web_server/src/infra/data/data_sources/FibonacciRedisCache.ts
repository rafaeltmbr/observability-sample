import { createClient, RedisClientType } from "redis";

import { FibonacciCache } from "../../../core/data/data_sources/FibonacciCache";
import {
  FibonacciIndex,
  FibonacciNumbers,
  FibonacciResult,
} from "../../../core/entities/Fibonacci";

export class FibonacciRedisCache implements FibonacciCache {
  private client!: RedisClientType<any>;

  constructor(
    private expireInMs: number,
    private connectionUrl: string,
  ) {
    this.setup();
  }

  private async setup() {
    try {
      this.client = createClient({ url: this.connectionUrl });
      process.on("SIGINT", () => {
        this.client.quit();
        process.exit(0);
      });
      await this.client.connect();
      console.log("[REDS] client connected.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`[REDS] setup failed: ${message}.`);
    }
  }

  async findByIndex(index: FibonacciIndex): Promise<FibonacciNumbers | null> {
    console.log(`[REDS] finding (index=${index.value}).`);

    const key = FibonacciRedisCache.makeKey(index.value);
    const value = await this.client.get(key);

    console.log(`[REDS] found: ${JSON.stringify(value)}`);
    if (value === null) return null;

    return new FibonacciNumbers(index, new FibonacciResult(parseInt(value)));
  }

  async save(numbers: FibonacciNumbers): Promise<void> {
    console.log(
      `[REDS] saving (index=${numbers.index}, result=${numbers.index}).`,
    );

    const key = FibonacciRedisCache.makeKey(numbers.index);
    await this.client.set(key, numbers.result.toString(), {
      expiration: {
        type: "PX",
        value: this.expireInMs,
      },
    });

    console.log("[REDS] saved.");
  }

  /**
   * NOTE: This implementation of clear all assumes the Redis will have
   * few keys for fibonacci results. Otherwise, it will block Redis for a while
   * and that may affect the system availability.
   */
  async clearAll(): Promise<void> {
    console.log("[REDS] clearing all.");

    const keys = await this.client.keys("fibonacci:*");
    if (keys.length > 0) {
      await this.client.del(keys);
    }

    console.log("[REDS] cleared.");
  }

  private static makeKey(index: number): string {
    return `fibonacci:${index}`;
  }
}
