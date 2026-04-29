"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  createBillingPortalSession,
  createCheckoutSession,
  isStripeEnabled,
  type Plan,
} from "@/lib/stripe";
import { logAudit } from "@/lib/audit";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function startCheckoutAction(plan: Plan): Promise<void> {
  if (!isStripeEnabled()) {
    redirect("/pricing?stripe=disabled");
  }
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-up?next=${encodeURIComponent(`/pricing?plan=${plan}`)}`);
  }
  const { url } = await createCheckoutSession({
    userId: session.user.id,
    plan,
    successUrl: `${APP_URL}/dashboard?checkout=success`,
    cancelUrl: `${APP_URL}/pricing?checkout=cancelled`,
  });
  await logAudit({
    userId: session.user.id,
    action: "subscription.started",
    metadata: { plan, status: "checkout_initiated" },
  });
  redirect(url);
}

export async function openBillingPortalAction(): Promise<void> {
  if (!isStripeEnabled()) {
    redirect("/billing?stripe=disabled");
  }
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const { url } = await createBillingPortalSession({
    userId: session.user.id,
    returnUrl: `${APP_URL}/billing`,
  });
  redirect(url);
}
