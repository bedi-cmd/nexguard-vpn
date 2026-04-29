import { Star } from "lucide-react";

const QUOTES = [
  {
    name: "Maya R.",
    role: "Investigative journalist",
    quote:
      "I work in places where VPN matters more than any other tool. NexGuard's stealth mode has gotten me online when nothing else worked.",
  },
  {
    name: "Sam D.",
    role: "Security engineer",
    quote:
      "Modern protocols, sane defaults, kill switch on by default. Finally a consumer VPN I can recommend to my mom AND use myself.",
  },
  {
    name: "Yusuf K.",
    role: "Remote developer",
    quote:
      "Wireguard speeds, mac/iOS apps that don't crash, 30-day refund I didn't need. It's just good infrastructure.",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-wider text-brand-cyan">From the field</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Trusted by people who care.</h2>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {QUOTES.map((q) => (
          <figure
            key={q.name}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-6 hover:border-brand-blue/30 transition-colors"
          >
            <div className="flex gap-0.5 text-brand-cyan" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="size-4 fill-current" />
              ))}
            </div>
            <blockquote className="mt-3 text-sm text-slate-200 leading-relaxed">
              &ldquo;{q.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-4 text-sm">
              <span className="text-white font-medium">{q.name}</span>
              <span className="text-slate-500"> — {q.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
