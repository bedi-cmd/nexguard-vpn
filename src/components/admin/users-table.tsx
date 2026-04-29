"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserRowActions } from "./user-row-actions";
import { UsersBulkBar } from "./users-bulk-bar";

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  emailVerified: Date | null;
  createdAt: Date;
  vpnStatus: "ACTIVE" | "SUSPENDED" | "TERMINATED" | "NONE";
  plan: string | null;
}

interface Props {
  rows: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
  initialQuery: string;
  currentUserId: string;
}

export function UsersTable({ rows, total, page, pageSize, initialQuery, currentUserId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const allSelectedOnPage = useMemo(
    () => rows.length > 0 && rows.every((r) => selected.has(r.id)),
    [rows, selected],
  );

  function applyQuery() {
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    params.delete("page");
    router.push(`/admin/users?${params.toString()}`);
  }

  function gotoPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/admin/users?${params.toString()}`);
  }

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    if (allSelectedOnPage) {
      const next = new Set(selected);
      for (const r of rows) next.delete(r.id);
      setSelected(next);
    } else {
      const next = new Set(selected);
      for (const r of rows) next.add(r.id);
      setSelected(next);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyQuery();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search email or name…"
              className="pl-8 w-72"
            />
          </div>
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>
        <UsersBulkBar selectedIds={[...selected]} onClear={() => setSelected(new Set())} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/50">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelectedOnPage}
                  onChange={toggleAll}
                  aria-label="Select all on page"
                />
              </th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">VPN</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((u) => (
              <tr key={u.id} className="text-slate-200">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(u.id)}
                    onChange={() => toggle(u.id)}
                    aria-label={`Select ${u.email}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium truncate max-w-[18ch]">{u.name ?? "—"}</div>
                  <div className="text-xs text-slate-500 truncate max-w-[24ch]">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  {u.role === "ADMIN" ? <Badge>admin</Badge> : <span className="text-slate-400">user</span>}
                </td>
                <td className="px-4 py-3">
                  {u.emailVerified ? (
                    <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                      verified
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30">
                      unverified
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      u.vpnStatus === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : u.vpnStatus === "SUSPENDED"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : u.vpnStatus === "TERMINATED"
                            ? "bg-red-500/10 text-red-300 border-red-500/30"
                            : "bg-slate-700/40 text-slate-300 border-slate-600/40"
                    }
                  >
                    {u.vpnStatus.toLowerCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-400">{u.plan ?? "—"}</td>
                <td className="px-4 py-3 text-slate-400">{fmtDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <UserRowActions
                    userId={u.id}
                    email={u.email}
                    role={u.role}
                    vpnStatus={u.vpnStatus}
                    isSelf={u.id === currentUserId}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                  No users match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Page {page} of {totalPages} · {total} total
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => gotoPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => gotoPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Want a power-user view? Open Prisma Studio:{" "}
        <code className="rounded bg-slate-800 px-1.5">npm run db:studio</code>
        {" · "}
        <Link href="/admin" className="text-cyan-400 hover:underline">
          Back to overview
        </Link>
      </p>
    </div>
  );
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
