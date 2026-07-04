"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Area, AreaChart,
} from "recharts";

interface RocCurveProps {
  /** Array of {fpr, tpr} points — pass from model evaluation */
  points?: Array<{ fpr: number; tpr: number }>;
  auc?: number;
  height?: number;
}

// Placeholder ideal-ish LR curve for display when no real data is passed
const MOCK_POINTS = [
  { fpr: 0.000, tpr: 0.000 },
  { fpr: 0.001, tpr: 0.420 },
  { fpr: 0.003, tpr: 0.680 },
  { fpr: 0.006, tpr: 0.810 },
  { fpr: 0.010, tpr: 0.880 },
  { fpr: 0.020, tpr: 0.920 },
  { fpr: 0.040, tpr: 0.950 },
  { fpr: 0.060, tpr: 0.960 },
  { fpr: 0.100, tpr: 0.970 },
  { fpr: 0.200, tpr: 0.980 },
  { fpr: 0.400, tpr: 0.990 },
  { fpr: 0.600, tpr: 0.993 },
  { fpr: 0.800, tpr: 0.996 },
  { fpr: 1.000, tpr: 1.000 },
];

const DIAGONAL = [
  { fpr: 0, tpr: 0 },
  { fpr: 1, tpr: 1 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-2 text-xs">
      <p className="text-gray-500">FPR: <span className="font-semibold text-gray-900">{(d.fpr * 100).toFixed(1)}%</span></p>
      <p className="text-gray-500">TPR: <span className="font-semibold text-blue-600">{(d.tpr * 100).toFixed(1)}%</span></p>
    </div>
  );
};

export function RocCurve({ points, auc, height = 260 }: RocCurveProps) {
  const data = points && points.length > 1 ? points : MOCK_POINTS;
  const displayAuc = auc ?? 0.974;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700">ROC Curve</p>
        <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full">
          AUC = {displayAuc.toFixed(3)}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 24, left: 8 }}>
          <defs>
            <linearGradient id="rocGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis
            dataKey="fpr"
            type="number"
            domain={[0, 1]}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            label={{ value: "False Positive Rate", position: "insideBottom", offset: -12, fontSize: 11, fill: "#6B7280" }}
          />
          <YAxis
            dataKey="tpr"
            type="number"
            domain={[0, 1]}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            label={{ value: "True Positive Rate", angle: -90, position: "insideLeft", offset: 12, fontSize: 11, fill: "#6B7280" }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Random classifier diagonal */}
          <ReferenceLine
            segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
            stroke="#D1D5DB"
            strokeDasharray="5 5"
            label={{ value: "Random", position: "insideTopLeft", fontSize: 10, fill: "#9CA3AF" }}
          />

          {/* ROC fill */}
          <Area
            type="monotone"
            dataKey="tpr"
            stroke="#3B82F6"
            strokeWidth={2.5}
            fill="url(#rocGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#3B82F6" }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-1 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-blue-500" />
          <span>LR + SMOTE model</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-gray-300" style={{ borderTop: "2px dashed" }} />
          <span>Random classifier</span>
        </div>
      </div>
    </div>
  );
}
