import { ShieldCheck, Download, Plug } from "lucide-react";

const STEPS = [
  {
    icon: ShieldCheck,
    title: "Sign up & pick a plan",
    body: "Email and password — that's it. No invasive forms, no fingerprinting. We provision your encrypted account immediately.",
  },
  {
    icon: Download,
    title: "Install the app",
    body: "Native clients for Windows, macOS, Android, and iOS. Or bring your own WireGuard / OpenVPN client.",
  },
  {
    icon: Plug,
    title: "Connect in one tap",
    body: "Pick a country, hit connect, browse anywhere. Kill switch is on by default — you can't leak even by accident.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-wider text-brand-cyan">How it works</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-bold">From signup to safe in 60 seconds.</h2>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3 relative">
        {/* Connector line */}
        <div
          aria-hidden
          className="absolute top-10 left-12 right-12 hidden md:block h-px bg-gradient-to-r from-transparent via-brand-blue/40 to-transparent"
        />
        {STEPS.map((s, i) => (
          <div key={s.title} className="relative">
            <div className="flex flex-col items-center text-center px-2">
              <div className="relative flex size-20 items-center justify-center rounded-2xl border border-brand-blue/30 bg-brand-blue/10 ring-4 ring-brand-bg">
                <s.icon className="size-7 text-brand-cyan" />
                <span className="absolute -top-2 -right-2 inline-flex size-6 items-center justify-center rounded-full bg-gradient-to-r from-brand-blue to-brand-cyan text-xs font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-400 max-w-xs">{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
