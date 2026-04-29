"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeVpnPasswordAction } from "@/lib/dashboard-actions";
import type { ActionResult } from "@/lib/auth-actions";

const initial: ActionResult | null = null;

export function ChangeVpnPasswordForm() {
  const [state, formAction, pending] = useActionState(changeVpnPasswordAction, initial);
  const fieldErrors = !state?.ok ? state?.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="space-y-3">
      {state?.ok && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {state.message}
        </div>
      )}
      {state && !state.ok && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {state.error}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="vpn-password">New VPN password</Label>
        <Input
          id="vpn-password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={50}
          autoComplete="new-password"
        />
        {fieldErrors.password && (
          <ul className="text-xs text-red-300">
            {fieldErrors.password.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
        <p className="text-xs text-slate-500">8–50 characters, no spaces.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="vpn-confirm">Confirm</Label>
        <Input
          id="vpn-confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
        />
        {fieldErrors.confirm && (
          <ul className="text-xs text-red-300">
            {fieldErrors.confirm.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Updating…" : "Change VPN password"}
      </Button>
    </form>
  );
}
