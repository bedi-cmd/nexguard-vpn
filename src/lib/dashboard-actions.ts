"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateSecret, generateURI, verify as verifyTotp } from "otplib";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt, hashPassword } from "@/lib/encryption";
import { vpnApi, VPNResellersAPIError } from "@/lib/vpnresellers";
import { terminateVpnAccountForUser } from "@/lib/vpn-provisioning";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "@/lib/auth-actions";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "VPN Service";

// ───────── Change VPN account password ─────────

const changeVpnPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(50, "Max 50 characters")
    .refine((v) => !/\s/.test(v), "No spaces"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  path: ["confirm"],
  message: "Passwords do not match",
});

export async function changeVpnPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Sign in first." };

  const parsed = changeVpnPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const i of parsed.error.issues) {
      const k = i.path.join(".") || "_";
      (fieldErrors[k] ??= []).push(i.message);
    }
    return { ok: false, error: "Please fix the errors below.", fieldErrors };
  }

  const account = await db.vpnAccount.findFirst({
    where: { userId: session.user.id, status: { in: ["ACTIVE", "SUSPENDED"] } },
  });
  if (!account) return { ok: false, error: "You don't have an active VPN account." };

  try {
    await vpnApi().changePassword(account.vpnResellersId, parsed.data.password);
  } catch (err) {
    if (err instanceof VPNResellersAPIError) {
      return { ok: false, error: `Provider rejected: ${err.message}` };
    }
    throw err;
  }

  await db.vpnAccount.update({
    where: { id: account.id },
    data: { vpnPasswordEnc: encrypt(parsed.data.password) },
  });

  await logAudit({
    userId: session.user.id,
    action: "vpn.password_changed",
    target: account.id,
  });

  revalidatePath("/dashboard/account");
  return { ok: true, message: "VPN password updated." };
}

// ───────── Account password change ─────────

const changeAccountPasswordSchema = z.object({
  current: z.string().min(1),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(200)
    .refine((v) => /[a-z]/.test(v), "Add a lowercase letter")
    .refine((v) => /[A-Z]/.test(v), "Add an uppercase letter")
    .refine((v) => /[0-9]/.test(v), "Add a number")
    .refine((v) => /[^A-Za-z0-9]/.test(v), "Add a special character"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  path: ["confirm"],
  message: "Passwords do not match",
});

export async function changeAccountPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Sign in first." };

  const parsed = changeAccountPasswordSchema.safeParse({
    current: formData.get("current"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const i of parsed.error.issues) {
      const k = i.path.join(".") || "_";
      (fieldErrors[k] ??= []).push(i.message);
    }
    return { ok: false, error: "Please fix the errors below.", fieldErrors };
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) {
    return { ok: false, error: "Your account uses social sign-in; password change isn't available." };
  }
  const { verifyPassword } = await import("@/lib/encryption");
  const ok = await verifyPassword(parsed.data.current, user.passwordHash);
  if (!ok) return { ok: false, error: "Current password is incorrect." };

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    }),
    db.session.deleteMany({ where: { userId: user.id } }),
  ]);

  await logAudit({ userId: user.id, action: "user.password_changed" });
  return { ok: true, message: "Password changed. You'll stay signed in on this device." };
}

// ───────── 2FA (TOTP) setup ─────────

export interface TotpSetupResult {
  secret: string;
  otpauth: string;
}

/**
 * Generates a TOTP secret + provisioning URI. Stored in pending state on the
 * user row but not enabled until `confirmTotpAction` succeeds.
 */
export async function startTotpSetupAction(): Promise<TotpSetupResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Sign in first.");
  const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });

  const secret = generateSecret();
  await db.user.update({
    where: { id: user.id },
    data: { totpSecret: secret, totpEnabled: false },
  });

  const otpauth = generateURI({
    label: user.email,
    issuer: APP_NAME,
    secret,
  });
  return { secret, otpauth };
}

const totpConfirmSchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export async function confirmTotpAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Sign in first." };

  const parsed = totpConfirmSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid code." };
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.totpSecret) {
    return { ok: false, error: "Start 2FA setup first." };
  }
  const result = await verifyTotp({ token: parsed.data.code, secret: user.totpSecret });
  const valid = result.valid;
  if (!valid) return { ok: false, error: "Code is invalid or has expired. Try the next one." };

  await db.user.update({ where: { id: user.id }, data: { totpEnabled: true } });
  await logAudit({ userId: user.id, action: "user.totp_enabled" });
  revalidatePath("/dashboard/account");
  return { ok: true, message: "Two-factor authentication enabled." };
}

export async function disableTotpAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Sign in first." };
  await db.user.update({
    where: { id: session.user.id },
    data: { totpEnabled: false, totpSecret: null },
  });
  await logAudit({ userId: session.user.id, action: "user.totp_disabled" });
  revalidatePath("/dashboard/account");
  return { ok: true, message: "Two-factor authentication disabled." };
}

// ───────── Delete account ─────────

export async function deleteAccountAction(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  // Best-effort terminate VPN account upstream; we still delete the user even
  // if the upstream call fails so the user isn't trapped.
  try {
    await terminateVpnAccountForUser(session.user.id);
  } catch (err) {
    console.error("[delete-account] VPN terminate failed", err);
  }

  await logAudit({ userId: session.user.id, action: "user.deleted" });
  await db.user.delete({ where: { id: session.user.id } });

  await signOut({ redirect: false });
  redirect("/?deleted=1");
}
