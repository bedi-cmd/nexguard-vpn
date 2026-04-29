import Link from "next/link";
import { CheckCircle2, Circle, Globe, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isStripeEnabled, getPlan } from "@/lib/stripe";
import { getCachedServers, getUserVpnAccount, getVpnPassword } from "@/lib/vpn-data";
import { CopyButton } from "@/components/dashboard/copy-button";
import { RevealPassword } from "@/components/dashboard/reveal-password";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const [subscription, vpnAccount, servers] = await Promise.all([
    db.subscription.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    getUserVpnAccount(userId),
    getCachedServers().catch(() => [] as Awaited<ReturnType<typeof getCachedServers>>),
  ]);

  const password = vpnAccount ? await getVpnPassword(vpnAccount.id) : null;
  const stripeOn = isStripeEnabled();

  const checklist = [
    { label: "Verify your email", done: !!session.user.emailVerified, href: "/dashboard/account" },
    { label: "Pick a plan", done: !!subscription, href: "/pricing" },
    { label: "Provision your VPN account", done: !!vpnAccount, href: "/pricing" },
    { label: "Download a client app", done: false, href: "/dashboard/downloads" },
  ];

  return (
    <div className="mx-auto max-w-5xl w-full px-4 py-8 sm:px-6 sm:py-10 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold">
          Welcome{session.user.name ? `, ${session.user.name}` : ""}.
        </h1>
        <p className="mt-1 text-slate-400">Your VPN at a glance.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Shield className="size-4 text-cyan-400" />}
          label="Plan"
          value={subscription ? getPlan(subscription.plan).label : "None"}
          hint={
            subscription
              ? subscription.cancelAtPeriodEnd
                ? "Cancels at period end"
                : subscription.currentPeriodEnd
                  ? `Renews ${formatDate(subscription.currentPeriodEnd)}`
                  : "Active"
              : "Pick a plan to get started"
          }
        />
        <StatCard
          icon={<Globe className="size-4 text-cyan-400" />}
          label="Servers"
          value={String(servers.length)}
          hint={
            servers.length
              ? `${new Set(servers.map((s) => s.country_code)).size} countries`
              : "Loading…"
          }
        />
        <StatCard
          icon={<Shield className="size-4 text-cyan-400" />}
          label="VPN account"
          value={vpnAccount ? vpnAccount.status : "Inactive"}
          hint={vpnAccount ? `Created ${formatDate(vpnAccount.createdAt)}` : "Provision after checkout"}
        />
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>VPN credentials</CardTitle>
          {vpnAccount && <Badge>{vpnAccount.status}</Badge>}
        </CardHeader>
        <CardContent>
          {vpnAccount && password ? (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-400 w-24">Username</span>
                <code className="rounded bg-slate-800 px-2 py-1">{vpnAccount.vpnUsername}</code>
                <CopyButton value={vpnAccount.vpnUsername} />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-400 w-24">Password</span>
                <RevealPassword password={password} />
              </div>
              <p className="pt-2 text-slate-400">
                Use these credentials in your VPN client. Manage them on the{" "}
                <Link href="/dashboard/account" className="text-cyan-400 hover:underline">
                  account page
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-400">
                You don&apos;t have a VPN account yet.
                {stripeOn
                  ? " Pick a plan to get one provisioned automatically."
                  : " Payments are not yet live in this environment — once enabled, plan checkout will provision a VPN account for you."}
              </p>
              <div className="flex gap-2">
                <Button render={<Link href="/pricing" />}>View plans</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {checklist.map((step) => (
              <li key={step.label} className="flex items-center gap-3">
                {step.done ? (
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="size-4 text-slate-500 shrink-0" />
                )}
                <Link
                  href={step.href}
                  className={
                    step.done
                      ? "text-slate-400 line-through"
                      : "text-slate-200 hover:text-white"
                  }
                >
                  {step.label}
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardContent className="pt-5 space-y-2">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
          {icon}
          {label}
        </div>
        <div className="text-2xl font-semibold">{value}</div>
        {hint && <div className="text-xs text-slate-500">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
