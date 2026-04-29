import { hash, compare } from "bcryptjs";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "node:crypto";

const BCRYPT_COST = 12;

/** Hash a password with bcrypt cost 12. */
export function hashPassword(plaintext: string) {
  return hash(plaintext, BCRYPT_COST);
}

/** Verify a plaintext password against a bcrypt hash. */
export function verifyPassword(plaintext: string, hashed: string) {
  return compare(plaintext, hashed);
}

/**
 * AES-256-GCM symmetric encryption used for VPN account passwords at rest.
 * The output is a single base64 string `iv.ciphertext.tag` so it's safe to store
 * in a TEXT column without splitting.
 */

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("ENCRYPTION_KEY is not set (32-byte hex).");
  }
  const buf = Buffer.from(raw, "hex");
  if (buf.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes).");
  }
  return buf;
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), ciphertext.toString("base64"), tag.toString("base64")].join(".");
}

export function decrypt(payload: string): string {
  const [ivB64, ctB64, tagB64] = payload.split(".");
  if (!ivB64 || !ctB64 || !tagB64) throw new Error("Malformed ciphertext");
  const iv = Buffer.from(ivB64, "base64");
  const ct = Buffer.from(ctB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plaintext.toString("utf8");
}

/** SHA-256 hex hash. Used for IP-address hashing in audit logs. */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
