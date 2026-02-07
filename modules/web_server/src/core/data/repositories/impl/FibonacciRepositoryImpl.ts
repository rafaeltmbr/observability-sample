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
    } catch {}

    const persisted = await this.persistentStorage.findByIndex(index);
    if (!persisted) return null;

    try {
      await this.cache.save(persisted);
    } catch {}

    return persisted;
  }

  async save(numbers: FibonacciNumbers): Promise<void> {
    try {
      await this.cache.save(numbers);
    } catch {}

    await this.persistentStorage.save(numbers);
  }

  async clearAll(): Promise<void> {
    try {
      await this.cache.clearAll();
    } catch {}

    await this.persistentStorage.clearAll();
  }
}
