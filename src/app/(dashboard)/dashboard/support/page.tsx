import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Support" };

const FAQ = [
  {
    q: "Which protocol should I use?",
    a: "WireGuard for everyday use — fastest and most modern. OpenVPN over TCP port 443 if your network blocks UDP. Stealth in restrictive regions where DPI blocks VPN signatures.",
  },
  {
    q: "Why are some servers slower than others?",
    a: "Server load and your physical distance both matter. The Servers page shows live load — pick a low-load server in the country closest to you for best speeds.",
  },
  {
    q: "Can I use the VPN on multiple devices?",
    a: "Yes — your plan covers up to 5 simultaneous connections by default. Set up the same credentials on each device.",
  },
  {
    q: "Do you keep logs?",
    a: "No. The infrastructure is operated under a strict no-logs policy. The only data we retain is what's needed for billing and your account itself.",
  },
  {
    q: "I forgot my VPN password",
    a: "Reset it from the Account page → Change VPN password. Your client will need the new password on next connect.",
  },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl w-full px-4 py-8 sm:px-6 sm:py-10 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold">Support</h1>
        <p className="mt-1 text-slate-400">Common questions, plus a way to reach a human.</p>
      </header>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle>Frequently asked questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {FAQ.map((item) => (
            <details key={item.q} className="rounded-md border border-slate-800 bg-slate-900/40 px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-slate-100">
                {item.q}
              </summary>
              <p className="mt-2 text-sm text-slate-400">{item.a}</p>
            </details>
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle>Still stuck?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300 space-y-3">
          <p>
            Email us and we&apos;ll get back to you within one business day. Include your account
            email and a description of what you tried.
          </p>
          <Button render={<Link href={`mailto:${process.env.EMAIL_ADMIN ?? "support@example.com"}`} />}>
            <Mail className="size-4" />
            Email support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
