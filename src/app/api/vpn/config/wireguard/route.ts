import { NextResponse } from "next/server";
import { requireUser, rateLimitVpn, vpnError } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { vpnApi } from "@/lib/vpnresellers";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { error, session } = await requireUser();
  if (error || !session) return error!;

  const limited = await rateLimitVpn(req, "config-wireguard");
  if (limited) return limited;

  const url = new URL(req.url);
  const serverId = Number(url.searchParams.get("serverId"));
  if (!serverId) {
    return NextResponse.json({ error: "serverId is required" }, { status: 400 });
  }

  const account = await db.vpnAccount.findFirst({
    where: { userId: session.user.id, status: { in: ["ACTIVE", "SUSPENDED"] } },
  });
  if (!account) {
    return NextResponse.json({ error: "No active VPN account" }, { status: 404 });
  }

  try {
    const file = await vpnApi().downloadWireGuardConfig(account.vpnResellersId, serverId);
    return new NextResponse(typeof file === "string" ? file : JSON.stringify(file), {
      status: 200,
      headers: {
        "Content-Type": "application/x-wireguard-profile",
        "Content-Disposition": `attachment; filename="server-${serverId}.conf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return vpnError(err);
  }
}
