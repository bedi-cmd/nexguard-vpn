/**
 * Stripe helpers — gated behind STRIPE_ENABLED.
 *
 * When the flag is "false" (the default in dev), every helper short-circuits
 * with `STRIPE_DISABLED_ERROR` so calling code can render a "Coming Soon"
 * state instead of crashing. The plan catalogue is exported either way so
 * the pricing page can render its three cards.
 */

import Stripe from "stripe";

export const STRIPE_DISABLED_ERROR = "stripe_disabled" as const;

export type Plan = "MONTHLY" | "YEARLY" | "LIFETIME";

export interface PlanInfo {
  id: Plan;
  label: string;
  /** Display price (e.g. "$9.99"). */
  price: string;
  /** Display interval ("/month", "/year", "one-time"). */
  interval: string;
  description: string;
  highlighted?: boolean;
  /** Stripe price id env var (falsy until configured). */
  priceIdEnv: "STRIPE_PRICE_MONTHLY" | "STRIPE_PRICE_YEARLY" | "STRIPE_PRICE_LIFETIME";
  /** "subscription" or "payment" (Lifetime is a one-time payment). */
  mode: "subscription" | "payment";
  amountCents: number;
}

export const PLANS: PlanInfo[] = [
  {
    id: "MONTHLY",
    label: "Monthly",
    price: "$9.99",
    interval: "/month",
    description: "Flexible. Cancel anytime.",
    priceIdEnv: "STRIPE_PRICE_MONTHLY",
    mode: "subscription",
    amountCents: 999,
  },
  {
    id: "YEARLY",
    label: "Yearly",
    price: "$59.99",
    interval: "/year",
    description: "Save 50% versus monthly.",
    highlighted: true,
    priceIdEnv: "STRIPE_PRICE_YEARLY",
    mode: "subscription",
    amountCents: 5999,
  },
  {
    id: "LIFETIME",
    label: "Lifetime",
    price: "$149.99",
    interval: "one-time",
    description: "Pay once. Use forever.",
    priceIdEnv: "STRIPE_PRICE_LIFETIME",
    mode: "payment",
    amountCents: 14999,
  },
];

export function getPlan(planId: Plan): PlanInfo {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) throw new Error(`Unknown plan: ${planId}`);
  return plan;
}

export function isStripeEnabled(): boolean {
  return process.env.STRIPE_ENABLED === "true";
}

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!isStripeEnabled()) {
    throw new StripeDisabledError();
  }
  if (_stripe) return _stripe;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("STRIPE_ENABLED=true but STRIPE_SECRET_KEY is not set.");
  }
  _stripe = new Stripe(secret, { typescript: true });
  return _stripe;
}

export class StripeDisabledError extends Error {
  readonly code = STRIPE_DISABLED_ERROR;
  constructor() {
    super(
      "Stripe is disabled. Set STRIPE_ENABLED=true and configure STRIPE_SECRET_KEY + price ids to enable payments.",
    );
    this.name = "StripeDisabledError";
  }
}

// ───── Helpers ─────

import { db } from "@/lib/db";

/**
 * Ensures the user has a Stripe customer id in our DB. Creates one in Stripe
 * lazily on first use. Throws StripeDisabledError when the flag is off.
 */
export async function ensureStripeCustomer(userId: string): Promise<string> {
  const stripe = getStripe();
  const existing = await db.subscription.findFirst({
    where: { userId, stripeCustomerId: { not: null } },
    select: { stripeCustomerId: true },
  });
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, name: true },
  });
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId },
  });
  return customer.id;
}

/**
 * Create a Checkout Session for a given plan. The caller is expected to
 * redirect the user to the returned URL.
 */
export async function createCheckoutSession(args: {
  userId: string;
  plan: Plan;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string }> {
  const stripe = getStripe();
  const plan = getPlan(args.plan);
  const priceId = process.env[plan.priceIdEnv];
  if (!priceId) {
    throw new Error(`${plan.priceIdEnv} is not set. Configure the Stripe Price id for ${plan.label}.`);
  }

  const customerId = await ensureStripeCustomer(args.userId);
  const session = await stripe.checkout.sessions.create({
    mode: plan.mode,
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    client_reference_id: args.userId,
    metadata: { userId: args.userId, plan: plan.id },
    allow_promotion_codes: true,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { url: session.url };
}

/** Create a Billing Portal session so the user can manage their subscription. */
export async function createBillingPortalSession(args: {
  userId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const stripe = getStripe();
  const customerId = await ensureStripeCustomer(args.userId);
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: args.returnUrl,
  });
  return { url: portal.url };
}

/** Cancel a subscription at period end. */
export async function cancelSubscriptionAtPeriodEnd(stripeSubId: string) {
  const stripe = getStripe();
  return stripe.subscriptions.update(stripeSubId, { cancel_at_period_end: true });
}

/** Get the user's most recent subscription row, if any. */
export async function getSubscriptionStatus(userId: string) {
  const sub = await db.subscription.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return sub;
}
