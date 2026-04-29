/**
 * Internal cron endpoint — re-warms the cached VPN server list.
 *
 * Called by Vercel Cron every 30 minutes. Authentication: the request must
 * carry `Authorization: Bearer ${CRON_SECRET}` (or, on Vercel, the platform's
 * built-in `x-vercel-cron-signature` is also accepted).
 *
 * Note: VPNResellers v3.1 has no /credits endpoint, so the original
 * "credit balance check" cron in the blueprint isn't possible. Instead we
 * use this slot to keep the public server list cache warm + verify the
 * upstream is reachable. If it's not, we surface an admin alert.
 */

import { NextResponse } from "next/server";
import { invalidate } from "@/lib/cache";
import { getCachedServers } from "@/lib/vpn-data";
import { sendCreditLowAlertEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  const isVercelCron = !!req.headers.get("x-vercel-cron-signature");

  if (!isVercelCron) {
    if (!expected || auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    await invalidate("vpn:servers:v1");
    const servers = await getCachedServers();
    return NextResponse.json({
      ok: true,
      servers: servers.length,
      at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[cron:refresh-server-cache] upstream failed", err);
    // Best-effort admin notification.
    await sendCreditLowAlertEmail(`upstream server fetch failed: ${message}`).catch(() => {});
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
