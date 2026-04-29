const ROWS = [
  { name: "WireGuard",   speed: 95, security: 100, mobile: 100, recommended: true },
  { name: "OpenVPN UDP", speed: 75, security: 100, mobile: 60 },
  { name: "OpenVPN TCP", speed: 60, security: 100, mobile: 60, note: "best for restrictive networks" },
  { name: "IKEv2/IPSec", speed: 80, security: 90,  mobile: 100, note: "best for roaming Wi-Fi ↔ cellular" },
  { name: "Stealth",     speed: 65, security: 90,  mobile: 70,  note: "bypasses deep packet inspection" },
];

export function ProtocolSection() {
  return (
    <section className="border-y border-white/5 bg-white/[0.015]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 grid gap-12 lg:grid-cols-2 items-center">
        <div>
          <p className="text-xs uppercase tracking-wider text-brand-cyan">Powered by WireGuard</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">
            Modern protocol, modern speed.
          </h2>
          <p className="mt-4 text-slate-300/90">
            ~4,000 lines of code. ChaCha20-Poly1305 encryption. Curve25519 key exchange. WireGuard
            is faster, simpler, and easier to audit than 20-year-old OpenVPN — and it runs in
            kernel space on Linux and Android for maximum throughput.
          </p>
          <p className="mt-3 text-slate-400">
            We default to WireGuard. When networks block UDP, NexGuard automatically falls back to
            OpenVPN over TCP/443 — looks like normal HTTPS traffic.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-brand-bg-soft p-5 sm:p-6">
          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 gap-y-3 text-xs">
            <span className="text-slate-500"> </span>
            <span className="text-slate-500 text-right">Speed</span>
            <span className="text-slate-500 text-right">Security</span>
            <span className="text-slate-500 text-right">Mobile</span>
            {ROWS.map((r) => (
              <Row key={r.name} {...r} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({
  name,
  speed,
  security,
  mobile,
  recommended,
  note,
}: {
  name: string;
  speed: number;
  security: number;
  mobile: number;
  recommended?: boolean;
  note?: string;
}) {
  return (
    <>
      <div className="col-span-4 grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 py-2 border-t border-white/5 first:border-t-0">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            {name}
            {recommended && (
              <span className="rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-brand-cyan">
                default
              </span>
            )}
          </div>
          {note && <div className="text-xs text-slate-500">{note}</div>}
        </div>
        <Bar value={speed} />
        <Bar value={security} />
        <Bar value={mobile} />
      </div>
    </>
  );
}

function Bar({ value }: { value: number }) {
  return (
    <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-cyan"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
