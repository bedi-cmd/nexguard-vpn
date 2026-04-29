@AGENTS.md

# NexGuard VPN — Project Context for Claude Code

> **Read this file at the start of every session.** It contains everything you need to work on this project effectively.

---

## Project Overview

NexGuard is a commercial VPN service website. The VPN infrastructure (servers, protocols, tunneling) is handled entirely by **VPNResellers.com** (white-label). We build the customer-facing layer: marketing site, authentication, payments, user dashboard, and account management.

- **Brand:** NexGuard — "Your Shield in the Digital World"
- **Domain:** nexguardvpn.com
- **Owner:** Bedi (mustafibedran4@gmail.com)
- **Status:** Infrastructure/deployment pipeline complete. Code implementation in progress.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Components) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 + shadcn/ui v4 |
| State | Zustand |
| Auth | NextAuth.js v5 (Auth.js) — credentials + Google OAuth, JWT strategy |
| ORM | Prisma 7 |
| Database | Neon PostgreSQL (serverless) |
| Payments | Stripe (subscriptions + one-time for lifetime plan) |
| Email | Resend (transactional emails via React Email templates) |
| Cache/Queue | Upstash Redis (serverless) — rate limiting + BullMQ job queue |
| Hosting | Vercel (Hobby plan, project name: "frontend") |
| CDN/DNS | Cloudflare (Free plan, Full strict SSL) |
| VPN API | VPNResellers API v3.1 |
| Testing | Vitest (unit) + Playwright (e2e) |
| Icons | Lucide React |
| React | v19 |

---

## VPNResellers API

```
Base URL: https://api.vpnresellers.com/v3_1/
Auth: Bearer <VPNRESELLERS_API_KEY>
Docs: https://api.vpnresellers.com/docs/v3_1

Endpoints:
  GET    /servers              — List all VPN servers
  POST   /accounts/create      — Create VPN user account
  POST   /accounts/suspend     — Suspend account
  POST   /accounts/unsuspend   — Reactivate account
  POST   /accounts/terminate   — Delete account
  POST   /accounts/password    — Change VPN password
  GET    /credits              — Reseller credit balance
  GET    /accounts             — List all accounts
```

**Business flow:** User signs up on our site -> pays via Stripe -> our backend calls VPNResellers API to create a VPN account -> user gets credentials + downloads white-label app -> subscription lapses = suspend -> renews = unsuspend -> cancels = terminate.

---

## Design System

**Style:** Dark & Clean (premium, trustworthy — NOT cyberpunk)

**Colors:**
- Background Primary: `#0a0a1a` (near-black with blue tint)
- Background Secondary: `#111127` (cards)
- Background Tertiary: `#1a1a3e` (hover states)
- Border: `#1e1e4a`
- Primary: `#3b82f6` (blue — buttons, links)
- Primary Hover: `#2563eb`
- Accent: `#22d3ee` (cyan — highlights, glows)
- Accent Glow: `rgba(34, 211, 238, 0.15)`
- Text Primary: `#f8fafc` (white headings)
- Text Secondary: `#94a3b8` (body)
- Text Muted: `#64748b` (captions)
- Success: `#22c55e` | Warning: `#f59e0b` | Error: `#ef4444`

**Typography:** Inter (Google Fonts). Hero: 64px bold. Section: 40px bold. Card title: 20px semibold. Body: 16px. Small: 14px.

**Effects:** Card hover = translateY(-4px) + accent glow shadow. Buttons = subtle gradient + hover scale(1.02). Transitions: 0.3s ease. Scroll = fade-in-up on viewport entry.

**Animations:**
- Hero: CSS/SVG animated globe with pulsing connection lines
- Server page: Flat SVG world map with animated location dots
- No animations on text-heavy pages (about, FAQ, legal)

---

## Project Structure

```
/src
  /app
    /(marketing)        — Home, Features, Pricing, Servers, About, FAQ, Blog, Contact, Downloads
    /(auth)             — Sign-in, Sign-up, Forgot-password, Verify-email, Reset-password
    /(dashboard)        — Overview, Servers, Account, Billing, Downloads, Support
    /(admin)            — Dashboard, Users, Billing, Servers, Settings
    /api
      /webhooks/stripe  — Stripe webhook handler
      /vpn              — VPN account management endpoints
      /auth             — NextAuth route handlers
  /components
    /ui                 — shadcn components
    /marketing          — Hero, features, pricing sections
    /dashboard          — Sidebar, stats cards, server list
    /shared             — Navbar, footer, theme toggle
  /lib
    /vpnresellers.ts    — VPNResellers API client (singleton, retry logic, typed errors)
    /stripe.ts          — Stripe helpers
    /auth.ts            — NextAuth config
    /db.ts              — Prisma client singleton
    /env.ts             — Environment variable validation (@t3-oss/env-nextjs)
    /email.ts           — Resend email service
    /audit.ts           — Audit logging
    /utils.ts           — General utilities
  /emails               — React Email templates (Welcome, Verify, Reset, SubscriptionConfirm, etc.)
  /prisma
    /schema.prisma      — DB schema (users, vpn_accounts, subscriptions, payments, audit_logs)
```

---

## Database Schema (Core Tables)

- **users** — id, email, password_hash, name, totp_secret, email_verified, role, timestamps
- **vpn_accounts** — id, user_id, vpnresellers_id, vpn_username, vpn_password_enc, status, protocol_pref, max_devices, timestamps
- **subscriptions** — id, user_id, stripe_sub_id, stripe_customer_id, plan (monthly/yearly/lifetime), status, current_period_end, timestamps
- **payments** — id, user_id, stripe_payment_id, amount_cents, currency, status, timestamps
- **audit_logs** — id, user_id, action, target, ip_hash, metadata, timestamp (append-only)

---

## Pricing

| Plan | Price | Billing |
|------|-------|---------|
| Monthly | $9.99/mo | Recurring |
| Yearly | $59.99/yr ($4.99/mo) | Recurring — "Save 50%" |
| Lifetime | $149.99 | One-time payment |

All plans include all features. 30-day money-back guarantee. Yearly plan is the primary conversion target (highlighted in UI).

---

## Deployment Infrastructure (Complete)

| Service | Status | Details |
|---------|--------|---------|
| Cloudflare DNS | Active | nexguardvpn.com, Full (strict) SSL, nameservers: abby/george.ns.cloudflare.com |
| Vercel | Deployed | Project "frontend" (Hobby), auto-deploy URL: frontend-nine-tau-66.vercel.app |
| Upstash Redis | Ready | nexguard-rate-limit (free tier), REST URL: probable-goshawk-81121.upstash.io |
| Resend | Pending verification | API key "NexGuardVPN-Production" created, DNS records added |
| Neon Postgres | Needs setup | DATABASE_URL placeholder in Vercel |
| Stripe | Needs setup | Keys not yet added |

**Vercel Environment Variables (9 configured):**
- Real values: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, NEXT_PUBLIC_APP_URL, NODE_ENV
- Placeholders to replace: DATABASE_URL, VPNRESELLERS_API_KEY, AUTH_SECRET, ENCRYPTION_KEY, RESEND_API_KEY

**To go fully live:**
1. Push code to Git repo and connect to Vercel
2. Replace 5 placeholder env vars with real credentials
3. Add Stripe keys (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET)

---

## Security Requirements

- Passwords: bcrypt cost 12+ or Argon2id
- JWT: 15-min access + 7-day refresh tokens
- Rate limiting: 10 req/min on auth, 30 req/min on VPN routes, 100 req/min general
- Headers: HSTS, strict CSP, X-Frame-Options DENY, nosniff, strict referrer
- All env vars validated at build time via @t3-oss/env-nextjs
- VPNResellers API key NEVER exposed to client — all calls go through our API routes
- User PII encrypted at rest (AES-256)
- Stripe handles PCI compliance — never store card numbers
- Audit logging for auth events, VPN account changes, admin actions, payments

---

## VPN Protocols (for content/UI)

| Protocol | Speed | Security | Stealth | Use Case |
|----------|-------|----------|---------|----------|
| WireGuard | Best | Best | Low | DEFAULT — general use |
| OpenVPN TCP | Moderate | Best | High | Restricted networks (port 443) |
| OpenVPN UDP | Good | Best | Medium | Streaming |
| IKEv2 | Good | Good | Low | Mobile roaming (MOBIKE) |
| Stealth | Moderate | Good | Best | Censorship bypass (China, Iran, Russia, UAE) |
| L2TP | Low | Fair | None | Legacy devices only |
| PPTP | — | Broken | — | NEVER USE — crackable in <24hrs |

---

## Key Architecture Decisions

- **Next.js over separate backend:** VPNResellers handles VPN infra, so our app is a SaaS dashboard. Server Actions + API routes eliminate the need for Express/Go.
- **PostgreSQL over MongoDB:** Subscriptions, payments, account mappings are relational. Prisma gives type-safe queries.
- **Async VPN provisioning:** VPNResellers API calls go through a job queue (BullMQ + Redis) so we never block the user's request.
- **White-label apps first:** Start with VPNResellers' branded apps. Custom native clients (Flutter) are Phase 3 only if needed.
- **Cache server list:** Redis TTL 5 min. One API call serves all users.
- **No-logs policy:** Never log which VPN server a user connects to, connection times, bandwidth per session, or user IP addresses.

---

## Coding Conventions

- Use App Router (NOT pages router)
- Server Components by default, Client Components only for interactive parts
- Zod validation on ALL API inputs (client + server)
- All VPNResellers API calls: retry 3x with exponential backoff (1s, 2s, 4s), 10s timeout
- Typed errors for API client: VPNResellersAPIError with status, message, endpoint
- Use `export const vpnApi = new VPNResellersClient()` singleton
- Mobile-first responsive design
- Dark theme as default (next-themes)
- SSG for marketing pages (ISR with 60s revalidation)
- JSDoc comments on all public methods
- Lucide icons throughout

---

## Reference Files

- `VPN_ARCHITECTURE_BLUEPRINT.md` — Full architecture doc with 10 Claude Code ready prompts (run in order)
- `CLAUDE_DESIGN_GUIDE.md` — Complete design system + page-by-page design prompts for UI generation

---

## Build Prompts Execution Order

The architecture blueprint contains 10 prompts to build the entire application. Run them in this order:

**Phase 1 — Foundation:** Prompt 1 (scaffold) -> Prompt 2 (API client) -> Prompt 3 (auth)
**Phase 2 — Monetization:** Prompt 4 (Stripe payments) -> Prompt 5 (dashboard)
**Phase 3 — Marketing:** Prompt 6 (marketing pages) -> Prompt 7 (admin panel) -> Prompt 8 (email system)
**Phase 4 — Polish:** Prompt 9 (testing + deployment config) -> Prompt 10 (security hardening)

All 10 prompts are in `VPN_ARCHITECTURE_BLUEPRINT.md` Section 8.

---

## Implementation Notes (corrections to the blueprint)

> Several items above describe the *blueprint intent*. The shipped code diverges in places — keep these in mind:

- **VPNResellers v3.1 endpoints differ from the blueprint's approximations.** The actual paths are:
  - `POST /accounts` (create), `DELETE /accounts/{id}` (terminate),
    `PUT /accounts/{id}/disable` (suspend), `PUT /accounts/{id}/enable` (unsuspend),
    `PUT /accounts/{id}/change_password`. Plus `check_username`, `ports`, `geoip`,
    `configuration` (OpenVPN), `accounts/{id}/wireguard-configuration`.
  - `GET /credits` **does not exist** in v3.1. `vpnApi.getCredits()` throws
    `VPNResellersNotSupportedError`. Reseller balance must be checked in the
    upstream dashboard at https://app.vpnresellers.com/.
- **No BullMQ.** VPN provisioning runs inline in the Stripe webhook handler with
  a try/catch fallback (subscription marked `INCOMPLETE` on failure; admin can retry
  from `/admin/users` via the row dropdown). The 3× retry with backoff is built into
  the VPNResellers client itself, not a job queue.
- **Build steps 1–10 are complete.** This file's "Status: Code implementation in progress"
  is from the original spec; the codebase is in place. See git log / `app/` for current state.
- **Implementation specifics that are easier to read from the code than restate here:**
  Prisma schema in `prisma/schema.prisma` (uses Prisma 7 — DB URL in `prisma.config.ts`,
  not the schema file). Proxy gating + per-route-group rate limits in `src/proxy.ts`
  (Next.js 16 renamed `middleware.ts` → `proxy.ts`). CSP and other security headers
  in `next.config.ts` and mirrored in `vercel.json`.
