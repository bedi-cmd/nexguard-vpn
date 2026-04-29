"use client";

import { useActionState, useState, useTransition } from "react";
import { toDataURL } from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  confirmTotpAction,
  disableTotpAction,
  startTotpSetupAction,
  type TotpSetupResult,
} from "@/lib/dashboard-actions";
import { CopyButton } from "@/components/dashboard/copy-button";
import type { ActionResult } from "@/lib/auth-actions";

const initial: ActionResult | null = null;

export function TotpSetup({ enabled }: { enabled: boolean }) {
  const [state, formAction, pending] = useActionState(confirmTotpAction, initial);
  const [setup, setSetup] = useState<(TotpSetupResult & { qr: string }) | null>(null);
  const [, startTransition] = useTransition();
  const [disabling, setDisabling] = useState(false);

  if (enabled && !setup) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-emerald-300">
          Two-factor authentication is enabled.
        </p>
        <Button
          variant="outline"
          disabled={disabling}
          onClick={() => {
            setDisabling(true);
            startTransition(async () => {
              await disableTotpAction();
            });
          }}
        >
          {disabling ? "Disabling…" : "Disable 2FA"}
        </Button>
      </div>
    );
  }

  if (!setup) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-400">
          Add a TOTP authenticator (Google Authenticator, 1Password, Authy) for an extra layer.
        </p>
        <Button
          onClick={async () => {
            const res = await startTotpSetupAction();
            const qr = await toDataURL(res.otpauth);
            setSetup({ ...res, qr });
          }}
        >
          Set up 2FA
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={setup.qr}
          alt="Scan with your authenticator app"
          width={160}
          height={160}
          className="rounded bg-white p-2"
        />
        <div className="space-y-2 text-sm">
          <p className="text-slate-300">Scan the code or enter this secret manually:</p>
          <div className="inline-flex items-center gap-2">
            <code className="rounded bg-slate-800 px-2 py-1 text-xs">{setup.secret}</code>
            <CopyButton value={setup.secret} />
          </div>
        </div>
      </div>

      {state && state.ok && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {state.message}
        </div>
      )}
      {state && !state.ok && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-2">
        <Label htmlFor="totp-code">Enter the 6-digit code</Label>
        <div className="flex gap-2">
          <Input
            id="totp-code"
            name="code"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            autoComplete="one-time-code"
            className="max-w-[120px] tracking-widest text-center"
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Verifying…" : "Confirm"}
          </Button>
        </div>
      </form>
    </div>
  );
}
