import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { isStripeEnabled } from "@/lib/stripe";

export const metadata = { title: "Admin · Billing" };

export default async function AdminBillingPage() {
  const stripeOn = isStripeEnabled();

  const [activeSubs, totalSubs, mrrCents, payments] = await Promise.all([
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.subscription.count(),
    estimateMrrCents(),
    db.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        amountCents: true,
        currency: true,
        status: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    }),
  ]);

  const arrCents = mrrCents * 12;
  const ltv = activeSubs > 0 ? Math.round(arrCents / activeSubs) : 0;

  return (
    <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Billing</h1>
          <p className="mt-1 text-slate-400">
            Revenue snapshot. {stripeOn ? "Stripe is enabled." : "Stripe is disabled — figures are based on stored events only."}
          </p>
        </div>
        <Button
          variant="outline"
          render={<Link href="https://dashboard.stripe.com/" target="_blank" rel="noreferrer noopener" />}
        >
          <ExternalLink className="size-4" />
          Open Stripe dashboard
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="MRR (est.)" value={fmt(mrrCents)} />
        <Stat label="ARR (est.)" value={fmt(arrCents)} />
        <Stat label="Active subs" value={activeSubs.toString()} />
        <Stat label="LTV (active subs)" value={fmt(ltv)} />
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle>Recent payments</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-500">No payment events yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2">User</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 text-slate-400">{fmtDateTime(p.createdAt)}</td>
                    <td className="py-2">{p.user?.email ?? "—"}</td>
                    <td className="py-2">{fmtCurrency(p.amountCents, p.currency)}</td>
                    <td className="py-2">
                      <Badge>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle>Plan distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">
            {totalSubs} total subscriptions across all plans. Detailed breakdowns available in the
            Stripe dashboard once payments are enabled.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

async function estimateMrrCents() {
  const subs = await db.subscription.findMany({
    where: { status: { in: ["ACTIVE", "TRIALING"] } },
    select: { plan: true },
  });
  let mrr = 0;
  for (const s of subs) {
    if (s.plan === "MONTHLY") mrr += 999;
    else if (s.plan === "YEARLY") mrr += Math.round(5999 / 12);
    // Lifetime contributes nothing to MRR.
  }
  return mrr;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardContent className="pt-5 space-y-2">
        <div className="text-xs uppercase tracking-wider text-slate-400">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function fmtCurrency(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

function fmtDateTime(d: Date) {
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
