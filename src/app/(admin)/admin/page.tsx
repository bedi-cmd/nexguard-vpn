import Link from "next/link";
import { ExternalLink, TrendingUp, Users, ShieldOff, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { isStripeEnabled } from "@/lib/stripe";
import { SignupsLineChart, RevenueByPlanChart } from "@/components/admin/charts";

export const metadata = { title: "Admin · Overview" };

const DAY_MS = 24 * 60 * 60 * 1000;

function thirtyDaysAgo() {
  return new Date(Date.now() - 30 * DAY_MS);
}

function buildEmptyDayBuckets(days: number) {
  const buckets = new Map<string, number>();
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * DAY_MS);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  return buckets;
}

export default async function AdminOverviewPage() {
  const stripeOn = isStripeEnabled();
  const since = thirtyDaysAgo();

  const [
    totalUsers,
    activeSubs,
    suspendedVpn,
    revenueRows,
    signupsRaw,
    recentUsers,
    recentAudit,
  ] = await Promise.all([
    db.user.count(),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.vpnAccount.count({ where: { status: "SUSPENDED" } }),
    db.payment.groupBy({
      by: ["status"],
      _sum: { amountCents: true },
    }),
    db.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, email: true, name: true, role: true, emailVerified: true, createdAt: true },
    }),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, action: true, target: true, userId: true, createdAt: true },
    }),
  ]);

  const totalRevenueCents = revenueRows
    .filter((r) => r.status !== "refunded")
    .reduce((sum, r) => sum + (r._sum.amountCents ?? 0), 0);

  const revenueByPlan = await db.subscription.groupBy({
    by: ["plan"],
    _count: true,
    where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
  });
  const planRevenue = revenueByPlan.map((r) => ({
    plan: r.plan,
    // Approx revenue per plan: count × price (display only).
    revenue:
      r._count *
      (r.plan === "MONTHLY" ? 999 : r.plan === "YEARLY" ? 5999 : 14999),
  }));

  // Bin signups per day for the last 30 days.
  const dayBuckets = buildEmptyDayBuckets(30);
  for (const u of signupsRaw) {
    const k = u.createdAt.toISOString().slice(0, 10);
    if (dayBuckets.has(k)) dayBuckets.set(k, (dayBuckets.get(k) ?? 0) + 1);
  }
  const signupSeries = Array.from(dayBuckets.entries()).map(([day, count]) => ({
    day: day.slice(5),
    count,
  }));

  return (
    <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold">Admin overview</h1>
        <p className="mt-1 text-slate-400">Pulse on users, revenue, and infrastructure.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Users" value={totalUsers.toString()} />
        <Stat icon={TrendingUp} label="Active subs" value={activeSubs.toString()} hint={stripeOn ? undefined : "Stripe disabled"} />
        <Stat icon={Wallet} label="Revenue (lifetime)" value={fmt(totalRevenueCents)} hint={stripeOn ? undefined : "from Stripe events"} />
        <Stat icon={ShieldOff} label="Suspended VPN" value={suspendedVpn.toString()} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-base">Signups — last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            <SignupsLineChart data={signupSeries} />
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-base">Subscription revenue by plan</CardTitle>
          </CardHeader>
          <CardContent>
            {planRevenue.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-slate-500">
                No subscriptions yet.
              </div>
            ) : (
              <RevenueByPlanChart data={planRevenue} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-amber-200 text-base">Reseller balance</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-100/80 space-y-2">
          <p>
            VPNResellers v3.1 doesn&apos;t expose a balance endpoint; check it in the upstream
            dashboard. New account creation will return <code>402 Insufficient Balance</code> if
            the wallet is empty.
          </p>
          <Button
            variant="outline"
            render={<Link href="https://app.vpnresellers.com/" target="_blank" rel="noreferrer noopener" />}
          >
            <ExternalLink className="size-4" />
            Open VPNResellers dashboard
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-base">Recent signups</CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-slate-500">No users yet.</p>
            ) : (
              <ul className="divide-y divide-slate-800/60 text-sm">
                {recentUsers.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <div className="text-slate-100 truncate">{u.email}</div>
                      <div className="text-xs text-slate-500">
                        {u.name ?? "—"} · joined {fmtDate(u.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {u.emailVerified ? (
                        <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                          verified
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30">
                          unverified
                        </Badge>
                      )}
                      {u.role === "ADMIN" && <Badge>admin</Badge>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-base">Recent audit log</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAudit.length === 0 ? (
              <p className="text-sm text-slate-500">No events yet.</p>
            ) : (
              <ul className="divide-y divide-slate-800/60 text-xs font-mono">
                {recentAudit.map((a) => (
                  <li key={a.id} className="py-2 flex items-baseline gap-2">
                    <span className="text-slate-500">{fmtDateTime(a.createdAt)}</span>
                    <span className="text-cyan-300">{a.action}</span>
                    {a.target && <span className="text-slate-400 truncate">{a.target}</span>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardContent className="pt-5 space-y-2">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
          <Icon className="size-4 text-cyan-400" />
          {label}
        </div>
        <div className="text-2xl font-semibold">{value}</div>
        {hint && <div className="text-xs text-slate-500">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtDateTime(d: Date) {
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
