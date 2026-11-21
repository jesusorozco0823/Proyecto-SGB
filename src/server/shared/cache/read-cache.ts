import { Prisma } from '@prisma/client';

const MAX_ENTRIES = 300;

type Entry = { value: string; at: number };

export const CacheTtl = {
  settings: 60_000,
  lists: 30_000,
  messages: 15_000,
} as const;

export function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P1001' || error.code === 'P1002' || error.code === 'P1008' || error.code === 'P1017';
  }
  return error instanceof Prisma.PrismaClientInitializationError;
}

export function createReadCache(now: () => number = Date.now) {
  const entries = new Map<string, Entry>();

  function remember(key: string, value: unknown) {
    if (value === undefined) return;
    if (entries.has(key)) entries.delete(key);
    entries.set(key, { value: JSON.stringify(value), at: now() });
    while (entries.size > MAX_ENTRIES) {
      const oldest = entries.keys().next().value;
      if (oldest === undefined) break;
      entries.delete(oldest);
    }
  }

  return {
    async read<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
      const hit = entries.get(key);
      if (hit && now() - hit.at < ttlMs) {
        entries.delete(key);
        entries.set(key, hit);
        return JSON.parse(hit.value) as T;
      }
      try {
        const value = await load();
        remember(key, value);
        return value;
      } catch (error) {
        if (hit && isDatabaseUnavailable(error)) return JSON.parse(hit.value) as T;
        throw error;
      }
    },
    invalidate(...prefixes: string[]) {
      for (const key of [...entries.keys()]) {
        if (prefixes.some((prefix) => key.startsWith(prefix))) entries.delete(key);
      }
    },
    size() {
      return entries.size;
    },
  };
}

export const readCache = createReadCache();

export function cachedRead<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  return readCache.read(key, ttlMs, load);
}

export function invalidate(...prefixes: string[]): void {
  readCache.invalidate(...prefixes);
}
