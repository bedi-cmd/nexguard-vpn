"use server";

import { z } from "zod";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/encryption";
import {
  sendVerifyEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "@/lib/email";
import { authLimiter, getClientIp } from "@/lib/ratelimit";
import { logAudit } from "@/lib/audit";
import { signIn } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ───────── Schemas ─────────

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(200)
  .refine((v) => /[a-z]/.test(v), "Add a lowercase letter")
  .refine((v) => /[A-Z]/.test(v), "Add an uppercase letter")
  .refine((v) => /[0-9]/.test(v), "Add a number")
  .refine((v) => /[^A-Za-z0-9]/.test(v), "Add a special character");

const signUpSchema = z
  .object({
    email: z.email().max(254).transform((v) => v.toLowerCase().trim()),
    password: passwordSchema,
    confirmPassword: z.string(),
    name: z.string().trim().max(80).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const signInSchema = z.object({
  email: z.email().max(254).transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1).max(200),
});

const forgotSchema = z.object({
  email: z.email().max(254).transform((v) => v.toLowerCase().trim()),
});

const resetSchema = z
  .object({
    token: z.string().min(20),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

// ───────── Result type ─────────

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

// ───────── Helpers ─────────

function pickFieldErrors(
  err: z.ZodError<unknown>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = [];
    out[key].push(issue.message);
  }
  return out;
}

function newToken(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

async function rateLimitedByIp(prefix: string): Promise<boolean> {
  // Server actions can't read headers as a Request. Best-effort: use a coarse key.
  // The proxy.ts catches obvious abuse on the matching API endpoints.
  const key = `${prefix}:server-action`;
  const r = await authLimiter.limit(key);
  return r.success;
}

// ───────── Sign up ─────────

export async function signUpAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    name: formData.get("name") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: pickFieldErrors(parsed.error) };
  }

  if (!(await rateLimitedByIp("signup"))) {
    return { ok: false, error: "Too many sign-up attempts. Try again in a minute." };
  }

  const { email, password, name } = parsed.data;

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    // Generic message to avoid email enumeration — but we still log it.
    return {
      ok: true,
      message: "Account created. Check your email to verify your address.",
    };
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: { email, passwordHash, name: name || null },
    select: { id: true, email: true, name: true },
  });

  // Issue verification token (24h)
  const token = newToken();
  await db.emailVerificationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const url = `${APP_URL}/verify-email/${token}`;
  await Promise.all([
    sendVerifyEmail(user.email, url),
    sendWelcomeEmail(user.email, { name: user.name }),
  ]);

  await logAudit({ userId: user.id, action: "user.signup", metadata: { source: "credentials" } });

  return {
    ok: true,
    message: "Account created. Check your email to verify your address.",
  };
}

// ───────── Sign in (credentials) ─────────

export async function signInAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid credentials.", fieldErrors: pickFieldErrors(parsed.error) };
  }

  if (!(await rateLimitedByIp("signin"))) {
    return { ok: false, error: "Too many sign-in attempts. Try again in a minute." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign-in failed";
    await logAudit({ action: "user.signin_failed", metadata: { reason: message } });
    return { ok: false, error: "Invalid email or password." };
  }

  redirect("/dashboard");
}

// ───────── Forgot password ─────────

export async function forgotPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (!(await rateLimitedByIp("forgot"))) {
    return { ok: false, error: "Too many requests. Try again in a minute." };
  }

  const { email } = parsed.data;
  const user = await db.user.findUnique({ where: { email }, select: { id: true, email: true } });

  // Always return the same message — no email enumeration.
  const generic = {
    ok: true as const,
    message: "If an account exists for that email, a password reset link has been sent.",
  };

  if (!user) return generic;

  const token = newToken();
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  const url = `${APP_URL}/reset-password/${token}`;
  await sendPasswordResetEmail(user.email, url);

  await logAudit({
    userId: user.id,
    action: "user.password_reset_requested",
  });

  return generic;
}

// ───────── Reset password ─────────

export async function resetPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: pickFieldErrors(parsed.error) };
  }

  const { token, password } = parsed.data;
  const tokenRow = await db.passwordResetToken.findUnique({ where: { token } });
  if (!tokenRow || tokenRow.usedAt || tokenRow.expiresAt < new Date()) {
    return { ok: false, error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await hashPassword(password);
  await db.$transaction([
    db.user.update({ where: { id: tokenRow.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: tokenRow.id }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: tokenRow.userId } }),
  ]);

  await logAudit({
    userId: tokenRow.userId,
    action: "user.password_reset_completed",
  });

  return { ok: true, message: "Password updated. You can now sign in with your new password." };
}

// ───────── Verify email ─────────

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  if (!token || token.length < 20) {
    return { ok: false, error: "Invalid verification link." };
  }
  const row = await db.emailVerificationToken.findUnique({ where: { token } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return { ok: false, error: "This verification link is invalid or has expired." };
  }
  await db.$transaction([
    db.user.update({
      where: { id: row.userId },
      data: { emailVerified: new Date() },
    }),
    db.emailVerificationToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);
  await logAudit({ userId: row.userId, action: "user.email_verified" });
  return { ok: true, message: "Email verified. You can now sign in." };
}

// expose getClientIp wrapper too if needed by routes
export { getClientIp };
