/**
 * Stats Grid - net-noir
 * Real-time metrics with phosphor glow
 */

import { AnimatedNumber } from "./AnimatedNumber";

const CYAN = "#00ffcc";
const AMBER = "#ffaa00";

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Total Packets */}
      <div className="surface-cyber rounded-md p-4 hover:border-glow-cyan transition-all duration-300">
        <div className="font-tech text-sm text-[var(--text-muted)] tracking-wider mb-2">
          TOTAL_PACKETS
        </div>
        <div className="font-tech text-5xl font-bold glow-cyan" style={{ color: CYAN }}>
          <AnimatedNumber value={stats.totalPackets} />
        </div>
        <div className="font-tech text-xs text-[var(--text-dim)] mt-2">
          <span style={{ color: CYAN }}>●</span> CAPTURED
        </div>
      </div>

      {/* Total Data */}
      <div className="surface-cyber rounded-md p-4 hover:border-glow-amber transition-all duration-300">
        <div className="font-tech text-sm text-[var(--text-muted)] tracking-wider mb-2">
          TOTAL_DATA
        </div>
        <div className="font-tech text-5xl font-bold glow-amber" style={{ color: AMBER }}>
          <AnimatedNumber value={Math.round(stats.totalBytes / 1024)} />
        </div>
        <div className="font-tech text-xs text-[var(--text-dim)] mt-2">
          <span style={{ color: AMBER }}>●</span> KILOBYTES
        </div>
      </div>

      {/* Top Protocol */}
      <div className="surface-cyber rounded-md p-4 hover:border-glow-cyan transition-all duration-300">
        <div className="font-tech text-sm text-[var(--text-muted)] tracking-wider mb-2">
          TOP_PROTOCOL
        </div>
        <div className="font-tech text-5xl font-bold text-phosphor">
          {topProtocol?.[0] || "—"}
        </div>
        <div className="font-tech text-xs text-[var(--text-dim)] mt-2">
          {topProtocol?.[1] || 0} pkts
        </div>
      </div>

      {/* Unique Nodes */}
      <div className="surface-cyber rounded-md p-4 hover:border-glow-amber transition-all duration-300">
        <div className="font-tech text-sm text-[var(--text-muted)] tracking-wider mb-2">
          UNIQUE_NODES
        </div>
        <div className="font-tech text-5xl font-bold text-phosphor">
          <AnimatedNumber value={stats.uniqueIPs} />
        </div>
        <div className="font-tech text-xs text-[var(--text-dim)] mt-2">
          <span style={{ color: AMBER }}>●</span> ACTIVE
        </div>
      </div>
    </div>
  );
}