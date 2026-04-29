/**
 * VPN account lifecycle helpers — used by the Stripe webhook (Step 4) and
 * the admin panel (Step 7) to provision, suspend, and terminate accounts
 * via the VPNResellers API.
 *
 * All actions write audit log entries. Failures are surfaced to the caller;
 * the caller decides whether to retry, mark the subscription incomplete, etc.
 */

import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { logAudit } from "@/lib/audit";
import { vpnApi, VPNResellersAPIError } from "@/lib/vpnresellers";

function makeUsername(userId: string): string {
  // 16 chars: 4-byte hex prefix + slice of user id (alphanumeric only).
  const prefix = randomBytes(4).toString("hex");
  const slug = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  return `vpn${prefix}${slug}`.toLowerCase();
}

function makePassword(): string {
  // 24-char URL-safe random password well within the 50-char API limit.
  return randomBytes(18).toString("base64url");
}

export async function provisionVpnAccountForUser(userId: string) {
  const existing = await db.vpnAccount.findFirst({
    where: { userId, status: { in: ["ACTIVE", "SUSPENDED"] } },
  });
  if (existing) return existing;

  const username = makeUsername(userId);
  const password = makePassword();

  let created;
  try {
    created = await vpnApi().createAccount({ username, password });
  } catch (err) {
    if (err instanceof VPNResellersAPIError && err.isInsufficientBalance) {
      await logAudit({
        userId,
        action: "vpn.account_created",
        metadata: { error: "insufficient_balance" },
      });
      // Best-effort admin alert; never block the original error.
      try {
        const { sendCreditLowAlertEmail } = await import("@/lib/email");
        await sendCreditLowAlertEmail(
          `provisioning hit 402 Insufficient Balance for user ${userId}`,
        );
      } catch (e) {
        console.error("[vpn-provisioning] credit-low alert failed", e);
      }
    }
    throw err;
  }

  const row = await db.vpnAccount.create({
    data: {
      userId,
      vpnResellersId: String(created.id),
      vpnUsername: created.username,
      vpnPasswordEnc: encrypt(password),
      status: "ACTIVE",
    },
  });

  await logAudit({
    userId,
    action: "vpn.account_created",
    target: row.id,
    metadata: { vpnResellersId: row.vpnResellersId, username: row.vpnUsername },
  });

  return row;
}

export async function suspendVpnAccountForUser(userId: string) {
  const row = await db.vpnAccount.findFirst({
    where: { userId, status: "ACTIVE" },
  });
  if (!row) return null;

  await vpnApi().suspendAccount(row.vpnResellersId);
  const updated = await db.vpnAccount.update({
    where: { id: row.id },
    data: { status: "SUSPENDED" },
  });
  await logAudit({
    userId,
    action: "vpn.account_suspended",
    target: row.id,
  });
  return updated;
}

export async function unsuspendVpnAccountForUser(userId: string) {
  const row = await db.vpnAccount.findFirst({
    where: { userId, status: "SUSPENDED" },
  });
  if (!row) return null;

  await vpnApi().unsuspendAccount(row.vpnResellersId);
  const updated = await db.vpnAccount.update({
    where: { id: row.id },
    data: { status: "ACTIVE" },
  });
  await logAudit({
    userId,
    action: "vpn.account_unsuspended",
    target: row.id,
  });
  return updated;
}

export async function terminateVpnAccountForUser(userId: string) {
  const rows = await db.vpnAccount.findMany({
    where: { userId, status: { in: ["ACTIVE", "SUSPENDED"] } },
  });
  for (const row of rows) {
    try {
      await vpnApi().terminateAccount(row.vpnResellersId);
    } catch (err) {
      // If the upstream account is already gone, treat as success.
      if (err instanceof VPNResellersAPIError && err.status === 404) {
        // fallthrough
      } else {
        throw err;
      }
    }
    await db.vpnAccount.update({
      where: { id: row.id },
      data: { status: "TERMINATED" },
    });
    await logAudit({
      userId,
      action: "vpn.account_terminated",
      target: row.id,
    });
  }
  return rows.length;
}
