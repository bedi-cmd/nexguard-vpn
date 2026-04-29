/**
 * Append-only audit log helper.
 * Step 10 hardens this with stricter typing and rotation policy.
 */

import { db } from "@/lib/db";
import { sha256Hex } from "@/lib/encryption";

export type AuditAction =
  | "user.signup"
  | "user.signin"
  | "user.signin_failed"
  | "user.signout"
  | "user.email_verified"
  | "user.password_reset_requested"
  | "user.password_reset_completed"
  | "user.password_changed"
  | "user.totp_enabled"
  | "user.totp_disabled"
  | "user.deleted"
  | "vpn.account_created"
  | "vpn.account_suspended"
  | "vpn.account_unsuspended"
  | "vpn.account_terminated"
  | "vpn.password_changed"
  | "admin.user_suspended"
  | "admin.user_unsuspended"
  | "admin.user_terminated"
  | "admin.password_reset"
  | "payment.created"
  | "payment.failed"
  | "subscription.started"
  | "subscription.cancelled"
  | "subscription.reactivated";

interface LogArgs {
  userId?: string | null;
  action: AuditAction;
  target?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit({ userId, action, target, ip, metadata }: LogArgs) {
  try {
    await db.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        target: target ?? null,
        ipHash: ip ? sha256Hex(ip) : null,
        metadata: (metadata as never) ?? undefined,
      },
    });
  } catch (err) {
    // Audit logs must never break user flows; just log.
    console.error("[audit] failed to write", action, err);
  }
}
