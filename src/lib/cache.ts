interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number;
  cleanupInterval?: number;
}

type CacheKey = string;

class Cache {
  private store: Map<CacheKey, CacheEntry<unknown>>;
  private ttl: number;
  private cleanupInterval: number;
  private cleanupTimer: NodeJS.Timeout | null;

  constructor(options: CacheOptions = {}) {
    this.store = new Map();
    this.ttl = options.ttl || 300000; // 5 minutes default
    this.cleanupInterval = options.cleanupInterval || 60000; // 1 minute default
    this.cleanupTimer = null;
    this.startCleanup();
  }

  set<T>(key: CacheKey, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.ttl
    };
    this.store.set(key, entry as CacheEntry<unknown>);
  }

  get<T>(key: CacheKey): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  delete(key: CacheKey): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  private startCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.store.delete(key);
        }
      }
    }, this.cleanupInterval);
  }

  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

export const cache = new Cache();

export function createCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc: Record<string, unknown>, key: string) => {
      acc[key] = params[key];
      return acc;
    }, {});

  return `${prefix}:${JSON.stringify(sortedParams)}`;
}

// Helper function to wrap an async function with caching
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 60 * 1000
): Promise<T> {
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const result = await fn();
  cache.set(key, result, ttl);
  return result;
} 