import Link from "next/link";
import { NexGuardLogo } from "@/components/marketing/nexguard-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-1 bg-brand-bg text-slate-100">
      {/* Form column */}
      <div className="flex flex-1 flex-col px-6 py-10 sm:px-12 lg:px-20">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-200 hover:text-white">
          <NexGuardLogo />
        </Link>
        <div className="flex flex-1 items-center">
          <div className="w-full max-w-md mx-auto">{children}</div>
        </div>
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} NexGuard. All rights reserved.
        </p>
      </div>

      {/* Branding column */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-blue-600/20 to-cyan-400/10 border-l border-slate-800 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.25),transparent_60%),radial-gradient(circle_at_70%_70%,rgba(34,211,238,0.18),transparent_55%)]"
        />
        <div className="relative max-w-md px-8 text-center">
          <NexGuardLogo size={56} withWordmark={false} className="mx-auto" />
          <h2 className="mt-6 text-2xl font-bold bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent">
            Your shield in the digital world
          </h2>
          <p className="mt-3 text-slate-300">
            WireGuard-first. No logs. 50+ locations. Your traffic, your business.
          </p>
        </div>
      </div>
    </div>
  );
}
