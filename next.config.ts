import type { NextConfig } from "next";

// Imported for its side-effect: throws at build time if any required env var
// is missing or malformed. (Step 10 hardening — replaces the prior runtime
// crash mode with a build failure.)
import "./src/lib/env";

const CSP = [
  "default-src 'self'",
  // Next.js + Turbopack dev needs eval; production keeps unsafe-inline for
  // hydration scripts (no nonces are emitted yet).
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Tailwind / shadcn / next-themes inject inline styles.
  "style-src 'self' 'unsafe-inline'",
  // Self-hosted Inter font (next/font) + data: for embedded glyphs.
  "font-src 'self' data:",
  // Avatars (Google OAuth), favicons, server logos.
  "img-src 'self' data: blob: https:",
  // Outgoing fetches: VPNResellers, Stripe, Resend, Upstash REST, Google OAuth.
  "connect-src 'self' https://api.vpnresellers.com https://*.api.vpnresellers.com https://api.stripe.com https://api.resend.com https://*.upstash.io https://accounts.google.com",
  // Stripe Checkout iframe.
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Defaults for every route.
      { source: "/(.*)", headers: SECURITY_HEADERS },
      // No-store on private surfaces.
      {
        source: "/dashboard/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
};

export default nextConfig;
