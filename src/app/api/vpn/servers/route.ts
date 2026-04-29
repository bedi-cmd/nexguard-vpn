import { NextResponse } from "next/server";
import { requireUser, rateLimitVpn, vpnError } from "@/lib/api-helpers";
import { getCachedServers } from "@/lib/vpn-data";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const limited = await rateLimitVpn(req, "servers");
  if (limited) return limited;

  try {
    const servers = await getCachedServers();
    return NextResponse.json({ data: servers, cached: true });
  } catch (err) {
    return vpnError(err);
  }
}
