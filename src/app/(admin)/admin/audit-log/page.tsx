import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

export const metadata = { title: "Admin · Audit log" };

const PAGE_SIZE = 50;

const ACTION_COLOR: Record<string, string> = {
  "user.signup": "text-emerald-300",
  "user.signin": "text-cyan-300",
  "user.signin_failed": "text-amber-300",
  "user.password_reset_requested": "text-amber-300",
  "user.password_reset_completed": "text-cyan-300",
  "user.password_changed": "text-cyan-300",
  "user.email_verified": "text-emerald-300",
  "user.totp_enabled": "text-emerald-300",
  "user.totp_disabled": "text-amber-300",
  "user.deleted": "text-red-300",
  "vpn.account_created": "text-emerald-300",
  "vpn.account_suspended": "text-amber-300",
  "vpn.account_unsuspended": "text-cyan-300",
  "vpn.account_terminated": "text-red-300",
  "vpn.password_changed": "text-cyan-300",
  "admin.user_suspended": "text-amber-300",
  "admin.user_unsuspended": "text-cyan-300",
  "admin.user_terminated": "text-red-300",
  "admin.password_reset": "text-amber-300",
  "payment.created": "text-emerald-300",
  "payment.failed": "text-red-300",
  "subscription.started": "text-emerald-300",
  "subscription.cancelled": "text-amber-300",
  "subscription.reactivated": "text-cyan-300",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; user?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where: Record<string, unknown> = {};
  if (params.action) where.action = params.action;
  if (params.user) where.userId = params.user;

  const [entries, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: { user: { select: { email: true } } },
    }),
    db.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold">Audit log</h1>
        <p className="mt-1 text-slate-400">
          Append-only record of security-relevant events. {total} entries
          {params.action && (
            <>
              {" "}
              filtered to <Badge>{params.action}</Badge>{" "}
              <Link href="/admin/audit-log" className="text-cyan-400 hover:underline">
                clear
              </Link>
            </>
          )}
          .
        </p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/50">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                  {fmtDateTime(e.createdAt)}
                </td>
                <td className="px-4 py-3 text-slate-300 truncate max-w-[24ch]">
                  {e.user?.email ?? <span className="text-slate-500">system</span>}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/audit-log?action=${encodeURIComponent(e.action)}`}
                    className={`font-mono text-xs ${ACTION_COLOR[e.action] ?? "text-slate-300"} hover:underline`}
                  >
                    {e.action}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400 truncate max-w-[20ch]">
                  {e.target ?? "—"}
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                  {e.metadata ? truncJson(e.metadata) : "—"}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  No events {params.action ? `for action="${params.action}"` : ""}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            render={
              <Link
                href={`/admin/audit-log?${new URLSearchParams({
                  ...params,
                  page: String(page - 1),
                }).toString()}`}
              />
            }
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            render={
              <Link
                href={`/admin/audit-log?${new URLSearchParams({
                  ...params,
                  page: String(page + 1),
                }).toString()}`}
              />
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function fmtDateTime(d: Date) {
  return new Date(d).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function truncJson(v: unknown): string {
  try {
    const s = JSON.stringify(v);
    return s.length > 60 ? `${s.slice(0, 60)}…` : s;
  } catch {
    return String(v);
  }
}
