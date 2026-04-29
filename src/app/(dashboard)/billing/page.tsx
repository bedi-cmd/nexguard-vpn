import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isStripeEnabled, getPlan } from "@/lib/stripe";
import { openBillingPortalAction } from "@/lib/stripe-actions";

export const metadata = { title: "Billing" };

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) return null; // layout redirects, this is a safety net

  const enabled = isStripeEnabled();
  const userId = session.user.id;

  const [subscription, payments] = await Promise.all([
    db.subscription.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    db.payment.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <div className="mx-auto max-w-3xl w-full px-6 py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="mt-2 text-slate-400">Manage your subscription and view payment history.</p>
      </div>

      {!enabled && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-amber-200">Billing not yet enabled</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-100/80">
            Stripe is currently disabled in this environment. Once enabled, you&apos;ll be able to
            pick a plan and manage your subscription from here.
            <div className="mt-4">
              <Button render={<Link href="/pricing" />}>View pricing</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {enabled && (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle>Current plan</CardTitle>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-semibold">
                    {getPlan(subscription.plan).label}
                  </span>
                  <Badge>{subscription.status}</Badge>
                </div>
                {subscription.currentPeriodEnd && (
                  <p className="text-sm text-slate-400">
                    {subscription.cancelAtPeriodEnd
                      ? `Cancels on ${formatDate(subscription.currentPeriodEnd)}`
                      : `Renews on ${formatDate(subscription.currentPeriodEnd)}`}
                  </p>
                )}
                <form action={openBillingPortalAction}>
                  <Button type="submit">Manage subscription</Button>
                </form>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-400">You don&apos;t have an active subscription.</p>
                <Button render={<Link href="/pricing" />}>Pick a plan</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-400">No payments yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-slate-400 text-left">
                <tr>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-slate-800/60">
                    <td className="py-2">{formatDate(p.createdAt)}</td>
                    <td className="py-2">{formatAmount(p.amountCents, p.currency)}</td>
                    <td className="py-2 capitalize">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatAmount(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(
      cents / 100,
    );
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
