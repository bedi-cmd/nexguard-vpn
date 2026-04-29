import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cached, invalidate } from "./cache";

describe("cache (memory fallback when Upstash env unset)", () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls fn on miss and stores result", async () => {
    const fn = vi.fn(async () => 42);
    const v = await cached("test:key:1", 10, fn);
    expect(v).toBe(42);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("hits cache on second call within ttl", async () => {
    const fn = vi.fn(async () => 99);
    await cached("test:key:2", 10, fn);
    const v = await cached("test:key:2", 10, fn);
    expect(v).toBe(99);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("misses cache after ttl expires", async () => {
    const fn = vi.fn(async () => Math.random());
    const a = await cached("test:key:3", 1, fn);
    vi.advanceTimersByTime(2000);
    const b = await cached("test:key:3", 1, fn);
    expect(a).not.toBe(b);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("invalidate clears the key", async () => {
    const fn = vi.fn(async () => "first");
    await cached("test:key:4", 60, fn);
    await invalidate("test:key:4");
    fn.mockResolvedValueOnce("second");
    const v = await cached("test:key:4", 60, fn);
    expect(v).toBe("second");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("isolates keys", async () => {
    await cached("test:isolation:A", 60, async () => "a");
    const b = await cached("test:isolation:B", 60, async () => "b");
    expect(b).toBe("b");
  });
});
