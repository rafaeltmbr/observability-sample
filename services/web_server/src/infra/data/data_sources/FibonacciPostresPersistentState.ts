import pg from "pg";

import { FibonacciPersistentStorage } from "../../../core/data/data_sources/FibonacciPersistentStorage";
import {
  FibonacciIndex,
  FibonacciNumbers,
  FibonacciResult,
} from "../../../core/entities/Fibonacci";

export class FibonacciPostgresPersistentStorage implements FibonacciPersistentStorage {
  private client: pg.Client;
  private isConnected: boolean = false;

  private static urlInstanceMap = new Map<
    string,
    FibonacciPostgresPersistentStorage
  >();

  private constructor(url: string) {
    this.client = new pg.Client({ connectionString: url });
  }

  static getInstace(url: string) {
    const found = this.urlInstanceMap.get(url);
    if (found) return found;

    const newInstance = new FibonacciPostgresPersistentStorage(url);
    this.urlInstanceMap.set(url, newInstance);

    return newInstance;
  }

  private async ensureConnection() {
    if (this.isConnected) return;

    await this.client.connect();
    this.isConnected = true;
    this.client.on("end", () => (this.isConnected = false));

    await this.migrate();

    process.on("SIGINT", async () => {
      await this.client.end();
      process.exit(0);
    });
  }

  private async migrate() {
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS fibonacci (
        id SERIAL PRIMARY KEY,
        index INTEGER UNIQUE NOT NULL,
        result INTEGER NOT NULL
      )
    `);
  }

  async findByIndex(index: FibonacciIndex): Promise<FibonacciNumbers | null> {
    await this.ensureConnection();

    console.log(`[PSQL] finding (index=${index.value}).`);
    const response = await this.client.query(
      `SELECT * FROM fibonacci WHERE index = $1`,
      [index.value],
    );

    console.log(`[PSQL] found: ${JSON.stringify(response.rows)}.`);

    if (response.rows.length === 0) return null;

    const result = new FibonacciResult(response.rows[0].result);
    return new FibonacciNumbers(index, result);
  }

  async save(numbers: FibonacciNumbers): Promise<void> {
    await this.ensureConnection();

    console.log(
      `[PSQL] saving (index=${numbers.index}, result=${numbers.result}).`,
    );

    await this.client.query(
      `
      INSERT INTO fibonacci (index, result)
      values ($1, $2)
    `,
      [numbers.index, numbers.result],
    );

    console.log("[PSQL] saved.");
  }

  async clearAll(): Promise<void> {
    await this.ensureConnection();

    console.log("[PSQL] clearing all.");
    await this.client.query("DELETE FROM fibonacci");
    console.log("[PSQL] cleared.");
  }
}
