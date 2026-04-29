import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig, { AUTH_PATHS } from "@/lib/auth.config";
import { authLimiter, generalLimiter, getClientIp } from "@/lib/ratelimit";
import type { Role } from "@/generated/prisma/enums";

const { auth } = NextAuth(authConfig);

// Stripe webhook source IP allowlist (validated additionally by signature in
// the route handler — this is a coarse pre-filter).
// Source: https://docs.stripe.com/ips#webhook-notifications
const STRIPE_IP_ALLOWLIST = new Set([
  "3.18.12.63",
  "3.130.192.231",
  "13.235.14.237",
  "13.235.122.149",
  "18.211.135.69",
  "35.154.171.200",
  "52.15.183.38",
  "54.88.130.119",
  "54.88.130.237",
  "54.187.174.169",
  "54.187.205.235",
  "54.187.216.72",
]);

function rateLimitResponse(remaining: number, resetMs: number) {
  return new NextResponse(
    JSON.stringify({ error: "Too many requests. Try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((resetMs - Date.now()) / 1000)),
        "X-RateLimit-Remaining": String(remaining),
      },
    },
  );
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const role = (req.auth?.user as { role?: Role } | undefined)?.role;
  const ip = getClientIp(req);

  // ───── Stripe webhook: IP-allowlist + bypass general ratelimit ─────
  // (signature verification still runs in the route handler)
  if (pathname.startsWith("/api/webhooks/stripe")) {
    if (process.env.NODE_ENV === "production" && ip !== "unknown" && !STRIPE_IP_ALLOWLIST.has(ip)) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return NextResponse.next();
  }

  // ───── Internal cron endpoint — no ratelimit, auth handled in route ─────
  if (pathname.startsWith("/api/internal/")) {
    return NextResponse.next();
  }

  // ───── /api/auth/*: 10/min/IP ─────
  if (pathname.startsWith("/api/auth/")) {
    const r = await authLimiter.limit(`ip:${ip}`);
    if (!r.success) return rateLimitResponse(r.remaining, r.reset);
    return NextResponse.next();
  }

  // ───── /api/vpn/*: handled at the route layer (per-user 30/min) ─────
  // Skip the general limiter here so authed users on the dashboard don't trip it.
  if (pathname.startsWith("/api/vpn/")) {
    return NextResponse.next();
  }

  // ───── General API ratelimit: 100/min/IP for any other /api/* ─────
  if (pathname.startsWith("/api/")) {
    const r = await generalLimiter.limit(`ip:${ip}`);
    if (!r.success) return rateLimitResponse(r.remaining, r.reset);
  }

  // ───── Gate /admin/* (auth + ADMIN role) ─────
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const url = new URL("/sign-in", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // ───── Gate /dashboard/* (auth) ─────
  if (pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      const url = new URL("/sign-in", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ───── Bounce signed-in users away from auth pages ─────
  const isAuthPath = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  if (isLoggedIn && isAuthPath) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|txt)).*)",
  ],
};
