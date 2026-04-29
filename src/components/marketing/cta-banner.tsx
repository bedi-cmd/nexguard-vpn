import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <div
        className="relative overflow-hidden rounded-2xl border border-brand-blue/30 p-8 sm:p-12 text-center"
        style={{
          background:
            "radial-gradient(ellipse at 30% 0%, rgba(59,130,246,0.18), transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(34,211,238,0.16), transparent 55%), #0d0d22",
        }}
      >
        <ShieldCheck className="mx-auto size-10 text-brand-cyan" />
        <h2 className="mt-4 text-2xl sm:text-4xl font-bold">
          Try NexGuard risk-free for 30 days.
        </h2>
        <p className="mt-3 mx-auto max-w-xl text-slate-300">
          Money-back guarantee, no questions asked. If we don&apos;t make you faster and safer in a
          month, you don&apos;t pay.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button size="lg" render={<Link href="/sign-up" />}>
            Start your shield
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/pricing" />}>
            See all plans
          </Button>
        </div>
      </div>
    </section>
  );
}
