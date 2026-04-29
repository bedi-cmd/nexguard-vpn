"use client";

import { cn } from "@/lib/utils";

const RULES = [
  { label: "8+ characters", test: (v: string) => v.length >= 8 },
  { label: "lowercase", test: (v: string) => /[a-z]/.test(v) },
  { label: "uppercase", test: (v: string) => /[A-Z]/.test(v) },
  { label: "number", test: (v: string) => /[0-9]/.test(v) },
  { label: "special", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

export function PasswordStrength({ value }: { value: string }) {
  const passed = RULES.map((r) => r.test(value));
  const score = passed.filter(Boolean).length;
  const colors = [
    "bg-slate-700",
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-400",
    "bg-emerald-500",
  ];
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < score ? colors[score] : "bg-slate-800",
            )}
          />
        ))}
      </div>
      <ul className="text-xs text-slate-400 grid grid-cols-2 gap-x-3 gap-y-1">
        {RULES.map((r, i) => (
          <li key={r.label} className={passed[i] ? "text-emerald-400" : ""}>
            {passed[i] ? "✓" : "·"} {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
