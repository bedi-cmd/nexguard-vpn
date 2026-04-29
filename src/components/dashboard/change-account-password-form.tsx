"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrength } from "@/components/auth/password-strength";
import { changeAccountPasswordAction } from "@/lib/dashboard-actions";
import type { ActionResult } from "@/lib/auth-actions";

const initial: ActionResult | null = null;

export function ChangeAccountPasswordForm() {
  const [state, formAction, pending] = useActionState(changeAccountPasswordAction, initial);
  const [pw, setPw] = useState("");
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
        <Label htmlFor="current">Current password</Label>
        <Input id="current" name="current" type="password" required autoComplete="current-password" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <PasswordStrength value={pw} />
        {fieldErrors.password && (
          <ul className="text-xs text-red-300">
            {fieldErrors.password.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-confirm">Confirm new password</Label>
        <Input
          id="new-confirm"
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
        {pending ? "Updating…" : "Change password"}
      </Button>
    </form>
  );
}
