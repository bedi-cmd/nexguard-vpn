export const metadata = {
  title: "Terms of service",
  description: "The rules of the road for using NexGuard.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-16 prose prose-invert prose-headings:font-bold prose-a:text-brand-cyan">
      <h1>Terms of service</h1>
      <p className="text-slate-400">Last updated: April 29, 2026 · This is a draft template — replace before launch.</p>

      <h2>Acceptable use</h2>
      <p>
        You can use NexGuard for any lawful purpose. You may not use the service to send spam,
        run port scans against systems you don&apos;t own, distribute malware, or break the law
        in your jurisdiction.
      </p>

      <h2>Account responsibility</h2>
      <p>
        You&apos;re responsible for keeping your credentials safe. Up to 5 simultaneous device
        connections are allowed per account.
      </p>

      <h2>Refunds</h2>
      <p>
        30-day money-back guarantee on every plan. Email support and we&apos;ll process the
        refund within five business days.
      </p>

      <h2>Termination</h2>
      <p>
        We may suspend accounts engaged in clear abuse (spam, attacks). We&apos;ll give you a
        chance to remediate where possible.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        Service is provided &quot;as is&quot;. Our liability is capped at fees paid in the prior
        12 months. We don&apos;t cover consequential damages.
      </p>
    </article>
  );
}
