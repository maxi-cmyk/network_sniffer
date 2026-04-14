/**
 * Protocol Distribution Chart Component
 */

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const ACCENT = "#69f6b8";

interface ProtocolChartProps {
  protocols?: Record<string, number>;
}

export function ProtocolChart({ protocols = {} }: ProtocolChartProps) {
  const data = useMemo(() => {
    const entries = Object.entries(protocols).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const total = entries.reduce((acc, [_, count]) => acc + count, 0);
    return entries.map(([proto, count]) => ({
      protocol: proto,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }, [protocols]);

  if (!data.length) {
    return (
      <div className="surface-glass rounded-sm p-4 h-48 flex items-center justify-center ring-1 ring-white/5">
        <span className="text-muted-foreground text-technical text-[10px]">Awaiting Signal...</span>
      </div>
    );
  }

  return (
    <div className="surface-glass rounded-sm p-4 ring-1 ring-white/5">
      <div className="text-muted-foreground text-technical text-[10px] mb-2">Protocol Distribution</div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
          <XAxis 
            type="number" 
            domain={[0, 100]} 
            tick={{ fill: "#666", fontSize: 9 }} 
            axisLine={{ stroke: "#333" }}
            tickLine={{ stroke: "#333" }}
            unit="%"
          />
          <YAxis 
            type="category" 
            dataKey="protocol" 
            tick={{ fill: "#888", fontSize: 10 }} 
            axisLine={{ stroke: "#333" }}
            tickLine={false}
            width={45}
          />
          <Tooltip 
            contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 4 }}
            labelStyle={{ color: "#fff" }}
            formatter={(value: number) => [`${value}%`, "Share"]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.protocol || ""}
          />
          <Bar dataKey="percentage" fill={ACCENT} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="text-[9px] text-muted-foreground text-center mt-1">Protocol Share (%)</div>
    </div>
  );
}