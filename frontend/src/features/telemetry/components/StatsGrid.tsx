/**
 * Stats Grid Component
 * Displays key metrics: total packets, bytes, protocol, unique IPs
 */

import { AnimatedNumber } from "./AnimatedNumber";

const ACCENT = "#69f6b8";

interface Stats {
  totalPackets: number;
  totalBytes: number;
  uniqueIPs: number;
  protocols: Record<string, number>;
}

export function StatsGrid({ stats }: { stats?: Stats }) {
  const protocolEntries = Object.entries(stats?.protocols || {}).sort((a, b) => b[1] - a[1]);
  const topProtocol = protocolEntries[0];

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="surface-glass rounded-sm p-4 ring-1 ring-white/5">
        <div className="text-muted-foreground text-technical text-[10px]">Total Packets</div>
        <div className="text-2xl font-bold mt-1 glow-primary" style={{ color: ACCENT }}>
          <AnimatedNumber value={stats.totalPackets} />
        </div>
      </div>
      <div className="surface-glass rounded-sm p-4 ring-1 ring-white/5">
        <div className="text-muted-foreground text-technical text-[10px]">Total Data</div>
        <div className="text-2xl font-bold mt-1 text-white">
          <AnimatedNumber value={Math.round(stats.totalBytes / 1024)} /> <span className="text-xs text-muted-foreground">KB</span>
        </div>
      </div>
      <div className="surface-glass rounded-sm p-4 ring-1 ring-white/5">
        <div className="text-muted-foreground text-technical text-[10px]">Top Protocol</div>
        <div className="text-2xl font-bold mt-1 text-white">{topProtocol?.[0] || "—"}</div>
        <div className="text-[10px] text-muted-foreground technical uppercase mt-1">{topProtocol?.[1] || 0} pks</div>
      </div>
      <div className="surface-glass rounded-sm p-4 ring-1 ring-white/5">
        <div className="text-muted-foreground text-technical text-[10px]">Unique Nodes</div>
        <div className="text-2xl font-bold mt-1 text-white">
          <AnimatedNumber value={stats.uniqueIPs} />
        </div>
      </div>
    </div>
  );
}