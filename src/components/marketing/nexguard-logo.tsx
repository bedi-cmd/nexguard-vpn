import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  withWordmark?: boolean;
  size?: number;
}

export function NexGuardLogo({ className, withWordmark = true, size = 28 }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        aria-hidden
        className="shrink-0"
      >
        <defs>
          <linearGradient id="ng-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="ng-grad-soft" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path
          d="M16 2.4 L27.6 6.6 V16 c0 7.4 -5.1 12.4 -11.6 13.8 C9.5 28.4 4.4 23.4 4.4 16 V6.6 z"
          fill="url(#ng-grad-soft)"
          stroke="url(#ng-grad)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M11 16.2 L14.6 19.6 L21 12.6"
          fill="none"
          stroke="url(#ng-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withWordmark && (
        <span className="text-base tracking-tight">
          Nex<span className="bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent">Guard</span>
        </span>
      )}
    </span>
  );
}
