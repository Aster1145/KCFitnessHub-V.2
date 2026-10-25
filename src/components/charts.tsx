"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "#17171b",
  border: "1px solid #232329",
  borderRadius: "12px",
  fontSize: 12,
  color: "#e4e4e7",
};

export function RevenueChart({
  data,
}: {
  data: { label: string; normal: number; pt: number }[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="gNormal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d8ff3e" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#d8ff3e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gPt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#232329" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={{ stroke: "#232329" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `₹${Math.round(v / 1000)}k`}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name) => [
              `₹${Number(value ?? 0).toLocaleString("en-IN")}`,
              name === "pt" ? "Personal Training" : "Memberships",
            ]}
          />
          <Area
            type="monotone"
            dataKey="normal"
            stackId="1"
            stroke="#d8ff3e"
            strokeWidth={2}
            fill="url(#gNormal)"
            name="normal"
          />
          <Area
            type="monotone"
            dataKey="pt"
            stackId="1"
            stroke="#38bdf8"
            strokeWidth={2}
            fill="url(#gPt)"
            name="pt"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeeklyChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 6, left: -24, bottom: 0 }}>
          <CartesianGrid stroke="#232329" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={{ stroke: "#232329" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#17171b" }} />
          <Bar dataKey="count" fill="#d8ff3e" radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SplitChart({ data }: { data: { name: string; value: number }[] }) {
  const COLORS = ["#d8ff3e", "#38bdf8", "#fbbf24", "#fb7185"];
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={52}
            outerRadius={75}
            paddingAngle={4}
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(v: string) => (
              <span style={{ color: "#a1a1aa", fontSize: 12 }}>{v}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
