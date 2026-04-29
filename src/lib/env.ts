/**
 * Type-safe environment variables.
 *
 * Imported from `next.config.ts` so any missing required value fails the BUILD
 * rather than crashing at request time. Optional vars (Stripe, Resend, OAuth,
 * Upstash) are validated when present but allowed to be empty in dev.
 */

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const optionalStr = z
  .string()
  .optional()
  .transform((v) => (v?.length ? v : undefined));

export const env = createEnv({
  server: {
    // ── Always required ──
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
    ENCRYPTION_KEY: z
      .string()
      .regex(/^[0-9a-f]{64}$/, "ENCRYPTION_KEY must be 64 hex characters (32 bytes)"),

    // ── NextAuth aliases / hosting ──
    NEXTAUTH_SECRET: optionalStr,
    NEXTAUTH_URL: optionalStr.pipe(z.string().url().optional()),
    AUTH_TRUST_HOST: optionalStr,

    // ── VPNResellers (required for the API client to work in prod) ──
    VPNRESELLERS_API_URL: optionalStr.pipe(z.string().url().optional()),
    VPNRESELLERS_API_KEY: optionalStr,

    // ── Stripe — optional unless STRIPE_ENABLED=true ──
    STRIPE_ENABLED: z.enum(["true", "false"]).default("false"),
    STRIPE_SECRET_KEY: optionalStr,
    STRIPE_WEBHOOK_SECRET: optionalStr,
    STRIPE_PRICE_MONTHLY: optionalStr,
    STRIPE_PRICE_YEARLY: optionalStr,
    STRIPE_PRICE_LIFETIME: optionalStr,

    // ── OAuth providers (optional) ──
    GOOGLE_CLIENT_ID: optionalStr,
    GOOGLE_CLIENT_SECRET: optionalStr,

    // ── Email ──
    RESEND_API_KEY: optionalStr,
    EMAIL_FROM: optionalStr,
    EMAIL_ADMIN: optionalStr.pipe(z.string().email().optional()),

    // ── Rate-limit + cache backend (optional in dev; in-memory fallback) ──
    UPSTASH_REDIS_REST_URL: optionalStr.pipe(z.string().url().optional()),
    UPSTASH_REDIS_REST_TOKEN: optionalStr,
    REDIS_URL: optionalStr,

    // ── Cron auth ──
    CRON_SECRET: optionalStr,
  },

  client: {
    NEXT_PUBLIC_APP_NAME: z.string().default("NexGuard"),
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalStr,
  },

  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },

  // Skip validation when SKIP_ENV_VALIDATION=1 (CI smoke runs only).
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1",

  // Treat empty strings as undefined so a stray `FOO=` in .env doesn't
  // accidentally satisfy a `z.string()` requirement.
  emptyStringAsUndefined: true,
})
  // Cross-field rule: Stripe-enabled requires the secret + webhook secret.
  // We validate this OUTSIDE createEnv since createEnv doesn't expose .refine.
  ;

if (env.STRIPE_ENABLED === "true") {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_ENABLED=true but STRIPE_SECRET_KEY is unset. Set it or flip the flag back to false.",
    );
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error(
      "STRIPE_ENABLED=true but STRIPE_WEBHOOK_SECRET is unset. The webhook handler can't verify signatures without it.",
    );
  }
}
