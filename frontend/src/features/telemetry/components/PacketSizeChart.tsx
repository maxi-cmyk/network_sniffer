/**
 * Packet Size Distribution Chart Component
 */

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const ACCENT = "#69f6b8";

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
  { range: "1200-1350", min: 1200, max: 1350 },
  { range: "1350-1500+", min: 1350, max: 99999 },
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
      <div className="surface-glass rounded-sm p-4 h-48 flex items-center justify-center ring-1 ring-white/5">
        <span className="text-muted-foreground text-technical text-[10px]">Awaiting Signal...</span>
      </div>
    );
  }

  return (
    <div className="surface-glass rounded-sm p-4 ring-1 ring-white/5">
      <div className="text-muted-foreground text-technical text-[10px] mb-2">Packet Size Distribution</div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis 
            dataKey="range" 
            tick={{ fill: "#666", fontSize: 9 }} 
            axisLine={{ stroke: "#333" }}
            tickLine={{ stroke: "#333" }}
            interval={0}
          />
          <YAxis 
            tick={{ fill: "#666", fontSize: 9 }} 
            axisLine={{ stroke: "#333" }}
            tickLine={{ stroke: "#333" }}
            width={30}
          />
          <Tooltip 
            contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 4 }}
            labelStyle={{ color: "#fff" }}
            itemStyle={{ color: ACCENT }}
            formatter={(value: number) => [`${value} packets`, "Count"]}
            labelFormatter={(label) => `Size: ${label} bytes`}
          />
          <Bar dataKey="count" fill={ACCENT} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="text-[9px] text-muted-foreground text-center mt-1">Packet Size (bytes)</div>
    </div>
  );
}