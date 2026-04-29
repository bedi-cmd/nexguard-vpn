import { describe, it, expect, beforeEach } from "vitest";
import { encrypt, decrypt, hashPassword, verifyPassword, sha256Hex } from "./encryption";
import { randomBytes } from "node:crypto";

describe("encryption", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = randomBytes(32).toString("hex");
  });

  describe("encrypt / decrypt", () => {
    it("round-trips plain text", () => {
      const plain = "swordfish-2026!";
      const enc = encrypt(plain);
      expect(enc).not.toBe(plain);
      expect(enc.split(".")).toHaveLength(3);
      expect(decrypt(enc)).toBe(plain);
    });

    it("produces a different ciphertext each call (random IV)", () => {
      const plain = "same-input";
      expect(encrypt(plain)).not.toBe(encrypt(plain));
    });

    it("throws on tampered ciphertext", () => {
      const enc = encrypt("hello");
      const [iv, , tag] = enc.split(".");
      const tampered = `${iv}.${Buffer.from("garbage").toString("base64")}.${tag}`;
      expect(() => decrypt(tampered)).toThrow();
    });

    it("throws when ENCRYPTION_KEY is missing", () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => encrypt("x")).toThrow(/ENCRYPTION_KEY/);
    });

    it("throws when ENCRYPTION_KEY is wrong length", () => {
      process.env.ENCRYPTION_KEY = "abcd"; // not 64 hex chars
      expect(() => encrypt("x")).toThrow(/64-character hex/);
    });
  });

  describe("password hashing", () => {
    it("hashes and verifies correctly", async () => {
      const hash = await hashPassword("CorrectHorse!Battery");
      expect(hash).not.toBe("CorrectHorse!Battery");
      expect(hash.startsWith("$2")).toBe(true); // bcrypt prefix
      expect(await verifyPassword("CorrectHorse!Battery", hash)).toBe(true);
    });

    it("rejects wrong password", async () => {
      const hash = await hashPassword("p@ssw0rd");
      expect(await verifyPassword("wrong", hash)).toBe(false);
    });
  });

  describe("sha256Hex", () => {
    it("returns 64-char hex hash", () => {
      const h = sha256Hex("192.168.0.1");
      expect(h).toMatch(/^[0-9a-f]{64}$/);
    });

    it("is deterministic", () => {
      expect(sha256Hex("x")).toBe(sha256Hex("x"));
    });
  });
});
