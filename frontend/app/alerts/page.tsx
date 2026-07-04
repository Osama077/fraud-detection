"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Alert } from "@/types";
import { Sidebar } from "@/components/shared/Sidebar";
import toast from "react-hot-toast";
import { AlertTriangle, Clock, CheckCircle, Eye } from "lucide-react";
import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  investigating: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  false_positive: "bg-gray-100 text-gray-600",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-800 font-bold",
};

export default function AlertsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Alert | null>(null);
  const [notes, setNotes] = useState("");

  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["alerts", statusFilter],
    queryFn: () =>
      api.get("/alerts", { params: statusFilter ? { status: statusFilter } : {} })
        .then((r) => r.data),
    refetchInterval: 15_000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      api.put(`/alerts/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      toast.success("Alert updated");
      qc.invalidateQueries({ queryKey: ["alerts"] });
      setSelected(null);
    },
  });

  const handleUpdate = (status: string) => {
    if (!selected) return;
    updateMutation.mutate({ id: selected.id, payload: { status, notes } });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fraud Alerts</h1>
            <p className="text-sm text-gray-500 mt-1">{alerts.length} alerts found</p>
          </div>
          <select
            className="input w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
          </select>
          <a
            href={`/api/v1/alerts/export${statusFilter ? "?status=" + statusFilter : ""}`}
            download
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            ⬇ Export CSV
          </a>
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
                  {["Alert ID", "Severity", "Status", "Created", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{alert.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <span className={clsx("px-2 py-0.5 rounded-full text-xs capitalize", SEVERITY_COLORS[alert.severity])}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx("px-2 py-0.5 rounded-full text-xs capitalize", STATUS_COLORS[alert.status])}>
                        {alert.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelected(alert); setNotes(alert.notes || ""); }}
                        className="flex items-center gap-1 text-brand-600 hover:text-brand-700 text-xs font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review
                      </button>
                    </td>
                  </tr>
                ))}
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      No alerts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail panel */}
        {selected && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Review Alert</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-3 text-sm mb-4">
                <div><span className="text-gray-500">ID:</span> <span className="font-mono text-xs">{selected.id}</span></div>
                <div><span className="text-gray-500">Severity:</span> <span className="capitalize ml-1">{selected.severity}</span></div>
                <div><span className="text-gray-500">Current status:</span> <span className="capitalize ml-1">{selected.status}</span></div>
              </div>
              <div className="mb-4">
                <label className="label">Investigation notes</label>
                <textarea
                  className="input h-24 resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your investigation notes..."
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => handleUpdate("investigating")} className="btn-secondary text-xs flex-1">Set Investigating</button>
                <button onClick={() => handleUpdate("resolved")} className="btn-primary text-xs flex-1">Mark Resolved</button>
                <button onClick={() => handleUpdate("false_positive")} className="btn-secondary text-xs flex-1 text-red-600 border-red-200">False Positive</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
