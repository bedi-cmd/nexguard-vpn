import { Globe2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCachedServers, regionFor } from "@/lib/vpn-data";
import { adminBustServerCacheAction } from "@/lib/admin-actions";

export const metadata = { title: "Admin · Servers" };

export default async function AdminServersPage() {
  let servers: Awaited<ReturnType<typeof getCachedServers>> = [];
  let error: string | null = null;
  try {
    servers = await getCachedServers();
  } catch (err) {
    error = err instanceof Error ? err.message : "Upstream unreachable.";
  }

  const regions = new Map<string, number>();
  for (const s of servers) regions.set(regionFor(s.country_code), (regions.get(regionFor(s.country_code)) ?? 0) + 1);

  return (
    <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Servers</h1>
          <p className="mt-1 text-slate-400">
            Live list from VPNResellers v3.1, cached 5 min. Bust the cache to refresh now.
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await adminBustServerCacheAction();
          }}
        >
          <Button type="submit" variant="outline">
            <RefreshCw className="size-4" />
            Refresh cache
          </Button>
        </form>
      </header>

      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-4 text-sm text-red-200">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="pt-5">
            <div className="text-xs uppercase tracking-wider text-slate-400">Total servers</div>
            <div className="mt-1 text-2xl font-bold">{servers.length}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="pt-5">
            <div className="text-xs uppercase tracking-wider text-slate-400">Countries</div>
            <div className="mt-1 text-2xl font-bold">
              {new Set(servers.map((s) => s.country_code)).size}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="pt-5">
            <div className="text-xs uppercase tracking-wider text-slate-400">Regions</div>
            <div className="mt-1 text-2xl font-bold">{regions.size}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base">All servers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2">ID</th>
                  <th className="py-2">Country</th>
                  <th className="py-2">City</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">IP</th>
                  <th className="py-2">Load</th>
                  <th className="py-2">Region</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {servers.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 font-mono text-xs text-slate-400">#{s.id}</td>
                    <td className="py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <Globe2 className="size-3.5 text-cyan-400" />
                        {s.country_code}
                      </span>
                    </td>
                    <td className="py-2 text-slate-300">{s.city}</td>
                    <td className="py-2 text-slate-400 truncate max-w-[24ch]">{s.name}</td>
                    <td className="py-2 font-mono text-xs text-slate-400">{s.ip}</td>
                    <td className="py-2 text-slate-300">{s.capacity}%</td>
                    <td className="py-2">
                      <Badge>{regionFor(s.country_code)}</Badge>
                    </td>
                  </tr>
                ))}
                {servers.length === 0 && !error && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-sm text-slate-500">
                      No servers returned by the upstream.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
