"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signUpAction, type ActionResult } from "@/lib/auth-actions";
import { GoogleButton } from "./google-button";
import { PasswordStrength } from "./password-strength";

const initial: ActionResult | null = null;

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initial);
  const [password, setPassword] = useState("");
  const fieldErrors = !state?.ok ? state?.fieldErrors ?? {} : {};

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-slate-400">
          Already have one?{" "}
          <Link href="/sign-in" className="text-cyan-400 hover:underline">
            Sign in
          </Link>
        </p>
      </header>

      <GoogleButton label="Sign up with Google" />

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <Separator className="flex-1 bg-slate-800" />
        or
        <Separator className="flex-1 bg-slate-800" />
      </div>

      {state?.ok ? (
        <div
          role="status"
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
        >
          {state.message}
        </div>
      ) : state?.error ? (
        <div
          role="alert"
          className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {state.error}
        </div>
      ) : null}

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name (optional)</Label>
          <Input id="name" name="name" autoComplete="name" placeholder="Ada Lovelace" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={fieldErrors.email ? true : undefined}
          />
          {fieldErrors.email && <FieldError messages={fieldErrors.email} />}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={fieldErrors.password ? true : undefined}
          />
          <PasswordStrength value={password} />
          {fieldErrors.password && <FieldError messages={fieldErrors.password} />}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            aria-invalid={fieldErrors.confirmPassword ? true : undefined}
          />
          {fieldErrors.confirmPassword && (
            <FieldError messages={fieldErrors.confirmPassword} />
          )}
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-xs text-slate-500 text-center">
        By creating an account you agree to our Terms and Privacy Policy.
      </p>
    </div>
  );
}

function FieldError({ messages }: { messages: string[] }) {
  return (
    <ul className="text-xs text-red-300 space-y-0.5">
      {messages.map((m) => (
        <li key={m}>{m}</li>
      ))}
    </ul>
  );
}
