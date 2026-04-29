import { getCachedServers, regionFor } from "@/lib/vpn-data";

export async function ServerNetwork() {
  let servers: Awaited<ReturnType<typeof getCachedServers>> = [];
  try {
    servers = await getCachedServers();
  } catch {
    // Fall back gracefully if upstream is unreachable.
  }

  const countries = new Set(servers.map((s) => s.country_code));
  const regions = new Map<string, number>();
  for (const s of servers) {
    const r = regionFor(s.country_code);
    regions.set(r, (regions.get(r) ?? 0) + 1);
  }

  const stats = [
    { label: "Servers", value: servers.length.toString() || "50+" },
    { label: "Countries", value: countries.size.toString() || "40+" },
    { label: "Regions", value: regions.size.toString() || "5" },
  ];

  return (
    <section className="border-y border-white/5 bg-white/[0.015]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <p className="text-xs uppercase tracking-wider text-brand-cyan">Server network</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">
              Coverage where you actually live and travel.
            </h2>
            <p className="mt-4 text-slate-400">
              We focus on quality routes — every server is on a 1 Gbps+ link with low-jitter
              peering. No server count theatre, just locations that matter.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-white/10 bg-brand-bg-soft p-5 text-center"
                >
                  <div className="text-3xl font-bold bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent">
                    {s.value}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-slate-400">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stylized map */}
          <div className="relative h-72 sm:h-80 rounded-2xl border border-white/10 bg-brand-bg-soft overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 40%, rgba(59,130,246,0.20), transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(34,211,238,0.18), transparent 55%)",
              }}
            />
            <svg viewBox="0 0 600 320" className="absolute inset-0 w-full h-full" aria-hidden>
              <defs>
                <pattern id="dots" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.06)" />
                </pattern>
                <radialGradient id="ping" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="600" height="320" fill="url(#dots)" />

              {/* Abstract continents — stylized blobs, not geographic */}
              <path
                d="M70 90 q 30 -40 80 -30 q 50 10 60 50 q 10 30 -10 60 q -20 30 -70 30 q -40 0 -60 -30 q -20 -40 0 -80z"
                fill="rgba(59,130,246,0.06)"
                stroke="rgba(59,130,246,0.25)"
                strokeWidth="1"
              />
              <path
                d="M260 60 q 50 -30 100 -10 q 40 20 30 60 q -10 40 -60 50 q -50 10 -80 -20 q -20 -40 10 -80z"
                fill="rgba(59,130,246,0.06)"
                stroke="rgba(59,130,246,0.25)"
                strokeWidth="1"
              />
              <path
                d="M420 120 q 50 -10 90 20 q 30 30 10 70 q -20 40 -70 40 q -50 0 -70 -40 q -10 -50 40 -90z"
                fill="rgba(59,130,246,0.06)"
                stroke="rgba(59,130,246,0.25)"
                strokeWidth="1"
              />

              {/* Server dots with pings */}
              {[
                [110, 100], [150, 130], [190, 110], [230, 160],
                [290, 90], [320, 110], [355, 140], [380, 100],
                [460, 150], [490, 180], [510, 200], [430, 200],
                [220, 230], [180, 250], [150, 280],
              ].map(([cx, cy], i) => (
                <g key={i}>
                  <circle cx={cx} cy={cy} r="14" fill="url(#ping)" opacity="0.6" />
                  <circle cx={cx} cy={cy} r="3" fill="#22d3ee" />
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
