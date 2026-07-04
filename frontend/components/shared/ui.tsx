"use client";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";
import React from "react";

// ─── LoadingSpinner ───────────────────────────────────────────────────────────
export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" }[size];
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className={clsx(sz, "animate-spin text-brand-500")} />
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = "fraud" | "safe" | "warn" | "info" | "neutral" | "purple";
const badgeStyles: Record<BadgeVariant, string> = {
  fraud:   "bg-red-100 text-red-700",
  safe:    "bg-green-100 text-green-700",
  warn:    "bg-yellow-100 text-yellow-700",
  info:    "bg-blue-100 text-blue-700",
  neutral: "bg-gray-100 text-gray-600",
  purple:  "bg-purple-100 text-purple-700",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span className={clsx(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      badgeStyles[variant],
      className,
    )}>
      {children}
    </span>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg = "bg-brand-600",
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ElementType;
  iconBg?: string;
  trend?: { value: number; label: string };
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 font-medium truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          {trend && (
            <p className={clsx("text-xs mt-1 font-medium", trend.value >= 0 ? "text-green-600" : "text-red-600")}>
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="w-12 h-12 text-gray-300 mb-4" />}
      <p className="text-base font-semibold text-gray-600">{title}</p>
      {description && <p className="text-sm text-gray-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}


// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

// ─── HealthDot ────────────────────────────────────────────────────────────────
export function HealthDot({ status }: { status: "ok" | "error" | "degraded" | string }) {
  const colors: Record<string, string> = {
    ok:       "bg-green-500",
    loaded:   "bg-green-500",
    error:    "bg-red-500",
    degraded: "bg-yellow-500",
  };
  return (
    <span className={clsx("inline-block w-2 h-2 rounded-full", colors[status] ?? "bg-gray-400")} />
  );
}

