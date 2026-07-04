"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  Shield, LayoutDashboard, Zap, Upload,
  AlertTriangle, Cpu, LogOut, Users,
  ClipboardList, CreditCard, Settings,
} from "lucide-react";
import { clsx } from "clsx";

const nav = [
  { label: "Dashboard",    href: "/dashboard",   icon: LayoutDashboard },
  { label: "Predict",      href: "/predict",      icon: Zap             },
  { label: "Upload Batch", href: "/upload",       icon: Upload          },
  { label: "Transactions", href: "/transactions", icon: CreditCard      },
  { label: "Fraud Alerts", href: "/alerts",       icon: AlertTriangle   },
  { label: "Models",       href: "/models",       icon: Cpu             },
  { label: "Settings",     href: "/settings",     icon: Settings        },
];
const adminNav = [
  { label: "Users",      href: "/admin/users",      icon: Users         },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = () => { Cookies.remove("access_token"); Cookies.remove("refresh_token"); router.push("/auth/login"); };

  return (
    <aside className="w-64 bg-brand-900 text-white flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div><span className="font-bold text-white">FraudShield</span><p className="text-xs text-white/50">v1.0.0</p></div>
      </div>

      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className={clsx(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
              ? "bg-brand-600 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
          )}><Icon className="w-4 h-4 shrink-0" />{label}</Link>
        ))}
        <div className="pt-4 mt-2 border-t border-white/10">
          <p className="text-[10px] font-semibold text-white/40 px-3 mb-2 uppercase tracking-wider">Admin</p>
          {adminNav.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith(href) ? "bg-brand-600 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
            )}><Icon className="w-4 h-4 shrink-0" />{label}</Link>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-white/10">
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors">
          <LogOut className="w-4 h-4 shrink-0" />Sign out
        </button>
      </div>
    </aside>
  );
}
