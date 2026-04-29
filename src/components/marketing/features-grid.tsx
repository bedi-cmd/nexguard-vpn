import {
  Zap,
  Shield,
  EyeOff,
  Globe2,
  MonitorSmartphone,
  Headset,
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "WireGuard, fast by default",
    description:
      "Modern protocol with ChaCha20-Poly1305 encryption. ~3× faster than legacy OpenVPN — no battery tax.",
  },
  {
    icon: Shield,
    title: "Kill switch",
    description:
      "Drop the internet the instant the tunnel breaks — your IP never leaks, even on flaky Wi-Fi.",
  },
  {
    icon: EyeOff,
    title: "Strict no-logs",
    description:
      "We don't store your traffic, DNS queries, IP, or connection times. There's nothing to hand over.",
  },
  {
    icon: Globe2,
    title: "50+ locations",
    description:
      "Servers across every populated continent, with low-latency routing to the city closest to you.",
  },
  {
    icon: MonitorSmartphone,
    title: "All your devices",
    description:
      "Native apps for Windows, macOS, Android, and iOS. Up to 5 simultaneous connections.",
  },
  {
    icon: Headset,
    title: "Real human support",
    description:
      "Technical answers from people who actually run VPN infrastructure — not a chatbot loop.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-wider text-brand-cyan">Why NexGuard</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-bold">
          Privacy and security, without compromise.
        </h2>
        <p className="mt-3 text-slate-400">
          Built by engineers who actually use it. Every feature exists because it matters in real
          threat models, not as a marketing checkbox.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-6 transition-colors hover:border-brand-blue/40 hover:bg-white/[0.03]"
          >
            <div
              aria-hidden
              className="absolute inset-0 -z-10 rounded-xl opacity-0 transition-opacity group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(60% 50% at 30% 20%, rgba(59,130,246,0.10), transparent 70%)",
              }}
            />
            <div className="inline-flex size-10 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-cyan ring-1 ring-brand-blue/20">
              <f.icon className="size-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-400">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
