/**
 * Rate limiting helper.
 *
 * - Production: uses Upstash Redis when UPSTASH_REDIS_REST_URL + TOKEN are set.
 * - Dev: falls back to a per-process in-memory bucket so the app works offline.
 * - Edge runtime: the in-memory fallback is per-instance and not shared, so it's
 *   only suitable for local dev. Always set Upstash env in production.
 *
 * Step 10 widens this to cover all route groups (vpn, webhooks, general).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimiter = {
  /** Returns { success, remaining, reset } where reset is an epoch ms timestamp. */
  limit: (key: string) => Promise<{ success: boolean; remaining: number; reset: number }>;
};

function buildUpstash(slidingWindow: number, windowSec: number, prefix: string): RateLimiter | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(slidingWindow, `${windowSec} s`),
    analytics: false,
    prefix,
  });
  return {
    async limit(key) {
      const r = await rl.limit(key);
      return { success: r.success, remaining: r.remaining, reset: r.reset };
    },
  };
}

function buildMemory(slidingWindow: number, windowSec: number): RateLimiter {
  const buckets = new Map<string, { resetAt: number; hits: number }>();
  const windowMs = windowSec * 1000;
  return {
    async limit(key) {
      const now = Date.now();
      const b = buckets.get(key);
      if (!b || b.resetAt < now) {
        buckets.set(key, { resetAt: now + windowMs, hits: 1 });
        return { success: true, remaining: slidingWindow - 1, reset: now + windowMs };
      }
      b.hits += 1;
      const success = b.hits <= slidingWindow;
      return { success, remaining: Math.max(slidingWindow - b.hits, 0), reset: b.resetAt };
    },
  };
}

function build(slidingWindow: number, windowSec: number, prefix: string): RateLimiter {
  return buildUpstash(slidingWindow, windowSec, prefix) ?? buildMemory(slidingWindow, windowSec);
}

/** 10 requests / minute / IP — for /api/auth/* and the proxy auth gate. */
export const authLimiter = build(10, 60, "rl:auth");

/** 100 requests / minute / IP — generic. */
export const generalLimiter = build(100, 60, "rl:general");

/** 30 requests / minute / user — for /api/vpn/* (Step 5 will use). */
export const vpnLimiter = build(30, 60, "rl:vpn");

/** Best-effort client IP extraction. */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
