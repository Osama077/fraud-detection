"use client";
import { useState } from "react";
import { Sidebar } from "@/components/shared/Sidebar";
import { TopBar } from "@/components/shared/TopBar";
import { KpiCard } from "@/components/shared/KpiCard";
import { FraudTrendChart } from "@/components/charts/FraudTrendChart";
import { ModelMetricsChart } from "@/components/charts/ModelMetricsChart";
import { ConfusionMatrix } from "@/components/charts/ConfusionMatrix";
import { useDashboardStats, useAlerts, useModels, useFraudTrend, useFraudByAmount, useTopAlerts, useConfusionMatrix } from "@/hooks";
import { CreditCard, ShieldAlert, AlertTriangle, Activity, CheckCircle, ExternalLink } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { clsx } from "clsx";
import Link from "next/link";

function MetricBar({ label, value }: { label: string; value: number | null }) {
  const pct = value ? Math.round(value * 100) : 0;
  const color = pct >= 90 ? "bg-green-500" : pct >= 75 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">{value ? `${pct}%` : "—"}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const SEV_COLOR: Record<string, string> = {
  critical: "bg-red-100 text-red-700", high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700", low: "bg-blue-100 text-blue-700",
};

export default function DashboardPage() {
  const [trendDays, setTrendDays] = useState(7);
  const { data: stats, isLoading }  = useDashboardStats();
  const { data: openAlerts = [] }   = useAlerts("open");
  const { data: models = [] }       = useModels();
  const { data: trendData = [] }    = useFraudTrend(trendDays);
  const { data: amountData = [] }   = useFraudByAmount();
  const { data: cm }                = useConfusionMatrix();
  const { data: topAlerts = [] }    = useTopAlerts(5);

  const chartData = trendData.map((d) => ({ label: d.day.slice(5), transactions: d.total, fraud: d.fraud }));

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <Topbar title="Dashboard" subtitle="Real-time fraud detection overview" />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard label="Total Transactions" value={(stats?.total_transactions ?? 0).toLocaleString()}
            sub={`+${stats?.today_transactions ?? 0} today`} icon={<CreditCard />} color="blue" loading={isLoading} />
          <KpiCard label="Fraud Detected" value={(stats?.total_fraud ?? 0).toLocaleString()}
            sub={`${((stats?.fraud_rate ?? 0) * 100).toFixed(3)}% rate`} icon={<ShieldAlert />} color="red" loading={isLoading} />
          <KpiCard label="Open Alerts" value={openAlerts.length}
            sub="Requires investigation" icon={<AlertTriangle />} color="amber" loading={isLoading} />
          <KpiCard label="Today's Fraud" value={stats?.today_fraud ?? 0}
            sub={`of ${stats?.today_transactions ?? 0} today`} icon={<Activity />} color="purple" loading={isLoading} />
        </div>

        {/* Trend + model metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">Transaction volume</p>
              <div className="flex gap-1">
                {[7, 14, 30].map((d) => (
                  <button key={d} onClick={() => setTrendDays(d)}
                    className={clsx("text-xs px-2.5 py-1 rounded-md border transition-colors",
                      trendDays === d ? "bg-brand-600 text-white border-brand-600" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            {chartData.length > 0
              ? <FraudTrendChart data={chartData} height={220} />
              : <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No transaction data yet — upload a CSV to populate</div>}
          </div>

          <div className="card p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Active model performance</p>
            <div className="space-y-4">
              <MetricBar label="Precision" value={stats?.precision ?? null} />
              <MetricBar label="Recall"    value={stats?.recall    ?? null} />
              <MetricBar label="AUC-ROC"   value={stats?.auc_roc   ?? null} />
            </div>
            {stats?.precision && (
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-green-600">
                <CheckCircle className="w-3.5 h-3.5" /><span>Model active and healthy</span>
              </div>
            )}
          </div>
        </div>

        {/* Amount distribution + Top alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Fraud by amount bucket */}
          <div className="card p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Fraud by transaction amount</p>
            {amountData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={amountData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number, n: string) => [v.toLocaleString(), n]} />
                  <Bar dataKey="fraud" name="Fraud" radius={[4,4,0,0]} maxBarSize={48}>
                    {amountData.map((_, i) => (
                      <Cell key={i} fill={amountData[i].fraud_rate > 0.01 ? "#EF4444" : "#F59E0B"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            )}
          </div>

          {/* Top open alerts */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">Top critical alerts</p>
              <Link href="/alerts" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                View all <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            {topAlerts.length > 0 ? (
              <div className="space-y-2">
                {topAlerts.map((alert) => (
                  <div key={alert.alert_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className={clsx("px-2 py-0.5 rounded-full text-xs font-medium capitalize", SEV_COLOR[alert.severity])}>
                        {alert.severity}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">{alert.alert_id.slice(0,8)}…</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">
                      {Math.round(alert.fraud_probability * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                <CheckCircle className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No open alerts</p>
              </div>
            )}
          </div>
        </div>

        {/* Confusion matrix + model comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {cm && cm.total > 0 && (
            <div className="card p-5">
              <p className="text-sm font-semibold text-gray-700 mb-4">Confusion matrix (live data)</p>
              <ConfusionMatrix matrix={[[cm.tn, cm.fp],[cm.fn, cm.tp]]} />
            </div>
          )}
          {models.length > 0 && (
            <div className="card p-5">
              <p className="text-sm font-semibold text-gray-700 mb-4">
                Model metrics {models.length > 1 ? `(${models.length} versions)` : ""}
              </p>
              <ModelMetricsChart models={models} mode={models.length > 1 ? "bar" : "radar"} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
