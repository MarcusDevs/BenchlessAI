import type { KeyValueStorage } from './KeyValueStorage';

/** Versioned local repository primitive for feature-specific persisted records. */
export class JsonRepository<T> {
  constructor(private readonly storage: KeyValueStorage, private readonly key: string, private readonly version: number) {}

  async load(): Promise<T | null> {
    const raw = await this.storage.get(this.key);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      const envelope = parsed as { version?: unknown; value?: unknown };
      return envelope.version === this.version ? envelope.value as T : null;
    } catch {
      return null;
    }
  }

  save(value: T): Promise<void> {
    return this.storage.set(this.key, JSON.stringify({ version: this.version, value }));
  }

  clear(): Promise<void> {
    return this.storage.remove(this.key);
  }
}
