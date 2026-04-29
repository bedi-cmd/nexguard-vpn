import { Hero } from "@/components/marketing/hero";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import { ProtocolSection } from "@/components/marketing/protocol-section";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ServerNetwork } from "@/components/marketing/server-network";
import { Testimonials } from "@/components/marketing/testimonials";
import { CtaBanner } from "@/components/marketing/cta-banner";

export const metadata = {
  // Use absolute (override the layout template) so we don't get "NexGuard … · NexGuard"
  title: { absolute: "NexGuard — Your Shield in the Digital World" },
  description:
    "Privacy-first VPN. Built on WireGuard. Strict no-logs, military-grade encryption, 50+ servers worldwide. NexGuard protects every device you own.",
  alternates: { canonical: "/" },
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "NexGuard",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Windows, macOS, Android, iOS, Linux",
  description:
    "WireGuard-based VPN with strict no-logs policy, AES-256/ChaCha20 encryption, and 50+ servers worldwide.",
  offers: [
    { "@type": "Offer", price: "9.99", priceCurrency: "USD", name: "Monthly" },
    { "@type": "Offer", price: "59.99", priceCurrency: "USD", name: "Yearly" },
    { "@type": "Offer", price: "149.99", priceCurrency: "USD", name: "Lifetime" },
  ],
  url: APP_URL,
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "1284",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <FeaturesGrid />
      <ProtocolSection />
      <HowItWorks />
      <ServerNetwork />
      <Testimonials />
      <CtaBanner />
    </>
  );
}
