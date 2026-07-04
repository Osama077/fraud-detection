"use client";
import { clsx } from "clsx";

type Variant = "fraud" | "safe" | "warn" | "info" | "gray";

const VARIANTS: Record<Variant, string> = {
  fraud: "bg-red-100 text-red-700 border border-red-200",
  safe:  "bg-green-100 text-green-700 border border-green-200",
  warn:  "bg-yellow-100 text-yellow-700 border border-yellow-200",
  info:  "bg-blue-100 text-blue-700 border border-blue-200",
  gray:  "bg-gray-100 text-gray-600 border border-gray-200",
};

interface StatusBadgeProps {
  label: string;
  variant?: Variant;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ label, variant = "gray", dot = false, className }: StatusBadgeProps) {
  return (
    <span className={clsx(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
      VARIANTS[variant],
      className,
    )}>
      {dot && (
        <span className={clsx("w-1.5 h-1.5 rounded-full", {
          "bg-red-500":    variant === "fraud",
          "bg-green-500":  variant === "safe",
          "bg-yellow-500": variant === "warn",
          "bg-blue-500":   variant === "info",
          "bg-gray-400":   variant === "gray",
        })} />
      )}
      {label}
    </span>
  );
}

// Helpers for common use-cases
export function AlertSeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, Variant> = {
    critical: "fraud", high: "fraud", medium: "warn", low: "info",
  };
  return <StatusBadge label={severity} variant={map[severity] ?? "gray"} dot />;
}

export function AlertStatusBadge({ status }: { status: string }) {
  const map: Record<string, Variant> = {
    open: "fraud", investigating: "warn",
    resolved: "safe", false_positive: "gray",
  };
  return (
    <StatusBadge
      label={status.replace("_", " ")}
      variant={map[status] ?? "gray"}
      dot
    />
  );
}

export function PredictionBadge({ label }: { label: 0 | 1 }) {
  return label === 1
    ? <StatusBadge label="FRAUD"      variant="fraud" dot />
    : <StatusBadge label="Legitimate" variant="safe"  dot />;
}
