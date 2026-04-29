import Link from "next/link";
import {
  Shield,
  Zap,
  EyeOff,
  Globe2,
  MonitorSmartphone,
  Lock,
  Wand2,
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CtaBanner } from "@/components/marketing/cta-banner";

export const metadata = {
  title: "Features",
  description:
    "Everything you actually need from a VPN — and nothing you don't. WireGuard, kill switch, no-logs, kill switch, split tunneling, multi-device, stealth.",
  alternates: { canonical: "/features" },
};

const SECTIONS = [
  {
    icon: Zap,
    title: "WireGuard, the modern protocol",
    body:
      "Built for the way the internet works in 2026, not 2002. ChaCha20-Poly1305 encryption, Curve25519 key exchange, ~4,000 lines of auditable code. Lower battery drain on mobile, lower CPU on desktop, and 2–3× the throughput of OpenVPN in the field.",
    points: [
      "Sub-second connect time",
      "Survives network switches without dropping the tunnel",
      "Open standard — no proprietary extensions",
    ],
  },
  {
    icon: Shield,
    title: "Kill switch (always-on)",
    body:
      "Nothing leaks if the tunnel breaks. NexGuard's kill switch is a system-level firewall block, not a heuristic — your real IP can't appear during a reconnect, sleep/wake, or network change.",
    points: [
      "OS-level enforcement (Windows WFP, NetworkExtension on Apple, VpnService on Android)",
      "Per-app split tunneling (desktop & Android)",
      "DNS leak protection forced through the tunnel",
    ],
  },
  {
    icon: EyeOff,
    title: "No-logs, by infrastructure",
    body:
      "We don't keep what we don't have. The server fleet is configured to discard traffic logs, DNS queries, source IPs, and session metadata. The only data we retain is your billing record and the account itself — required by law and your bank.",
    points: [
      "Independent infrastructure provider with public no-logs commitment",
      "RAM-only servers — every reboot wipes state",
      "Transparency report posted yearly (even when there's nothing to report)",
    ],
  },
  {
    icon: Wand2,
    title: "Stealth mode for restrictive networks",
    body:
      "When deep packet inspection blocks vanilla VPN, NexGuard's stealth protocol wraps the tunnel inside a TLS 1.3 layer that looks identical to ordinary HTTPS traffic.",
    points: [
      "Defeats most consumer-grade DPI",
      "Recommended for travel to restrictive regions",
      "Optional — toggle from the dashboard",
    ],
  },
  {
    icon: Network,
    title: "Smart routing",
    body:
      "Pick a country, NexGuard picks the lowest-latency server in it. We monitor every server's ping, jitter, and load, and steer you to the best route — automatically updated every minute.",
    points: [
      "Latency-aware server selection",
      "Streaming-optimized routes",
      "Manual override from the Servers page",
    ],
  },
  {
    icon: MonitorSmartphone,
    title: "Every device you own",
    body:
      "Native apps for Windows, macOS, Android, and iOS — same account on up to 5 devices simultaneously. Or roll your own: download a WireGuard config and use any client you trust.",
    points: [
      "5 simultaneous connections per account",
      "Auto-connect on untrusted Wi-Fi (mobile)",
      "Manual .ovpn / WireGuard configs available",
    ],
  },
  {
    icon: Globe2,
    title: "50+ locations on real infrastructure",
    body:
      "Servers in every populated continent on 1 Gbps+ links with low-jitter peering. We don't pad numbers with virtual locations — every IP is in the country we say it is.",
    points: [
      "1 Gbps+ uplinks",
      "No virtual locations",
      "Server status visible from your dashboard",
    ],
  },
  {
    icon: Lock,
    title: "Modern encryption everywhere",
    body:
      "AES-256-GCM where it makes sense, ChaCha20-Poly1305 where it's faster (mobile). Forward secrecy via Curve25519. TLS 1.3 only for our website, with HSTS preload.",
    points: [
      "Forward secrecy on every session",
      "Quantum-resistant-friendly choices (ChaCha20)",
      "TLS 1.3 + HSTS for the dashboard",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-wider text-brand-cyan">Features</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold">
          Built for privacy. Tuned for speed.
        </h1>
        <p className="mt-4 text-slate-300/90">
          Everything below is real, shipping, and enabled by default. No upsells, no premium tiers
          to get the basics right.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button render={<Link href="/sign-up" />}>Start free trial</Button>
          <Button variant="outline" render={<Link href="/pricing" />}>See pricing</Button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-12 space-y-12">
        {SECTIONS.map((s, i) => (
          <div
            key={s.title}
            className={`grid gap-8 lg:grid-cols-2 lg:items-center ${
              i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div className="rounded-2xl border border-white/5 bg-brand-bg-soft p-8 relative overflow-hidden">
              <div
                aria-hidden
                className="absolute inset-0 -z-10"
                style={{
                  background: `radial-gradient(${
                    i % 2 === 0 ? "60% 50% at 30% 20%" : "60% 50% at 70% 80%"
                  }, rgba(59,130,246,0.20), transparent 65%)`,
                }}
              />
              <div className="inline-flex size-12 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-cyan ring-1 ring-brand-blue/20">
                <s.icon className="size-6" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-white">{s.title}</h2>
              <p className="mt-2 text-slate-300/90">{s.body}</p>
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              {s.points.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="mt-1 size-1.5 rounded-full bg-brand-cyan shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <CtaBanner />
    </>
  );
}
