import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { UsersTable, type AdminUserRow } from "@/components/admin/users-table";

export const metadata = { title: "Admin · Users" };

const PAGE_SIZE = 25;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const q = (params.q ?? "").trim();
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        vpnAccounts: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true },
        },
        subscriptions: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { plan: true, status: true },
        },
      },
    }),
    db.user.count({ where }),
  ]);

  const rows: AdminUserRow[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
    vpnStatus: (u.vpnAccounts[0]?.status ?? "NONE") as AdminUserRow["vpnStatus"],
    plan: u.subscriptions[0]?.plan ?? null,
  }));

  return (
    <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold">Users</h1>
        <p className="mt-1 text-slate-400">Search, suspend/unsuspend VPN accounts, manage roles.</p>
      </header>
      <UsersTable
        rows={rows}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        initialQuery={q}
        currentUserId={session?.user?.id ?? ""}
      />
    </div>
  );
}
