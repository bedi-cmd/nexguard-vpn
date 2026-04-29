import { Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getCachedServers, regionFor } from "@/lib/vpn-data";
import { CopyButton } from "@/components/dashboard/copy-button";

export const metadata = { title: "Servers" };

export default async function ServersPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  let servers: Awaited<ReturnType<typeof getCachedServers>> = [];
  let fetchError: string | null = null;
  try {
    servers = await getCachedServers();
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load servers";
  }

  const groups = new Map<string, typeof servers>();
  for (const s of servers) {
    const region = regionFor(s.country_code);
    if (!groups.has(region)) groups.set(region, []);
    groups.get(region)!.push(s);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => (a.country_code === b.country_code ? a.city.localeCompare(b.city) : a.country_code.localeCompare(b.country_code)));
  }

  const ordered = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="mx-auto max-w-5xl w-full px-4 py-8 sm:px-6 sm:py-10 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold">Server network</h1>
        <p className="mt-1 text-slate-400">
          {fetchError
            ? "Couldn't reach the upstream server list. Try again in a moment."
            : `${servers.length} servers across ${new Set(servers.map((s) => s.country_code)).size} countries.`}
        </p>
      </header>

      {fetchError && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-4 text-sm text-red-200">{fetchError}</CardContent>
        </Card>
      )}

      {ordered.map(([region, list]) => (
        <section key={region}>
          <h2 className="mb-3 text-sm uppercase tracking-wider text-slate-400">{region}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((s) => {
              const loadPct = Math.max(0, Math.min(100, s.capacity));
              const loadColor =
                loadPct < 60 ? "bg-emerald-500" : loadPct < 85 ? "bg-amber-400" : "bg-red-500";
              return (
                <Card key={s.id} className="border-slate-800 bg-slate-900/50">
                  <CardHeader className="space-y-1.5 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Globe className="size-4 text-cyan-400" />
                        {s.country_code} · {s.city}
                      </CardTitle>
                      <Badge className="text-[10px]">#{s.id}</Badge>
                    </div>
                    <p className="text-xs text-slate-400">{s.name}</p>
                  </CardHeader>
                  <CardContent className="pt-2 text-sm space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Load</span>
                        <span>{loadPct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full ${loadColor}`} style={{ width: `${loadPct}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs text-slate-300 truncate">{s.ip}</code>
                      <CopyButton value={s.ip} label="Copy IP" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
