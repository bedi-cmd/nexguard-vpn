/**
 * Stripe webhook handler.
 *
 * - Returns 503 when STRIPE_ENABLED is false (the project default in dev).
 * - Verifies the signature using STRIPE_WEBHOOK_SECRET.
 * - Idempotency: each event id is recorded in `stripe_events`; duplicate
 *   deliveries return 200 immediately.
 *
 * Handled events:
 *   - checkout.session.completed       → save subscription, provision VPN
 *   - customer.subscription.updated    → sync status / period end
 *   - customer.subscription.deleted    → suspend VPN (don't terminate yet)
 *   - invoice.payment_failed           → flag past_due
 *   - invoice.payment_succeeded        → unsuspend if previously past_due
 */

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe, isStripeEnabled, getPlan, type Plan } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";
import {
  provisionVpnAccountForUser,
  suspendVpnAccountForUser,
  unsuspendVpnAccountForUser,
} from "@/lib/vpn-provisioning";
import {
  sendCreditLowAlertEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
  sendSubscriptionConfirmEmail,
} from "@/lib/email";
import { VPNResellersAPIError } from "@/lib/vpnresellers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isStripeEnabled()) {
    return NextResponse.json(
      { error: "Stripe is disabled. Set STRIPE_ENABLED=true to enable." },
      { status: 503 },
    );
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const stripe = getStripe();
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency — atomic insert on the events table.
  try {
    await db.stripeEvent.create({ data: { id: event.id, type: event.type } });
  } catch {
    console.info(`[stripe-webhook] duplicate event ${event.id} ignored`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await dispatch(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[stripe-webhook] handler failed for ${event.type}`, err);
    // Return 500 so Stripe retries.
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}

async function dispatch(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.updated":
      await onSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await onSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_failed":
      await onPaymentFailed(event.data.object as Stripe.Invoice);
      break;
    case "invoice.payment_succeeded":
      await onPaymentSucceeded(event.data.object as Stripe.Invoice);
      break;
    default:
      console.info(`[stripe-webhook] unhandled event type: ${event.type}`);
  }
}

// ───── Handlers ─────

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId ?? session.client_reference_id;
  const plan = session.metadata?.plan as Plan | undefined;
  if (!userId || !plan) {
    throw new Error(`checkout.session.completed missing userId/plan: ${session.id}`);
  }

  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const subId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  await db.subscription.upsert({
    where: { stripeSubId: subId ?? `cs_${session.id}` },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubId: subId ?? `cs_${session.id}`,
      plan,
      status: "ACTIVE",
      currentPeriodEnd: null,
    },
    update: {
      stripeCustomerId: customerId,
      status: "ACTIVE",
    },
  });

  await db.payment.create({
    data: {
      userId,
      stripePaymentId: session.payment_intent ? String(session.payment_intent) : session.id,
      amountCents: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      status: session.payment_status ?? "complete",
    },
  });

  await logAudit({ userId, action: "payment.created", metadata: { sessionId: session.id, plan } });

  // Best-effort VPN provisioning. If the upstream API is down, the subscription
  // row is still saved; admin panel (Step 7) can retry.
  let vpnUsername: string | null = null;
  try {
    const account = await provisionVpnAccountForUser(userId);
    vpnUsername = account.vpnUsername;
  } catch (err) {
    console.error("[stripe-webhook] VPN provisioning failed; will need manual retry", err);
    await db.subscription.update({
      where: { stripeSubId: subId ?? `cs_${session.id}` },
      data: { status: "INCOMPLETE" },
    });
    if (err instanceof VPNResellersAPIError && err.isInsufficientBalance) {
      await sendCreditLowAlertEmail(
        `provisioning hit 402 Insufficient Balance for user ${userId}`,
      );
    }
  }

  // Confirmation email (best-effort).
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (user?.email) {
    const planInfo = getPlan(plan);
    await sendSubscriptionConfirmEmail(user.email, {
      planLabel: planInfo.label,
      amountCents: session.amount_total ?? planInfo.amountCents,
      currency: session.currency ?? "usd",
      vpnUsername,
    }).catch((e) => console.error("[stripe-webhook] confirm email failed", e));
  }
}

async function onSubscriptionUpdated(sub: Stripe.Subscription) {
  const row = await db.subscription.findUnique({ where: { stripeSubId: sub.id } });
  if (!row) {
    console.warn(`[stripe-webhook] subscription.updated for unknown sub ${sub.id}`);
    return;
  }
  const status = mapSubscriptionStatus(sub.status);
  // Stripe API: current_period_end is on the subscription item in newer versions; fall back.
  const periodEnd =
    "current_period_end" in sub && typeof (sub as { current_period_end?: number }).current_period_end === "number"
      ? new Date((sub as { current_period_end: number }).current_period_end * 1000)
      : null;
  await db.subscription.update({
    where: { id: row.id },
    data: {
      status,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });

  if (status === "PAST_DUE") {
    await suspendVpnAccountForUser(row.userId).catch((e) =>
      console.error("[stripe-webhook] suspend failed", e),
    );
  }
}

async function onSubscriptionDeleted(sub: Stripe.Subscription) {
  const row = await db.subscription.findUnique({ where: { stripeSubId: sub.id } });
  if (!row) return;
  await db.subscription.update({
    where: { id: row.id },
    data: { status: "CANCELLED" },
  });
  await suspendVpnAccountForUser(row.userId).catch((e) =>
    console.error("[stripe-webhook] suspend failed", e),
  );
  await logAudit({ userId: row.userId, action: "subscription.cancelled" });

  const user = await db.user.findUnique({ where: { id: row.userId }, select: { email: true } });
  if (user?.email) {
    const endsOn = row.currentPeriodEnd ?? new Date();
    await sendSubscriptionCancelledEmail(user.email, { endsOn }).catch((e) =>
      console.error("[stripe-webhook] cancel email failed", e),
    );
  }
}

async function onPaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;
  const row = await db.subscription.findFirst({ where: { stripeCustomerId: customerId } });
  if (!row) return;
  await db.subscription.update({
    where: { id: row.id },
    data: { status: "PAST_DUE" },
  });
  await logAudit({ userId: row.userId, action: "payment.failed", metadata: { invoiceId: invoice.id } });

  const user = await db.user.findUnique({ where: { id: row.userId }, select: { email: true } });
  if (user?.email) {
    await sendPaymentFailedEmail(user.email, {
      amountCents: invoice.amount_due ?? 0,
      currency: invoice.currency ?? "usd",
      attemptCount: invoice.attempt_count ?? 1,
      graceDays: 3,
    }).catch((e) => console.error("[stripe-webhook] failed-payment email failed", e));
  }
}

async function onPaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;
  const row = await db.subscription.findFirst({ where: { stripeCustomerId: customerId } });
  if (!row) return;
  if (row.status !== "PAST_DUE") return;
  await db.subscription.update({
    where: { id: row.id },
    data: { status: "ACTIVE" },
  });
  await unsuspendVpnAccountForUser(row.userId).catch((e) =>
    console.error("[stripe-webhook] unsuspend failed", e),
  );
  await logAudit({ userId: row.userId, action: "subscription.reactivated" });
}

function mapSubscriptionStatus(s: Stripe.Subscription.Status) {
  switch (s) {
    case "active":
      return "ACTIVE" as const;
    case "trialing":
      return "TRIALING" as const;
    case "past_due":
      return "PAST_DUE" as const;
    case "canceled":
      return "CANCELLED" as const;
    case "incomplete":
    case "incomplete_expired":
      return "INCOMPLETE" as const;
    case "unpaid":
      return "PAST_DUE" as const;
    case "paused":
      return "INCOMPLETE" as const;
    default:
      return "INCOMPLETE" as const;
  }
}

// Stripe sends GET to confirm the URL is alive when adding a webhook endpoint
// in the dashboard. Returning a friendly 200 helps that flow.
export function GET() {
  return NextResponse.json({
    ok: true,
    enabled: isStripeEnabled(),
    message: isStripeEnabled()
      ? "Stripe webhook endpoint ready"
      : "Stripe currently disabled",
  });
}
