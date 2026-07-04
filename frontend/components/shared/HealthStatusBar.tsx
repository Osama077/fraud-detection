"use client";
import { useHealth } from "@/hooks";
import { clsx } from "clsx";
import { Database, Server, Cpu, Wifi } from "lucide-react";

export function HealthStatusBar() {
  const { data, isError } = useHealth();

  const services = [
    { label: "Database", value: data?.database, icon: Database },
    { label: "Redis",    value: data?.redis,    icon: Server   },
    { label: "ML Model", value: data?.ml_model, icon: Cpu      },
  ];

  const isOk = (v?: string) => v === "ok" || v === "loaded";

  return (
    <div className="flex items-center gap-3">
      {services.map(({ label, value, icon: Icon }) => (
        <div key={label} className="flex items-center gap-1.5 text-xs">
          <div className={clsx(
            "w-1.5 h-1.5 rounded-full",
            isError || !value ? "bg-gray-300 animate-pulse"
              : isOk(value) ? "bg-green-500"
              : "bg-red-500 animate-pulse"
          )} />
          <Icon className="w-3 h-3 text-gray-400" />
          <span className="text-gray-500 hidden sm:inline">{label}</span>
        </div>
      ))}
    </div>
  );
}
