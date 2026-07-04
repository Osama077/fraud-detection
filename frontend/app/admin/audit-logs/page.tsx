"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Sidebar } from "@/components/shared/Sidebar";
import { ClipboardList, Search } from "lucide-react";
import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";

interface AuditLog {
  id: number;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN:           "bg-blue-100 text-blue-700",
  USER_REGISTER:        "bg-green-100 text-green-700",
  USER_LOGOUT:          "bg-gray-100 text-gray-600",
  PREDICT_SINGLE:       "bg-purple-100 text-purple-700",
  PREDICT_BATCH_UPLOAD: "bg-indigo-100 text-indigo-700",
  ALERT_UPDATE:         "bg-yellow-100 text-yellow-700",
  MODEL_ACTIVATE:       "bg-orange-100 text-orange-700",
  ADMIN_USER_UPDATE:    "bg-red-100 text-red-700",
  ADMIN_USER_DEACTIVATE:"bg-red-100 text-red-800",
};

export default function AuditLogsPage() {
  const [actionFilter, setActionFilter] = useState("");

  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["audit-logs", actionFilter],
    queryFn: () =>
      api.get("/admin/audit-logs", {
        params: { limit: 200, ...(actionFilter ? { action: actionFilter } : {}) },
      }).then((r) => r.data),
    refetchInterval: 10_000,
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-sm text-gray-500 mt-1">Immutable record of all user actions</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by action..."
              className="input pl-9 w-56 text-sm"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center pt-20">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["#", "Action", "Resource", "IP Address", "User ID", "When"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{log.id}</td>
                    <td className="px-4 py-3">
                      <span className={clsx("px-2 py-0.5 rounded-full text-xs font-medium",
                        ACTION_COLORS[log.action] || "bg-gray-100 text-gray-600")}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {log.resource_type && <span className="capitalize">{log.resource_type}</span>}
                      {log.resource_id && (
                        <span className="font-mono ml-1 text-gray-400">{log.resource_id.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{log.ip_address || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {log.user_id ? `${log.user_id.slice(0, 8)}…` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      No audit logs yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
