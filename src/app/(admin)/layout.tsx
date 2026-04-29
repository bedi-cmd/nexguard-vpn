import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth, signOut } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

// Defense in depth — proxy.ts also gates /admin/* but we re-check here so a
// broken proxy can never expose the admin panel.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen flex bg-brand-bg text-slate-100">
      <aside className="hidden md:flex md:flex-col md:w-64 md:border-r md:border-slate-800/80">
        <AdminSidebar />
      </aside>
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-end gap-3 border-b border-slate-800/80 bg-brand-bg/70 backdrop-blur px-4 md:px-6">
          <span className="text-xs text-slate-400">{session.user.email}</span>
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
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
