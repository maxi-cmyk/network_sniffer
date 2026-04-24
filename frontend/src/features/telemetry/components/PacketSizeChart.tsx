/**
 * Packet Size Chart - net-noir
 * Terminal-style visualization
 */

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CYAN = "#00ffcc";
const AMBER = "#ffaa00";

interface PacketSizeChartProps {
  packets: any[];
}

const SIZE_BINS = [
  { range: "0-150", min: 0, max: 150 },
  { range: "150-300", min: 150, max: 300 },
  { range: "300-450", min: 300, max: 450 },
  { range: "450-600", min: 450, max: 600 },
  { range: "600-750", min: 600, max: 750 },
  { range: "750-900", min: 750, max: 900 },
  { range: "900-1050", min: 900, max: 1050 },
  { range: "1050-1200", min: 1050, max: 1200 },
  { range: "1200+", min: 1200, max: 99999 },
];

export function PacketSizeChart({ packets }: PacketSizeChartProps) {
  const data = useMemo(() => {
    if (!packets?.length) return [];
    const bins = SIZE_BINS.map(b => ({ ...b, count: 0 }));
    packets.forEach(p => {
      const len = p.length || 0;
      const bin = bins.find(b => len >= b.min && len < b.max);
      if (bin) bin.count++;
    });
    return bins.map(b => ({ range: b.range, count: b.count }));
  }, [packets]);

  if (!packets?.length) {
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
        PACKET_SIZE_DISTRIBUTION
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a20" vertical={false} />
          <XAxis 
            dataKey="range" 
            tick={{ fill: "#5a8a70", fontSize: 9, fontFamily: "JetBrains Mono" }} 
            axisLine={{ stroke: "#1a1a20" }}
            tickLine={{ stroke: "#1a1a20" }}
            interval={0}
          />
          <YAxis 
            tick={{ fill: "#5a8a70", fontSize: 9, fontFamily: "JetBrains Mono" }} 
            axisLine={{ stroke: "#1a1a20" }}
            tickLine={{ stroke: "#1a1a20" }}
            width={35}
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
            formatter={(value: number) => [`${value}`, "packets"]}
            labelFormatter={(label) => `Size: ${label} bytes`}
          />
          <Bar 
            dataKey="count" 
            fill={CYAN} 
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="font-tech text-xs text-[var(--text-dim)] text-center mt-2 tracking-wider">
        BYTES
      </div>
    </div>
  );
}