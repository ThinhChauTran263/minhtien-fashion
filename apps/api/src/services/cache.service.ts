import { redis } from "../config/redis";

const PREFIX = "mtf:";

export const cacheService = {
  /**
   * Get cached value (parsed JSON) or null.
   */
  async get<T>(key: string): Promise<T | null> {
    const raw = await redis.get(PREFIX + key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * Set cache with TTL in seconds.
   */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await redis.set(PREFIX + key, JSON.stringify(value), "EX", ttlSeconds);
  },

  /**
   * Delete one or more cache keys.
   */
  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await redis.del(...keys.map((k) => PREFIX + k));
  },

  /**
   * Delete all keys matching a pattern (e.g. "product:*").
   */
  async delPattern(pattern: string): Promise<void> {
    const fullPattern = PREFIX + pattern;
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", fullPattern, "COUNT", 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  },

  // === Domain-specific cache keys ===
  keys: {
    categories: "categories",
    featuredProducts: "featured-products",
    productBySlug: (slug: string) => `product:${slug}`,
  },
};
