import { NextResponse } from "next/server";
import { requireUser, rateLimitVpn } from "@/lib/api-helpers";
import { getUserVpnAccount, getVpnPassword } from "@/lib/vpn-data";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { error, session } = await requireUser();
  if (error || !session) return error!;

  const limited = await rateLimitVpn(req, "account");
  if (limited) return limited;

  const url = new URL(req.url);
  const reveal = url.searchParams.get("reveal") === "1";

  const account = await getUserVpnAccount(session.user.id);
  if (!account) {
    return NextResponse.json({ data: null });
  }

  const password = reveal ? await getVpnPassword(account.id) : null;

  return NextResponse.json({
    data: {
      ...account,
      password,
    },
  });
}
