"use client";

interface ConfusionMatrixProps {
  /** [[TN, FP], [FN, TP]] */
  matrix: [[number, number], [number, number]];
}

export function ConfusionMatrix({ matrix }: ConfusionMatrixProps) {
  const [[tn, fp], [fn, tp]] = matrix;
  const total = tn + fp + fn + tp;

  const cells = [
    { label: "True Negative",  value: tn, sub: "Correctly identified legitimate", bg: "bg-green-50",  border: "border-green-300", text: "text-green-800" },
    { label: "False Positive", value: fp, sub: "Legitimate flagged as fraud",     bg: "bg-red-50",    border: "border-red-200",   text: "text-red-700" },
    { label: "False Negative", value: fn, sub: "Fraud missed by model",           bg: "bg-orange-50", border: "border-orange-300",text: "text-orange-800" },
    { label: "True Positive",  value: tp, sub: "Correctly identified fraud",      bg: "bg-blue-50",   border: "border-blue-300",  text: "text-blue-800" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-0 border border-gray-200 rounded-xl overflow-hidden">
        {/* Axis labels */}
        <div className="col-span-2 grid grid-cols-3 text-xs text-center font-semibold text-gray-500 bg-gray-50 border-b border-gray-200">
          <div className="py-2" />
          <div className="py-2 border-l border-gray-200">Predicted: Legit</div>
          <div className="py-2 border-l border-gray-200">Predicted: Fraud</div>
        </div>

        {cells.map((cell, i) => (
          <div
            key={cell.label}
            className={`${cell.bg} ${cell.border} p-5 border relative ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b" : ""}`}
          >
            {/* Actual label */}
            {i === 0 && (
              <div className="absolute -left-0 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 transform -rotate-90 translate-x-[-28px]">
                Actual: Legit
              </div>
            )}
            {i === 2 && (
              <div className="absolute -left-0 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 transform -rotate-90 translate-x-[-28px]">
                Actual: Fraud
              </div>
            )}
            <p className={`text-3xl font-bold ${cell.text}`}>{value(cell.value)}</p>
            <p className={`text-xs font-semibold ${cell.text} mt-1`}>{cell.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{cell.sub}</p>
            <p className="text-xs text-gray-400 mt-1">{((cell.value / total) * 100).toFixed(2)}% of total</p>
          </div>
        ))}
      </div>

      {/* Summary metrics from confusion matrix */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="text-center">
          <p className="text-sm font-bold text-gray-900">
            {tp + tn > 0 ? ((( tp + tn) / total) * 100).toFixed(2) : "—"}%
          </p>
          <p className="text-xs text-gray-500">Accuracy</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-900">
            {tp + fp > 0 ? ((tp / (tp + fp)) * 100).toFixed(2) : "—"}%
          </p>
          <p className="text-xs text-gray-500">Precision</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-900">
            {tp + fn > 0 ? ((tp / (tp + fn)) * 100).toFixed(2) : "—"}%
          </p>
          <p className="text-xs text-gray-500">Recall</p>
        </div>
      </div>
    </div>
  );
}

function value(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString();
}
