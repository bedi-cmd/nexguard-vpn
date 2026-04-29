import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, EyeOff, Globe2, Lock } from "lucide-react";

const TRUST = [
  { icon: ShieldCheck, label: "AES-256 / WireGuard" },
  { icon: EyeOff, label: "No-logs policy" },
  { icon: Globe2, label: "50+ server locations" },
  { icon: Lock, label: "Kill switch" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Glow blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 25%, rgba(59,130,246,0.18), transparent 65%), radial-gradient(50% 40% at 80% 70%, rgba(34,211,238,0.14), transparent 60%)",
        }}
      />
      {/* Grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/30 bg-brand-blue/10 px-3 py-1 text-xs text-brand-cyan">
          <span className="size-1.5 rounded-full bg-brand-cyan" />
          NexGuard 1.0 — built on WireGuard
        </span>
        <h1 className="mt-6 text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight">
          Your Shield in the
          <br />
          <span className="bg-gradient-to-r from-brand-blue via-cyan-300 to-brand-cyan bg-clip-text text-transparent">
            Digital World.
          </span>
        </h1>
        <p className="mt-6 mx-auto max-w-2xl text-base sm:text-lg text-slate-300/90">
          Modern, private, fast VPN. Military-grade encryption, strict no-logs, and a server in
          every region you actually visit. NexGuard protects every device you own.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" render={<Link href="/sign-up" />}>
            Get protected now
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/pricing" />}>
            View pricing
          </Button>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          {TRUST.map((t) => (
            <div
              key={t.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5"
            >
              <t.icon className="size-3.5 text-brand-cyan" />
              {t.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
