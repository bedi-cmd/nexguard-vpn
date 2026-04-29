import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth, signOut } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { NexGuardLogo } from "@/components/marketing/nexguard-logo";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="min-h-screen flex bg-brand-bg text-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:border-r md:border-slate-800/80">
        <DashboardSidebar isAdmin={isAdmin} />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <MobileNav isAdmin={isAdmin} />
            <Link href="/dashboard">
              <NexGuardLogo />
            </Link>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span className="hidden sm:inline">{session.user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
