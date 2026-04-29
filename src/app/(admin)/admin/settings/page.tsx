import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isStripeEnabled, PLANS } from "@/lib/stripe";

export const metadata = { title: "Admin · Settings" };

const ENV_KEYS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "ENCRYPTION_KEY",
  "VPNRESELLERS_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "UPSTASH_REDIS_REST_URL",
  "GOOGLE_CLIENT_ID",
] as const;

export default function AdminSettingsPage() {
  const stripeOn = isStripeEnabled();
  const envSummary = ENV_KEYS.map((key) => ({
    key,
    set: !!process.env[key],
    masked: process.env[key]
      ? `${process.env[key]!.slice(0, 4)}…${process.env[key]!.slice(-4)}`
      : null,
  }));

  return (
    <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-slate-400">
          Read-only summary of environment configuration. Rotate secrets in your hosting platform
          (Vercel, .env.local, etc.) — there&apos;s no edit-in-UI by design.
        </p>
      </header>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle>Brand</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <Row label="Name">{process.env.NEXT_PUBLIC_APP_NAME ?? "NexGuard"}</Row>
          <Row label="URL">{process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}</Row>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Plans</CardTitle>
          {!stripeOn && <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30">Stripe disabled</Badge>}
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-2">Plan</th>
                <th className="py-2">Display price</th>
                <th className="py-2">Mode</th>
                <th className="py-2">Stripe price id</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {PLANS.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 font-medium">{p.label}</td>
                  <td className="py-2">
                    {p.price}
                    <span className="text-slate-500"> {p.interval}</span>
                  </td>
                  <td className="py-2 capitalize text-slate-400">{p.mode}</td>
                  <td className="py-2">
                    {process.env[p.priceIdEnv] ? (
                      <code className="rounded bg-slate-800 px-1.5 text-xs">
                        {process.env[p.priceIdEnv]!.slice(0, 8)}…
                      </code>
                    ) : (
                      <span className="text-amber-400 text-xs">missing</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle>Environment</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm divide-y divide-slate-800">
            {envSummary.map((e) => (
              <li key={e.key} className="flex items-center justify-between py-2">
                <code className="text-xs">{e.key}</code>
                {e.set ? (
                  <span className="inline-flex items-center gap-2 text-emerald-300">
                    <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                      set
                    </Badge>
                    <code className="text-xs text-slate-500">{e.masked}</code>
                  </span>
                ) : (
                  <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30">unset</Badge>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle>Email templates</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-400 space-y-2">
          <p>
            Step 8 will surface the React Email previews here. For now, drafts live in
            <code className="rounded bg-slate-800 px-1.5 mx-1">src/lib/email.ts</code> and use the
            console transport when <code className="rounded bg-slate-800 px-1.5 mx-1">RESEND_API_KEY</code>
            is unset.
          </p>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-amber-200">Reseller dashboard</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-100/80 space-y-3">
          <p>
            VPNResellers v3.1 doesn&apos;t expose reseller balance via the API. Check the
            upstream dashboard directly to top up credits.
          </p>
          <Button
            variant="outline"
            render={<Link href="https://app.vpnresellers.com/" target="_blank" rel="noreferrer noopener" />}
          >
            <ExternalLink className="size-4" />
            Open VPNResellers
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-24 text-slate-400 text-xs uppercase tracking-wider">{label}</span>
      <code className="rounded bg-slate-800 px-2 py-1 text-sm">{children}</code>
    </div>
  );
}
