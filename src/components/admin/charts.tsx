"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS = { stroke: "#475569", fontSize: 11 };
const TOOLTIP_STYLE = {
  backgroundColor: "#0d0d22",
  border: "1px solid rgba(59,130,246,0.25)",
  borderRadius: 8,
  fontSize: 12,
  color: "#e2e8f0",
};

export function SignupsLineChart({ data }: { data: { day: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} {...AXIS} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} {...AXIS} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "#3b82f6", strokeDasharray: 3 }} />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#22d3ee"
          strokeWidth={2}
          dot={{ r: 2, stroke: "#22d3ee", fill: "#0a0a1a" }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RevenueByPlanChart({
  data,
}: {
  data: { plan: string; revenue: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="plan" tickLine={false} axisLine={false} {...AXIS} />
        <YAxis tickLine={false} axisLine={false} {...AXIS} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "rgba(59,130,246,0.08)" }}
          formatter={(v) => [`$${(Number(v) / 100).toFixed(2)}`, "Revenue"]}
        />
        <Bar dataKey="revenue" fill="url(#bar-grad)" radius={[6, 6, 0, 0]} />
        <defs>
          <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
