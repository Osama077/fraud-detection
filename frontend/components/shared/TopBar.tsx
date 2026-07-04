"use client";
import { useCurrentUser, useHealth, useLogout } from "@/hooks";
import { HealthDot } from "./ui";
import { Bell, LogOut, User } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";

export function TopBar({ title }: { title?: string }) {
  const { data: user } = useCurrentUser();
  const { data: health } = useHealth();
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Left: page title */}
      <div className="text-sm font-medium text-gray-600">{title}</div>

      {/* Right: health + user */}
      <div className="flex items-center gap-4">
        {/* Health indicator */}
        {health && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
            <HealthDot status={health.status} />
            <span className="capitalize">{health.status}</span>
          </div>
        )}

        {/* Notification bell placeholder */}
        <button className="relative text-gray-400 hover:text-gray-600">
          <Bell className="w-5 h-5" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 text-sm"
          >
            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center font-bold text-brand-700 text-xs">
              {user?.full_name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <span className="hidden md:block font-medium text-gray-700">{user?.full_name}</span>
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              {/* Dropdown */}
              <div className="absolute right-0 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-52 py-1 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  <span className={clsx(
                    "inline-block mt-1 text-xs px-2 py-0.5 rounded-full capitalize font-medium",
                    user?.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
