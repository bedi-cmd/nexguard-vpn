"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/encryption";
import { vpnApi, VPNResellersAPIError } from "@/lib/vpnresellers";
import {
  provisionVpnAccountForUser,
  suspendVpnAccountForUser,
  terminateVpnAccountForUser,
  unsuspendVpnAccountForUser,
} from "@/lib/vpn-provisioning";
import type { ActionResult } from "@/lib/auth-actions";
import type { Role } from "@/generated/prisma/enums";

// ───────── Helpers ─────────

async function requireAdmin(): Promise<{ ok: true; userId: string } | { ok: false; error: ActionResult }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: { ok: false, error: "Sign in." } };
  if (session.user.role !== "ADMIN") {
    return { ok: false, error: { ok: false, error: "Admin only." } };
  }
  return { ok: true, userId: session.user.id };
}

function toResult(err: unknown): ActionResult {
  if (err instanceof VPNResellersAPIError) {
    return { ok: false, error: `Provider ${err.status}: ${err.message}` };
  }
  console.error("[admin-action]", err);
  return { ok: false, error: err instanceof Error ? err.message : "Action failed." };
}

// ───────── User actions ─────────

const userIdSchema = z.string().uuid();

async function safeUserId(formData: FormData): Promise<string | null> {
  const raw = formData.get("userId");
  const parsed = userIdSchema.safeParse(typeof raw === "string" ? raw : "");
  return parsed.success ? parsed.data : null;
}

export async function adminSuspendVpnAction(formData: FormData): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;
  const userId = await safeUserId(formData);
  if (!userId) return { ok: false, error: "Invalid user id." };

  try {
    const updated = await suspendVpnAccountForUser(userId);
    await logAudit({
      userId: guard.userId,
      action: "admin.user_suspended",
      target: userId,
      metadata: { previousStatus: updated?.status ?? null },
    });
    revalidatePath("/admin/users");
    return { ok: true, message: "VPN account suspended." };
  } catch (err) {
    return toResult(err);
  }
}

export async function adminUnsuspendVpnAction(formData: FormData): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;
  const userId = await safeUserId(formData);
  if (!userId) return { ok: false, error: "Invalid user id." };
  try {
    await unsuspendVpnAccountForUser(userId);
    await logAudit({ userId: guard.userId, action: "admin.user_unsuspended", target: userId });
    revalidatePath("/admin/users");
    return { ok: true, message: "VPN account reactivated." };
  } catch (err) {
    return toResult(err);
  }
}

export async function adminTerminateVpnAction(formData: FormData): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;
  const userId = await safeUserId(formData);
  if (!userId) return { ok: false, error: "Invalid user id." };
  try {
    const count = await terminateVpnAccountForUser(userId);
    await logAudit({
      userId: guard.userId,
      action: "admin.user_terminated",
      target: userId,
      metadata: { terminatedAccounts: count },
    });
    revalidatePath("/admin/users");
    return { ok: true, message: `Terminated ${count} VPN account(s).` };
  } catch (err) {
    return toResult(err);
  }
}

export async function adminProvisionVpnAction(formData: FormData): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;
  const userId = await safeUserId(formData);
  if (!userId) return { ok: false, error: "Invalid user id." };
  try {
    const row = await provisionVpnAccountForUser(userId);
    await logAudit({
      userId: guard.userId,
      action: "vpn.account_created",
      target: userId,
      metadata: { triggeredBy: "admin", rowId: row.id },
    });
    revalidatePath("/admin/users");
    return { ok: true, message: "VPN account provisioned." };
  } catch (err) {
    return toResult(err);
  }
}

const resetPasswordSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(8).max(200),
});

export async function adminResetPasswordAction(formData: FormData): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;
  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: "Provide a valid user id and 8+ char password." };

  const passwordHash = await hashPassword(parsed.data.password);
  await db.$transaction([
    db.user.update({ where: { id: parsed.data.userId }, data: { passwordHash } }),
    db.session.deleteMany({ where: { userId: parsed.data.userId } }),
  ]);
  await logAudit({
    userId: guard.userId,
    action: "admin.password_reset",
    target: parsed.data.userId,
  });
  revalidatePath("/admin/users");
  return { ok: true, message: "Password reset; user signed out everywhere." };
}

const setRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["USER", "ADMIN"]),
});

export async function adminSetRoleAction(formData: FormData): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;
  const parsed = setRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { ok: false, error: "Invalid user id or role." };

  // Don't allow admins to demote themselves (avoid lockout).
  if (parsed.data.userId === guard.userId && parsed.data.role !== "ADMIN") {
    return { ok: false, error: "You can't remove your own admin role." };
  }

  await db.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role as Role },
  });
  await logAudit({
    userId: guard.userId,
    action: parsed.data.role === "ADMIN" ? "admin.user_unsuspended" : "admin.user_suspended",
    target: parsed.data.userId,
    metadata: { newRole: parsed.data.role },
  });
  revalidatePath("/admin/users");
  return { ok: true, message: `Role set to ${parsed.data.role}.` };
}

// ───────── Bulk ─────────

const bulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  op: z.enum(["suspend", "unsuspend"]),
});

export async function adminBulkVpnAction(input: {
  ids: string[];
  op: "suspend" | "unsuspend";
}): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;
  const parsed = bulkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid bulk input." };

  let ok = 0;
  let failed = 0;
  for (const id of parsed.data.ids) {
    try {
      if (parsed.data.op === "suspend") await suspendVpnAccountForUser(id);
      else await unsuspendVpnAccountForUser(id);
      ok += 1;
    } catch {
      failed += 1;
    }
  }
  await logAudit({
    userId: guard.userId,
    action: parsed.data.op === "suspend" ? "admin.user_suspended" : "admin.user_unsuspended",
    metadata: { count: parsed.data.ids.length, ok, failed, bulk: true },
  });
  revalidatePath("/admin/users");
  return {
    ok: failed === 0,
    error: failed === 0 ? undefined : `${ok} succeeded, ${failed} failed.`,
    message: failed === 0 ? `${ok} accounts updated.` : undefined,
  } as ActionResult;
}

// ───────── Stripe (disabled-aware) ─────────

const refundSchema = z.object({ paymentId: z.string().uuid() });

export async function adminRefundPaymentAction(formData: FormData): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;
  const parsed = refundSchema.safeParse({ paymentId: formData.get("paymentId") });
  if (!parsed.success) return { ok: false, error: "Invalid payment id." };

  const { isStripeEnabled, getStripe } = await import("@/lib/stripe");
  if (!isStripeEnabled()) {
    return { ok: false, error: "Stripe is disabled in this environment." };
  }
  const payment = await db.payment.findUnique({ where: { id: parsed.data.paymentId } });
  if (!payment?.stripePaymentId) return { ok: false, error: "Payment not found." };

  try {
    const stripe = getStripe();
    await stripe.refunds.create({ payment_intent: payment.stripePaymentId });
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "refunded" },
    });
    await logAudit({
      userId: guard.userId,
      action: "payment.failed",
      target: payment.id,
      metadata: { kind: "refund", amountCents: payment.amountCents },
    });
    return { ok: true, message: "Refund issued." };
  } catch (err) {
    return toResult(err);
  }
}

// ───────── Cache invalidation ─────────

export async function adminBustServerCacheAction(): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;
  const { invalidate } = await import("@/lib/cache");
  await invalidate("vpn:servers:v1");
  await invalidate("vpn:ports:v1");
  // Touch the upstream so the cache repopulates immediately.
  try {
    await vpnApi().getServers();
  } catch {
    // Don't fail if upstream is unreachable; cache is empty.
  }
  await logAudit({ userId: guard.userId, action: "admin.user_unsuspended", metadata: { kind: "bust_server_cache" } });
  return { ok: true, message: "Server cache invalidated." };
}
