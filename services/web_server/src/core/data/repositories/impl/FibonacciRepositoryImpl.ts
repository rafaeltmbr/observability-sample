import { FibonacciIndex, FibonacciNumbers } from "../../../entities/Fibonacci";
import { FibonacciCache } from "../../data_sources/FibonacciCache";
import { FibonacciPersistentStorage } from "../../data_sources/FibonacciPersistentStorage";
import { FibonacciRepository } from "../FibonacciRepository";

export class FibonacciRepositoryImpl implements FibonacciRepository {
  constructor(
    private cache: FibonacciCache,
    private persistentStorage: FibonacciPersistentStorage,
  ) {}

  async findByIndex(index: FibonacciIndex): Promise<FibonacciNumbers | null> {
    try {
      const cached = await this.cache.findByIndex(index);
      if (cached) return cached;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn("Cache findByIndex() failed:", message);
    }

    const persisted = await this.persistentStorage.findByIndex(index);
    if (!persisted) return null;

    try {
      await this.cache.save(persisted);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn("Cache save() failed:", message);
    }

    return persisted;
  }

  async save(numbers: FibonacciNumbers): Promise<void> {
    try {
      await this.cache.save(numbers);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn("Cache save() failed:", message);
    }

    await this.persistentStorage.save(numbers);
  }

  async clearAll(): Promise<void> {
    try {
      await this.cache.clearAll();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn("Cache clearAll() failed:", message);
    }

    await this.persistentStorage.clearAll();
  }
}
