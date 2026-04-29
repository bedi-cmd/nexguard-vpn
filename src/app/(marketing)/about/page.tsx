import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Lock, Globe2, FileText } from "lucide-react";
import { CtaBanner } from "@/components/marketing/cta-banner";

export const metadata = {
  title: "About NexGuard",
  description:
    "NexGuard is a privacy-first VPN built on modern infrastructure — no logs, no compromises, no theatre.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    icon: Lock,
    title: "Privacy by default",
    body:
      "Every default we ship leans toward less data collection, not more. Kill switch on, DNS forced through tunnel, telemetry off.",
  },
  {
    icon: ShieldCheck,
    title: "Honest engineering",
    body:
      "We use modern protocols because they're better, not because they're new. We document our trade-offs publicly and make them easy to verify.",
  },
  {
    icon: Globe2,
    title: "Real infrastructure",
    body:
      "Real servers in real countries on real 1 Gbps+ links. No virtual locations, no rented residential proxies, no padding.",
  },
  {
    icon: FileText,
    title: "Public transparency",
    body:
      "Yearly transparency report, no-logs policy verifiable on the infrastructure level, and security disclosures handled in the open.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-wider text-brand-cyan">About</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold">A VPN built by people who use one.</h1>
        <p className="mt-5 text-lg text-slate-300/90">
          NexGuard exists because consumer VPNs got loud and slow. We wanted something fast,
          honest, and quiet — so we built it. Modern protocols, strict no-logs, and a small team
          that answers your support emails.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-12">
        <div className="rounded-2xl border border-white/5 bg-brand-bg-soft p-8">
          <h2 className="text-2xl font-bold">Our mission</h2>
          <p className="mt-3 text-slate-300/90 max-w-3xl">
            Make verifiable privacy effortless. Most people will never read a wireshark capture or
            audit a no-logs claim — but they should still get the protection. NexGuard&apos;s job is to
            ship the right defaults so you don&apos;t have to.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-6 hover:border-brand-blue/30 transition-colors"
            >
              <div className="inline-flex size-10 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-cyan ring-1 ring-brand-blue/20">
                <v.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold text-white">{v.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-12 grid gap-6 md:grid-cols-3">
        {[
          { stat: "50+", label: "Server locations" },
          { stat: "0", label: "Logs kept" },
          { stat: "AES-256", label: "Symmetric cipher" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/10 bg-brand-bg-soft p-6 text-center"
          >
            <div className="text-4xl font-bold bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent">
              {s.stat}
            </div>
            <div className="mt-1 text-sm uppercase tracking-wider text-slate-400">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-12">
        <div className="rounded-2xl border border-white/5 bg-brand-bg-soft p-8">
          <h2 className="text-2xl font-bold">Want to talk to us?</h2>
          <p className="mt-3 text-slate-300/90">
            Press, security disclosures, partnerships, or just feedback — we read everything. The
            inbox is staffed by humans, in time zones we work in.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button render={<Link href="/dashboard/support" />}>Contact support</Button>
            <Button variant="outline" render={<Link href="/faq" />}>Read the FAQ</Button>
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
