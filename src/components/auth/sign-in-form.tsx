"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signInAction, type ActionResult } from "@/lib/auth-actions";
import { GoogleButton } from "./google-button";

const initial: ActionResult | null = null;

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, initial);
  const fieldErrors = !state?.ok ? state?.fieldErrors ?? {} : {};

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-slate-400">
          New here?{" "}
          <Link href="/sign-up" className="text-cyan-400 hover:underline">
            Create an account
          </Link>
        </p>
      </header>

      <GoogleButton />

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <Separator className="flex-1 bg-slate-800" />
        or
        <Separator className="flex-1 bg-slate-800" />
      </div>

      {state && !state.ok && (
        <div
          role="alert"
          className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
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
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-cyan-400 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
