import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { NexGuardLogo } from "./nexguard-logo";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export async function MarketingHeader() {
  const session = await auth();
  const signedIn = !!session?.user;
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-brand-bg/70 backdrop-blur-md">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-14">
        <Link href="/" className="text-slate-100">
          <NexGuardLogo />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-white transition-colors">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Button size="sm" render={<Link href="/dashboard" />}>
              Dashboard
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" render={<Link href="/sign-in" />}>
                Sign in
              </Button>
              <Button size="sm" render={<Link href="/sign-up" />}>
                Get protected
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
