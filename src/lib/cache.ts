/**
 * Lightweight cache wrapper.
 * - Uses Upstash Redis when UPSTASH_REDIS_REST_URL/TOKEN are set.
 * - Falls back to a per-process in-memory cache for dev/edge previews.
 *
 * Keys are namespaced and stringify their arguments. Values are JSON-serialized.
 */

import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

const memCache = new Map<string, { expiresAt: number; value: unknown }>();

async function memGet<T>(key: string): Promise<T | null> {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memCache.delete(key);
    return null;
  }
  return entry.value as T;
}

function memSet<T>(key: string, value: T, ttlSec: number) {
  memCache.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
}

/** Cache-aside helper. Calls `fn` on miss, stores result for `ttlSec`. */
export async function cached<T>(key: string, ttlSec: number, fn: () => Promise<T>): Promise<T> {
  const redis = getRedis();
  if (redis) {
    const hit = await redis.get<T>(key);
    if (hit !== null && hit !== undefined) return hit;
    const fresh = await fn();
    await redis.set(key, fresh, { ex: ttlSec });
    return fresh;
  }
  const hit = await memGet<T>(key);
  if (hit !== null) return hit;
  const fresh = await fn();
  memSet(key, fresh, ttlSec);
  return fresh;
}

/** Invalidate a cached key (best-effort across both backends). */
export async function invalidate(key: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(key).catch(() => {});
  }
  memCache.delete(key);
}
