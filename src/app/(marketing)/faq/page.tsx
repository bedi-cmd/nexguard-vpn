import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about NexGuard — billing, protocols, privacy, devices, troubleshooting, and refunds.",
  alternates: { canonical: "/faq" },
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const FAQ = [
  {
    section: "Getting started",
    items: [
      {
        q: "How do I sign up?",
        a: "Click 'Get protected' anywhere on this site, give us an email and password, and pick a plan. Your VPN account is provisioned immediately — no waiting list, no manual review.",
      },
      {
        q: "Which app should I install?",
        a: "We have native apps for Windows, macOS, Android, and iOS. The dashboard auto-detects your platform and links you to the right one. Or use any WireGuard / OpenVPN client with a manual config.",
      },
      {
        q: "How many devices can I use at once?",
        a: "Up to 5 simultaneous connections per account. There's no per-device install limit — you can install on as many machines as you like, just only 5 can be connected at the same time.",
      },
    ],
  },
  {
    section: "Privacy & security",
    items: [
      {
        q: "Do you keep logs of my activity?",
        a: "No. The infrastructure is configured to discard traffic, DNS queries, source IPs, and connection metadata. Servers are RAM-only — every reboot wipes state. The only things we keep on our side are your billing record and account info.",
      },
      {
        q: "What encryption do you use?",
        a: "WireGuard uses ChaCha20-Poly1305 for encryption with Curve25519 for key exchange. OpenVPN uses AES-256-GCM with RSA-4096 or ECDH. IKEv2/IPSec uses AES-256-GCM with Diffie-Hellman Group 20. All meet or exceed AES-256-equivalent strength.",
      },
      {
        q: "Are you protected against DNS leaks?",
        a: "Yes — every NexGuard client forces all DNS queries through the tunnel. We also block DoH bypass attempts and (where the OS allows) IPv6 leaks. The DNS server is operated by us; it doesn't talk to Google/Cloudflare/etc.",
      },
      {
        q: "Where are you incorporated?",
        a: "We operate under the legal framework of our infrastructure provider, who has a public no-logs commitment. Specifics live in the privacy policy — and matter less than the no-logs configuration of the servers themselves.",
      },
    ],
  },
  {
    section: "Protocols & performance",
    items: [
      {
        q: "Which protocol should I use?",
        a: "WireGuard for most situations — it's the fastest. OpenVPN over TCP/443 if your network blocks UDP (corporate firewalls, hotel Wi-Fi). Stealth mode in restrictive regions where DPI actively blocks VPN signatures. The app picks the best one automatically by default.",
      },
      {
        q: "Why is my speed sometimes slower?",
        a: "Three usual suspects: (1) physical distance to the server, (2) server load, (3) your ISP throttling. The Servers page shows live load — pick a low-load server in the country closest to you for best speeds.",
      },
      {
        q: "Does NexGuard work in countries that block VPNs?",
        a: "Stealth mode is designed for exactly this. It wraps the tunnel inside TLS 1.3 so it looks like normal HTTPS. It defeats most consumer-grade DPI but no VPN can guarantee bypass against a determined state actor.",
      },
    ],
  },
  {
    section: "Billing & refunds",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "Visa, Mastercard, American Express, PayPal, and major cryptocurrencies. We use Stripe for card and PayPal processing — your card details never touch our servers.",
      },
      {
        q: "Do you offer a refund?",
        a: "Yes — 30 days, no questions asked. If NexGuard isn't faster and safer than what you have, email support and we'll refund you. The Lifetime plan has the same 30-day guarantee.",
      },
      {
        q: "Can I cancel anytime?",
        a: "Absolutely. From your dashboard → Billing → Manage subscription. Monthly and yearly plans run to the end of the current period; lifetime is a one-time payment with no recurring charges.",
      },
    ],
  },
  {
    section: "Troubleshooting",
    items: [
      {
        q: "My connection drops every few minutes.",
        a: "Almost always a battery-saver killing the VPN service in the background — most common on Xiaomi/Huawei/Samsung Android phones. Allow NexGuard in your battery optimization settings. If it persists, try OpenVPN TCP — some networks throttle UDP.",
      },
      {
        q: "I forgot my VPN password.",
        a: "Sign in to the dashboard → Account → Change VPN password. Your client will need the new password on next connect. (This is different from your account password.)",
      },
      {
        q: "I can't access a streaming service.",
        a: "Try a different server in the same country — load balancers often steer detected VPN IPs to a captcha. The Streaming-optimized routes flag (coming soon) is rolling out per region.",
      },
    ],
  },
];

const flat = FAQ.flatMap((s) => s.items);

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: flat.map((it) => ({
    "@type": "Question",
    name: it.q,
    acceptedAnswer: { "@type": "Answer", text: it.a },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <link rel="canonical" href={`${APP_URL}/faq`} />
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-wider text-brand-cyan">FAQ</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold">Questions, answered.</h1>
        <p className="mt-4 text-slate-300/90">
          {flat.length} of the most common questions. If yours isn&apos;t here, the support team
          replies within one business day.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 pb-12 space-y-10">
        {FAQ.map((sec) => (
          <div key={sec.section}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-cyan">
              {sec.section}
            </h2>
            <div className="mt-3 space-y-2">
              {sec.items.map((it) => (
                <details
                  key={it.q}
                  className="group rounded-lg border border-white/5 bg-white/[0.02] open:bg-white/[0.04] transition-colors"
                >
                  <summary className="cursor-pointer list-none px-5 py-4 flex items-start justify-between gap-3">
                    <span className="text-sm font-medium text-slate-100">{it.q}</span>
                    <span className="text-slate-500 group-open:rotate-180 transition-transform">
                      ▾
                    </span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-slate-300/90">{it.a}</div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 pb-16">
        <div className="rounded-2xl border border-white/5 bg-brand-bg-soft p-6 text-center">
          <h2 className="text-xl font-semibold">Still stuck?</h2>
          <p className="mt-2 text-slate-400">
            Email us — real humans, fast replies.
          </p>
          <div className="mt-4">
            <Button render={<Link href="/dashboard/support" />}>Contact support</Button>
          </div>
        </div>
      </section>
    </>
  );
}
