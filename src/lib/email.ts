/**
 * Email pipeline.
 *
 * - Templates live in `src/emails/*` as React Email components.
 * - This module renders them to HTML + plain text and sends via Resend.
 * - Dev fallback: when RESEND_API_KEY is unset, the rendered email is logged
 *   to the console (subject + plain-text body).
 * - 3-attempt retry with exponential backoff (250ms / 500ms / 1s) on
 *   transient Resend errors.
 */

import "server-only";
import { Resend } from "resend";
import { render, toPlainText } from "@react-email/components";
import WelcomeEmail from "@/emails/WelcomeEmail";
import VerifyEmail from "@/emails/VerifyEmail";
import PasswordResetEmail from "@/emails/PasswordResetEmail";
import SubscriptionConfirmEmail from "@/emails/SubscriptionConfirmEmail";
import SubscriptionCancelledEmail from "@/emails/SubscriptionCancelledEmail";
import PaymentFailedEmail from "@/emails/PaymentFailedEmail";
import CreditLowAlertEmail from "@/emails/CreditLowAlertEmail";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "NexGuard";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const FROM = process.env.EMAIL_FROM ?? `${APP_NAME} <noreply@example.com>`;
const ADMIN = process.env.EMAIL_ADMIN ?? "";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _resend = new Resend(key);
  return _resend;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function deliver({ to, subject, html, text }: SendArgs): Promise<void> {
  const resend = getResend();

  if (!resend) {
    console.info(
      `[email:console] to=${to} from=${FROM} subject=${JSON.stringify(subject)}\n${text}\n`,
    );
    return;
  }

  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await resend.emails.send({ from: FROM, to, subject, html, text });
      if (result.error) throw new Error(result.error.message ?? "Resend error");
      console.info(`[email:resend] sent to=${to} subject="${subject}" id=${result.data?.id}`);
      return;
    } catch (err) {
      lastErr = err;
      if (attempt === 3) break;
      await sleep(250 * 2 ** (attempt - 1));
    }
  }
  console.error(`[email:resend] failed after 3 attempts to=${to} subject="${subject}"`, lastErr);
  // Don't throw — emails should never break user flows.
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function renderEmail(
  el: React.ReactElement,
): Promise<{ html: string; text: string }> {
  const html = await render(el);
  const text = toPlainText(html);
  return { html, text };
}

// ───────── Public API ─────────

export async function sendWelcomeEmail(to: string, args: { name?: string | null }) {
  const { html, text } = await renderEmail(
    WelcomeEmail({ name: args.name, appName: APP_NAME, appUrl: APP_URL }),
  );
  await deliver({ to, subject: `Welcome to ${APP_NAME}`, html, text });
}

export async function sendVerifyEmail(to: string, url: string) {
  const { html, text } = await renderEmail(VerifyEmail({ url, appName: APP_NAME }));
  await deliver({ to, subject: `Verify your email for ${APP_NAME}`, html, text });
}

export async function sendPasswordResetEmail(to: string, url: string) {
  const { html, text } = await renderEmail(PasswordResetEmail({ url, appName: APP_NAME }));
  await deliver({ to, subject: `Reset your ${APP_NAME} password`, html, text });
}

export async function sendSubscriptionConfirmEmail(
  to: string,
  args: { planLabel: string; amountCents: number; currency: string; vpnUsername?: string | null },
) {
  const amount = formatCents(args.amountCents, args.currency);
  const { html, text } = await renderEmail(
    SubscriptionConfirmEmail({
      appName: APP_NAME,
      appUrl: APP_URL,
      planLabel: args.planLabel,
      amount,
      vpnUsername: args.vpnUsername,
    }),
  );
  await deliver({ to, subject: `You're on ${args.planLabel} — welcome to ${APP_NAME}`, html, text });
}

export async function sendSubscriptionCancelledEmail(to: string, args: { endsOn: Date }) {
  const endsOn = args.endsOn.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const { html, text } = await renderEmail(
    SubscriptionCancelledEmail({ appName: APP_NAME, appUrl: APP_URL, endsOn }),
  );
  await deliver({ to, subject: `Your ${APP_NAME} subscription is cancelled`, html, text });
}

export async function sendPaymentFailedEmail(
  to: string,
  args: { amountCents: number; currency: string; attemptCount?: number; graceDays?: number },
) {
  const amount = formatCents(args.amountCents, args.currency);
  const { html, text } = await renderEmail(
    PaymentFailedEmail({
      appUrl: APP_URL,
      amount,
      attemptCount: args.attemptCount,
      graceDays: args.graceDays,
    }),
  );
  await deliver({ to, subject: `Action needed: payment failed for ${APP_NAME}`, html, text });
}

/** Notifies the admin (EMAIL_ADMIN) that VPNResellers reseller balance is low. */
export async function sendCreditLowAlertEmail(reason: string) {
  if (!ADMIN) {
    console.warn("[email] EMAIL_ADMIN is not set; CreditLowAlert dropped:", reason);
    return;
  }
  const { html, text } = await renderEmail(CreditLowAlertEmail({ reason, appUrl: APP_URL }));
  await deliver({
    to: ADMIN,
    subject: `[${APP_NAME}] VPNResellers balance: ${reason}`,
    html,
    text,
  });
}

function formatCents(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

// ───── Backwards-compat shim for code still using the old API ─────
// (Step 3 wired sendEmail() with rendered HTML; we re-route to deliver().)

export async function sendEmail(args: { to: string; subject: string; html: string; text?: string }) {
  await deliver({
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text ?? toPlainText(args.html),
  });
}

export function renderVerifyEmail(args: { url: string; appName: string }) {
  // Synchronous render is no longer the model — kept as a helper for tests.
  return {
    subject: `Verify your email for ${args.appName}`,
    html: `<p>Verify: <a href="${args.url}">${args.url}</a></p>`,
    text: `Verify: ${args.url}`,
  };
}

export function renderPasswordResetEmail(args: { url: string; appName: string }) {
  return {
    subject: `Reset your ${args.appName} password`,
    html: `<p>Reset: <a href="${args.url}">${args.url}</a></p>`,
    text: `Reset: ${args.url}`,
  };
}
