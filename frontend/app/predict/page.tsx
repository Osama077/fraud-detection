"use client";
import { useState } from "react";
import { usePredictSingle } from "@/hooks";
import { PredictionResult } from "@/types";
import { Sidebar } from "@/components/shared/Sidebar";
import { TopBar } from "@/components/shared/TopBar";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { ProbabilityGauge } from "@/components/charts/ProbabilityGauge";
import { Zap, Clock, AlertTriangle, RotateCcw } from "lucide-react";

const V_FIELDS = Array.from({ length: 28 }, (_, i) => `v${i + 1}`);
const defaultValues = Object.fromEntries([["time_seconds", "0"], ["amount", ""], ...V_FIELDS.map((f) => [f, "0"])]);

export default function PredictPage() {
  const [form, setForm] = useState<Record<string, string>>(defaultValues);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const mutation = usePredictSingle();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, parseFloat(v) || 0]));
    const data = await mutation.mutateAsync(payload);
    setResult(data);
  };

  const reset = () => { setResult(null); setForm(defaultValues); };

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar title="Predict Transaction" />
          <main className="flex-1 overflow-y-auto p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Single Transaction Prediction</h1>
              <p className="text-sm text-gray-500 mt-1">Enter transaction features for an instant fraud prediction</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="card p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Time (seconds)</label>
                      <input type="number" step="any" className="input"
                        value={form.time_seconds}
                        onChange={(e) => setForm({ ...form, time_seconds: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Amount ($) <span className="text-red-500">*</span></label>
                      <input type="number" step="any" min="0.01" required className="input"
                        placeholder="e.g. 149.62" value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <p className="label">PCA Features (V1–V28)</p>
                    <p className="text-xs text-gray-400 mb-3">Leave at 0 if unknown.</p>
                    <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                      {V_FIELDS.map((field) => (
                        <div key={field}>
                          <label className="text-xs text-gray-500 mb-0.5 block uppercase">{field}</label>
                          <input type="number" step="any" className="input text-xs py-1.5"
                            value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                      <Zap className="w-4 h-4" />
                      {mutation.isPending ? "Analyzing..." : "Predict Transaction"}
                    </button>
                    {result && (
                      <button type="button" onClick={reset} className="btn-secondary flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" /> Reset
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                {result ? (
                  <>
                    <div className={`card p-6 border-2 flex flex-col items-center gap-4 ${result.is_fraud ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}`}>
                      <ProbabilityGauge probability={result.fraud_probability} threshold={result.decision_threshold} size={200} />
                      <div className="text-center">
                        <p className={`text-xl font-bold ${result.is_fraud ? "text-red-700" : "text-green-700"}`}>
                          {result.is_fraud ? "⚠️ FRAUD DETECTED" : "✅ LEGITIMATE TRANSACTION"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Model: {result.model_version} · Threshold: {(result.decision_threshold * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="card p-5">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Prediction ID</p>
                          <p className="font-mono text-xs text-gray-700 mt-0.5 truncate">{result.prediction_id}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Latency</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <p className="font-semibold text-sm">{result.latency_ms.toFixed(1)} ms</p>
                          </div>
                        </div>
                        {result.alert_id && (
                          <div className="col-span-2">
                            <p className="text-gray-500 text-xs">Fraud Alert Created</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                              <a href="/alerts" className="font-mono text-xs text-amber-600 hover:underline">{result.alert_id}</a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="card p-12 flex flex-col items-center justify-center text-center text-gray-400 h-full min-h-64">
                    <Zap className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-medium">No prediction yet</p>
                    <p className="text-sm mt-1">Fill the form and click Predict</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
