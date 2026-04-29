import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PLANS, getPlan, isStripeEnabled, StripeDisabledError } from "./stripe";

describe("stripe (catalogue + flag)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.STRIPE_ENABLED;
    delete process.env.STRIPE_SECRET_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("PLANS", () => {
    it("has Monthly, Yearly, Lifetime in that order", () => {
      expect(PLANS.map((p) => p.id)).toEqual(["MONTHLY", "YEARLY", "LIFETIME"]);
    });

    it("Yearly is highlighted as 'Most popular'", () => {
      const y = PLANS.find((p) => p.id === "YEARLY");
      expect(y?.highlighted).toBe(true);
    });

    it("Lifetime uses payment mode (not subscription)", () => {
      expect(PLANS.find((p) => p.id === "LIFETIME")?.mode).toBe("payment");
      expect(PLANS.find((p) => p.id === "MONTHLY")?.mode).toBe("subscription");
    });

    it("amount cents match display price", () => {
      expect(PLANS.find((p) => p.id === "MONTHLY")?.amountCents).toBe(999);
      expect(PLANS.find((p) => p.id === "YEARLY")?.amountCents).toBe(5999);
      expect(PLANS.find((p) => p.id === "LIFETIME")?.amountCents).toBe(14999);
    });
  });

  describe("getPlan", () => {
    it("returns plan by id", () => {
      expect(getPlan("MONTHLY").label).toBe("Monthly");
    });

    it("throws on unknown id", () => {
      // @ts-expect-error testing invalid id
      expect(() => getPlan("WEEKLY")).toThrow(/Unknown plan/);
    });
  });

  describe("isStripeEnabled", () => {
    it("returns false when STRIPE_ENABLED is unset", () => {
      expect(isStripeEnabled()).toBe(false);
    });

    it("returns false when STRIPE_ENABLED='false'", () => {
      process.env.STRIPE_ENABLED = "false";
      expect(isStripeEnabled()).toBe(false);
    });

    it("returns true when STRIPE_ENABLED='true'", () => {
      process.env.STRIPE_ENABLED = "true";
      expect(isStripeEnabled()).toBe(true);
    });
  });

  describe("StripeDisabledError", () => {
    it("has the disabled code", () => {
      const e = new StripeDisabledError();
      expect(e.code).toBe("stripe_disabled");
      expect(e.name).toBe("StripeDisabledError");
    });
  });
});
