import Link from "next/link";
import { NexGuardLogo } from "./nexguard-logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/dashboard/downloads", label: "Apps" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/dashboard/support", label: "Help center" },
      { href: "/sign-in", label: "Sign in" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/terms", label: "Terms" },
    ],
  },
];

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/5 bg-brand-bg/40 mt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2 space-y-3">
          <NexGuardLogo />
          <p className="text-sm text-slate-400 max-w-sm">
            Your shield in the digital world. Privacy-first VPN built on WireGuard, with strict
            no-logs and modern encryption.
          </p>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title}>
            <p className="text-xs uppercase tracking-wider text-slate-500">{c.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-slate-300 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>© {year} NexGuard. All rights reserved.</span>
        <span>Visa · Mastercard · PayPal · Crypto</span>
      </div>
    </footer>
  );
}
