"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Globe,
  Settings,
  ArrowLeft,
  ScrollText,
} from "lucide-react";
import { NexGuardLogo } from "@/components/marketing/nexguard-logo";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
  { href: "/admin/servers", label: "Servers", icon: Globe },
  { href: "/admin/audit-log", label: "Audit log", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-4">
      <Link href="/" className="mb-4 inline-flex items-center gap-2 px-2 text-slate-100">
        <NexGuardLogo />
        <span className="ml-1 text-[10px] uppercase tracking-wider text-cyan-300">admin</span>
      </Link>
      {ITEMS.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-4 border-t border-slate-800 pt-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/60 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
      </div>
    </nav>
  );
}
