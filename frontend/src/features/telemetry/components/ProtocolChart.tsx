/**
 * Protocol Chart - net-noir
 * Terminal-style horizontal bars
 */

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CYAN = "#00ffcc";
const AMBER = "#ffaa00";

const PROTOCOL_COLORS: Record<string, string> = {
  TCP: CYAN,
  UDP: AMBER,
  ICMP: "#ff3366",
  ARP: "#9966ff",
  IP: "#5a8a70",
  DNS: AMBER,
  HTTP: CYAN,
  TLS: "#ff3366",
};

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
      fill: PROTOCOL_COLORS[proto] || CYAN,
    }));
  }, [protocols]);

  if (!data.length) {
    return (
      <div className="surface-cyber rounded-md p-4 h-48 flex items-center justify-center">
        <div className="text-center">
          <div className="font-tech text-2xl text-phosphor mb-3">◈</div>
          <div className="font-tech text-sm text-[var(--text-dim)]">
            // WAITING FOR DATASTREAM...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-cyber rounded-md p-4">
      <div className="font-tech text-sm text-[var(--text-muted)] tracking-wider mb-3">
        PROTOCOL_DISTRIBUTION
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a20" horizontal={false} />
          <XAxis 
            type="number" 
            domain={[0, 100]} 
            tick={{ fill: "#5a8a70", fontSize: 9, fontFamily: "JetBrains Mono" }} 
            axisLine={{ stroke: "#1a1a20" }}
            tickLine={{ stroke: "#1a1a20" }}
            unit="%"
          />
          <YAxis 
            type="category" 
            dataKey="protocol" 
            tick={{ fill: "#b8ffe0", fontSize: 10, fontFamily: "JetBrains Mono" }} 
            axisLine={{ stroke: "#1a1a20" }}
            tickLine={false}
            width={45}
          />
          <Tooltip 
            contentStyle={{ 
              background: "#0d0d12", 
              border: `1px solid ${CYAN}`, 
              borderRadius: 4,
              boxShadow: `0 0 10px ${CYAN}40`
            }}
            labelStyle={{ color: "#b8ffe0", fontSize: 11, fontFamily: "JetBrains Mono" }}
            itemStyle={{ color: CYAN, fontFamily: "JetBrains Mono" }}
            formatter={(value: number) => [`${value}%`, "share"]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.protocol || ""}
          />
          <Bar 
            dataKey="percentage" 
            fill={CYAN}
            radius={[0, 4, 4, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="font-tech text-xs text-[var(--text-dim)] text-center mt-2 tracking-wider">
        PROTOCOL SHARE
      </div>
    </div>
  );
}