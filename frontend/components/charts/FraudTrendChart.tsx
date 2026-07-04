"use client";
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface DataPoint {
  label: string;
  transactions: number;
  fraud: number;
  fraud_rate?: number;
}

interface FraudTrendChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-semibold text-gray-900">{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export function FraudTrendChart({ data, title = "Transaction Trend", height = 280 }: FraudTrendChartProps) {
  return (
    <div>
      {title && <p className="text-sm font-semibold text-gray-700 mb-4">{title}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#EF4444" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
          <Bar   yAxisId="left"  dataKey="transactions" name="Transactions" fill="#BFDBFE" radius={[3, 3, 0, 0]} />
          <Line  yAxisId="right" dataKey="fraud"        name="Fraud count"  stroke="#EF4444" strokeWidth={2} dot={{ r: 3, fill: "#EF4444" }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
