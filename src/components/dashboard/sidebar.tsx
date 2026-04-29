"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe,
  Home,
  User,
  CreditCard,
  Download,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { NexGuardLogo } from "@/components/marketing/nexguard-logo";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/servers", label: "Servers", icon: Globe },
  { href: "/dashboard/account", label: "Account", icon: User },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/downloads", label: "Downloads", icon: Download },
  { href: "/dashboard/support", label: "Support", icon: HelpCircle },
];

export function DashboardSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-4">
      <Link href="/" className="mb-4 inline-flex items-center gap-2 px-2 text-slate-100">
        <NexGuardLogo />
      </Link>
      {ITEMS.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-slate-800 text-white"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
      {isAdmin && (
        <div className="mt-4 border-t border-slate-800 pt-4">
          <Link
            href="/admin"
            className={cn(
              "inline-flex items-center gap-3 rounded-md px-3 py-2 text-sm text-cyan-300 hover:bg-slate-800/60",
              pathname.startsWith("/admin") && "bg-slate-800",
            )}
          >
            <ShieldCheck className="size-4" />
            Admin
          </Link>
        </div>
      )}
    </nav>
  );
}
