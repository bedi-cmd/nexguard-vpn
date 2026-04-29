"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "./copy-button";

export function RevealPassword({ password }: { password: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="inline-flex items-center gap-2">
      <code className="rounded bg-slate-800 px-2 py-1 text-sm">
        {shown ? password : "•".repeat(Math.min(password.length, 16))}
      </code>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide" : "Show"}
      >
        {shown ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </Button>
      <CopyButton value={password} />
    </div>
  );
}
