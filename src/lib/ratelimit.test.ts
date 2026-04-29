import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { authLimiter, getClientIp } from "./ratelimit";

describe("ratelimit (memory fallback)", () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the configured number of requests, then blocks", async () => {
    const key = `unit-test-${Date.now()}-${Math.random()}`;
    let lastRemaining = 999;
    for (let i = 0; i < 10; i++) {
      const r = await authLimiter.limit(key);
      expect(r.success).toBe(true);
      lastRemaining = r.remaining;
    }
    expect(lastRemaining).toBeLessThanOrEqual(0);
    const blocked = await authLimiter.limit(key);
    expect(blocked.success).toBe(false);
  });

  it("isolates buckets by key", async () => {
    const r1 = await authLimiter.limit("rl-iso-1");
    const r2 = await authLimiter.limit("rl-iso-2");
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
  });

  it("resets after the window passes", async () => {
    const key = `rl-reset-${Math.random()}`;
    for (let i = 0; i < 10; i++) await authLimiter.limit(key);
    expect((await authLimiter.limit(key)).success).toBe(false);
    vi.advanceTimersByTime(61_000); // window is 60s
    expect((await authLimiter.limit(key)).success).toBe(true);
  });
});

describe("getClientIp", () => {
  it("uses x-forwarded-for first hop", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" } });
    expect(getClientIp(req)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("http://x", { headers: { "x-real-ip": "198.51.100.7" } });
    expect(getClientIp(req)).toBe("198.51.100.7");
  });

  it("returns 'unknown' when no headers present", () => {
    const req = new Request("http://x");
    expect(getClientIp(req)).toBe("unknown");
  });
});
