import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PLANS, isStripeEnabled } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { startCheckoutAction } from "@/lib/stripe-actions";

export const metadata = { title: "Pricing" };

const FEATURES: Record<string, string[]> = {
  MONTHLY: [
    "WireGuard, OpenVPN, IKEv2, Stealth",
    "50+ server locations",
    "Up to 5 devices",
    "Cancel anytime",
  ],
  YEARLY: [
    "Everything in Monthly",
    "50% off vs. monthly billing",
    "Priority support",
    "30-day money-back guarantee",
  ],
  LIFETIME: [
    "One payment, forever",
    "All current and future locations",
    "Up to 5 devices",
    "VIP support queue",
  ],
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; plan?: string; stripe?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const enabled = isStripeEnabled();

  return (
    <>
      <section className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-brand-cyan">Pricing</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-bold bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent">
            Simple pricing.
          </h1>
          <p className="mt-4 text-slate-300">
            One plan, every device. WireGuard-fast, no logs, 50+ locations. 30-day money-back
            guarantee.
          </p>
          {!enabled && (
            <Badge className="mt-6 border-amber-500/40 bg-amber-500/10 text-amber-300">
              Checkout opens soon
            </Badge>
          )}
          {params.checkout === "cancelled" && (
            <p className="mt-4 text-amber-300">Checkout cancelled. Pick a plan whenever you&apos;re ready.</p>
          )}
          {params.stripe === "disabled" && (
            <p className="mt-4 text-slate-400">Payments are not yet live in this environment.</p>
          )}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "border-slate-800 bg-slate-900/50",
                plan.highlighted && "border-cyan-500/50 bg-slate-900 ring-1 ring-cyan-500/30",
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.label}</CardTitle>
                  {plan.highlighted && <Badge>Most popular</Badge>}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400 text-sm">{plan.interval}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{plan.description}</p>
              </CardHeader>
              <CardContent className="text-sm text-slate-300">
                <ul className="space-y-2">
                  {(FEATURES[plan.id] ?? []).map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 text-cyan-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-2">
                {!enabled ? (
                  <Button disabled className="w-full">
                    Coming soon
                  </Button>
                ) : !session?.user ? (
                  <Button
                    className="w-full"
                    render={<Link href={`/sign-up?plan=${plan.id}`} />}
                  >
                    Get started
                  </Button>
                ) : (
                  <form
                    action={async () => {
                      "use server";
                      await startCheckoutAction(plan.id);
                    }}
                    className="w-full"
                  >
                    <Button type="submit" className="w-full">
                      Choose {plan.label}
                    </Button>
                  </form>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-slate-500">
          All prices in USD. Taxes may apply at checkout. Cancel anytime from your dashboard.
        </p>
      </section>
    </>
  );
}
