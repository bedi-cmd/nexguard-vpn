import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { vpnLimiter, getClientIp } from "@/lib/ratelimit";
import { VPNResellersAPIError } from "@/lib/vpnresellers";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

export async function requireAdmin() {
  const { error, session } = await requireUser();
  if (error || !session) return { error, session: null };
  if (session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session };
}

export async function rateLimitVpn(req: Request, key: string) {
  const ip = getClientIp(req);
  const r = await vpnLimiter.limit(`${key}:${ip}`);
  if (!r.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((r.reset - Date.now()) / 1000)),
          "X-RateLimit-Remaining": String(r.remaining),
        },
      },
    );
  }
  return null;
}

export function vpnError(err: unknown) {
  if (err instanceof VPNResellersAPIError) {
    const status =
      err.status >= 400 && err.status < 600 ? err.status : err.status === 0 ? 502 : 500;
    return NextResponse.json(
      { error: err.message, fieldErrors: err.fieldErrors },
      { status },
    );
  }
  console.error("[api] unexpected", err);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}
