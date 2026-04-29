export const metadata = {
  title: "Privacy policy",
  description: "How NexGuard handles your data — short version: as little as possible.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-16 prose prose-invert prose-headings:font-bold prose-a:text-brand-cyan">
      <h1>Privacy policy</h1>
      <p className="text-slate-400">Last updated: April 29, 2026 · This is a draft template — replace before launch.</p>

      <h2>What we don&apos;t collect</h2>
      <ul>
        <li>Browsing activity, traffic content, or destination IPs</li>
        <li>DNS queries</li>
        <li>Connection or disconnection timestamps from the VPN</li>
        <li>Bandwidth usage per session</li>
      </ul>

      <h2>What we keep</h2>
      <ul>
        <li>Your account email and (hashed) password</li>
        <li>Subscription and billing records (required by law and by Stripe)</li>
        <li>Audit logs for security-relevant events on your account (sign-in, password change, VPN account state changes)</li>
        <li>Aggregated server health metrics — never tied to a specific user</li>
      </ul>

      <h2>Where data is stored</h2>
      <p>
        Account data is stored in encrypted PostgreSQL hosted in our chosen region. VPN
        infrastructure runs on RAM-only servers — every reboot wipes state.
      </p>

      <h2>Your rights</h2>
      <p>
        You can export, correct, or delete your data at any time from{" "}
        <a href="/dashboard/account">your account</a>. Deletion terminates the upstream VPN
        account and removes all our records within 30 days.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions or data subject requests:{" "}
        <a href="mailto:privacy@example.com">privacy@example.com</a>.
      </p>
    </article>
  );
}
