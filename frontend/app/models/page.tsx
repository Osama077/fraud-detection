"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ModelVersion } from "@/types";
import { Sidebar } from "@/components/shared/Sidebar";
import toast from "react-hot-toast";
import { Cpu, CheckCircle, Activity, Zap } from "lucide-react";
import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";

export default function ModelsPage() {
  const qc = useQueryClient();

  const { data: models = [], isLoading } = useQuery<ModelVersion[]>({
    queryKey: ["models"],
    queryFn: () => api.get("/models").then((r) => r.data),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/models/${id}/activate`).then((r) => r.data),
    onSuccess: (data: ModelVersion) => {
      toast.success(`Model ${data.version_tag} is now active`);
      qc.invalidateQueries({ queryKey: ["models"] });
    },
    onError: () => toast.error("Failed to activate model"),
  });

  const fmt = (v: number | null) => (v != null ? `${(v * 100).toFixed(1)}%` : "—");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Model Versions</h1>
          <p className="text-sm text-gray-500 mt-1">View training metrics and activate model versions</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center pt-20">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : models.length === 0 ? (
          <div className="card p-16 text-center text-gray-400">
            <Cpu className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No models trained yet</p>
            <p className="text-sm mt-1">Run the training pipeline to register a model version</p>
          </div>
        ) : (
          <div className="space-y-4">
            {models.map((m) => (
              <div
                key={m.id}
                className={clsx(
                  "card p-5 border-2 transition-colors",
                  m.is_active ? "border-brand-400 bg-brand-50" : "border-gray-200"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center",
                      m.is_active ? "bg-brand-600" : "bg-gray-200")}>
                      <Cpu className={clsx("w-5 h-5", m.is_active ? "text-white" : "text-gray-500")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{m.version_tag}</h3>
                        {m.is_active && (
                          <span className="flex items-center gap-1 text-xs font-medium text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 capitalize">
                        {m.algorithm.replace("_", " ")}
                        {m.smote_applied && " + SMOTE"}
                        {" · "}
                        {formatDistanceToNow(new Date(m.trained_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {!m.is_active && (
                    <button
                      onClick={() => activateMutation.mutate(m.id)}
                      disabled={activateMutation.isPending}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" /> Activate
                    </button>
                  )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-4 mt-5 pt-4 border-t border-gray-100">
                  {[
                    { label: "Precision", value: fmt(m.precision_score) },
                    { label: "Recall",    value: fmt(m.recall_score) },
                    { label: "F1 Score",  value: fmt(m.f1_score) },
                    { label: "AUC-ROC",   value: fmt(m.auc_roc) },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <p className="text-xl font-bold text-gray-900">{value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Hyperparams */}
                {Object.keys(m.hyperparams).length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2">Hyperparameters</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(m.hyperparams)
                        .filter(([k]) => !["confusion_matrix", "algorithm"].includes(k))
                        .map(([k, v]) => (
                          <span key={k} className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {k}: {String(v)}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
