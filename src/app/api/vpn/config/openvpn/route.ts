import { NextResponse } from "next/server";
import { requireUser, rateLimitVpn, vpnError } from "@/lib/api-helpers";
import { vpnApi } from "@/lib/vpnresellers";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const limited = await rateLimitVpn(req, "config-openvpn");
  if (limited) return limited;

  const url = new URL(req.url);
  const serverId = Number(url.searchParams.get("serverId"));
  const portId = url.searchParams.get("portId") ? Number(url.searchParams.get("portId")) : undefined;
  if (!serverId) {
    return NextResponse.json({ error: "serverId is required" }, { status: 400 });
  }

  try {
    const file = await vpnApi().downloadOpenVPNConfig({ serverId, portId });
    return new NextResponse(typeof file === "string" ? file : JSON.stringify(file), {
      status: 200,
      headers: {
        "Content-Type": "application/x-openvpn-profile",
        "Content-Disposition": `attachment; filename="server-${serverId}.ovpn"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return vpnError(err);
  }
}
