/**
 * Render every email template to confirm they all produce valid HTML.
 * Does NOT send any email. Run with:
 *
 *   npx tsx scripts/smoke-emails.ts
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const localPath = resolve(process.cwd(), ".env.local");
if (existsSync(localPath)) loadEnv({ path: localPath, override: true });

import { render } from "@react-email/components";
import WelcomeEmail from "../src/emails/WelcomeEmail";
import VerifyEmail from "../src/emails/VerifyEmail";
import PasswordResetEmail from "../src/emails/PasswordResetEmail";
import SubscriptionConfirmEmail from "../src/emails/SubscriptionConfirmEmail";
import SubscriptionCancelledEmail from "../src/emails/SubscriptionCancelledEmail";
import PaymentFailedEmail from "../src/emails/PaymentFailedEmail";
import CreditLowAlertEmail from "../src/emails/CreditLowAlertEmail";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "NexGuard";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface Sample {
  name: string;
  el: React.ReactElement;
}

const samples: Sample[] = [
  {
    name: "WelcomeEmail",
    el: WelcomeEmail({ name: "Ada Lovelace", appName: APP_NAME, appUrl: APP_URL }),
  },
  {
    name: "VerifyEmail",
    el: VerifyEmail({
      url: `${APP_URL}/verify-email/abc123def456abc123def456abc123def456`,
      appName: APP_NAME,
    }),
  },
  {
    name: "PasswordResetEmail",
    el: PasswordResetEmail({
      url: `${APP_URL}/reset-password/xyz789xyz789xyz789xyz789xyz789xyz789`,
      appName: APP_NAME,
    }),
  },
  {
    name: "SubscriptionConfirmEmail",
    el: SubscriptionConfirmEmail({
      appName: APP_NAME,
      appUrl: APP_URL,
      planLabel: "Yearly",
      amount: "$59.99",
      vpnUsername: "vpn1a2b3c4dada123",
    }),
  },
  {
    name: "SubscriptionCancelledEmail",
    el: SubscriptionCancelledEmail({
      appName: APP_NAME,
      appUrl: APP_URL,
      endsOn: "May 29, 2026",
    }),
  },
  {
    name: "PaymentFailedEmail",
    el: PaymentFailedEmail({
      appUrl: APP_URL,
      amount: "$9.99",
      attemptCount: 2,
      graceDays: 3,
    }),
  },
  {
    name: "CreditLowAlertEmail",
    el: CreditLowAlertEmail({
      reason: "provisioning hit 402 Insufficient Balance for user 123",
      appUrl: APP_URL,
    }),
  },
];

async function main() {
  const outDir = resolve(process.cwd(), ".email-preview");
  mkdirSync(outDir, { recursive: true });

  console.log(`Rendering ${samples.length} templates → ${outDir}\n`);

  for (const s of samples) {
    const html = await render(s.el);
    const path = resolve(outDir, `${s.name}.html`);
    writeFileSync(path, html, "utf8");
    const sizeKb = (html.length / 1024).toFixed(1);
    console.log(`  ✓ ${s.name.padEnd(28)} ${sizeKb} KB → ${path}`);
  }

  console.log("\n✓ All templates rendered.");
  console.log("Open any of the .html files in your browser to preview.");
}

main().catch((err) => {
  console.error("\n✖ Render failed:", err);
  process.exit(1);
});
