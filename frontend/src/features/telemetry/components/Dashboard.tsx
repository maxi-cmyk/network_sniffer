/**
 * Dashboard UI for real-time traffic analysis.
 */

"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTrafficStream } from "../hooks/useTrafficStream";
import { SimulationPanel, AlertsPanel, ARPPanel, OverviewPanel } from "./panels";

const ACCENT = "#69f6b8";

interface PacketData {
  timestamp: string;
  src: string;
  dst: string;
  src_port: number;
  dst_port: number;
  proto: string;
  length: number;
  info: string;
  dns_domain?: string;
  http_host?: string;
  http_method?: string;
  http_path?: string;
  http_user_agent?: string;
  tls_sni?: string;
  tcp_state?: string;
  tcp_flags?: string;
}

function AnimatedNumber({ value }: { value: number }) {
  return <span>{value.toLocaleString()}</span>;
}

function StatsGrid({ stats }: { 
  stats?: { 
    totalPackets: number; 
    totalBytes: number; 
    uniqueIPs: number; 
    protocols: Record<string, number> 
  }
}) {
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

function ProtocolChart({ protocols = {} }: { protocols?: Record<string, number> }) {
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

function PacketSizeChart({ packets }: { packets: any[] }) {
  const data = useMemo(() => {
    if (!packets?.length) return [];
    const bins = [
      { range: "0-150", min: 0, max: 150, count: 0 },
      { range: "150-300", min: 150, max: 300, count: 0 },
      { range: "300-450", min: 300, max: 450, count: 0 },
      { range: "450-600", min: 450, max: 600, count: 0 },
      { range: "600-750", min: 600, max: 750, count: 0 },
      { range: "750-900", min: 750, max: 900, count: 0 },
      { range: "900-1050", min: 900, max: 1050, count: 0 },
      { range: "1050-1200", min: 1050, max: 1200, count: 0 },
      { range: "1200-1350", min: 1200, max: 1350, count: 0 },
      { range: "1350-1500+", min: 1350, max: 99999, count: 0 },
    ];
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

export default function Dashboard() {
  const { 
    isConnected, 
    isConnecting, 
    packets, 
    stats, 
    connect, 
    disconnect, 
    clearPackets, 
    ipFilter, 
    protocolFilter, 
    setFilters,
    connectionError 
  } = useTrafficStream();

  const [activeTab, setActiveTab] = useState<"overview" | "alerts" | "simulation" | "arp">("overview");
  const [localProtocolFilter, setLocalProtocolFilter] = useState("all");

  const filteredPackets = useMemo(() => {
    return (packets || []).filter(p => localProtocolFilter === "all" || p.proto === localProtocolFilter);
  }, [packets, localProtocolFilter]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const statusColor = isConnected ? "#69f6b8" : connectionError ? "#ef4444" : isConnecting ? "#f59e0b" : "#525252";
  const statusText = isConnected ? "Live" : connectionError ? "Error" : isConnecting ? "Connecting..." : "Disconnected";

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div>
            <h1 className="text-xl font-bold text-white tracking-widest uppercase">Network Sniffer</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-technical text-[9px] text-primary/60">Intercept Active</span>
            </div>
          </div>
          
          {/* Status & Controls */}
          <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-sm ring-1 ring-white/10">
            <div className="relative flex items-center justify-center w-3 h-3">
              <div className={cn("absolute w-full h-full rounded-full transition-all duration-500", isConnected ? "bg-primary animate-ping opacity-20" : isConnecting ? "bg-amber-500 animate-pulse" : "bg-white/20")} />
              <div className="relative w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
            </div>
            <span className="text-technical text-[10px] text-muted-foreground mr-1">{statusText}</span>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <button onClick={disconnect} className="px-4 h-12 rounded-sm text-[10px] text-technical font-medium bg-white/5 text-white hover:bg-white/10 border border-white/10">Stop</button>
            ) : (
              <button onClick={connect} disabled={isConnecting} className={cn("px-4 h-12 rounded-sm text-[10px] font-medium transition-all duration-300 shadow-[0_0_15px_rgba(105,246,184,0.2)]", isConnecting ? "opacity-30 bg-white/10 text-muted-foreground" : "bg-primary text-primary-foreground hover:brightness-110")}>
                {isConnecting ? "Connecting..." : "Start"}
              </button>
            )}
            <button onClick={clearPackets} className="px-4 h-12 rounded-sm text-[10px] text-technical font-medium bg-white/5 text-white hover:bg-white/10 border border-white/10">Clear</button>
          </div>
        </div>

        {/* Stats */}
        {stats && <StatsGrid stats={stats} />}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PacketSizeChart packets={filteredPackets} />
          <ProtocolChart protocols={stats.protocols} />
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10">
          {(["overview", "alerts", "simulation", "arp"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-4 py-3 text-[10px] text-technical transition-all border-b-2", activeTab === tab ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-white")}>
              {tab.toUpperCase()}{tab === "alerts" && stats?.alertCount ? ` (${stats.alertCount})` : ""}{tab === "arp" && stats?.arpTable?.length ? ` (${stats.arpTable.length})` : ""}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <OverviewPanel packets={packets} filteredPackets={filteredPackets} connections={stats.connections} topTalkers={stats.topTalkers} localProtocolFilter={localProtocolFilter} onProtocolFilterChange={setLocalProtocolFilter} />
        )}
        {activeTab === "alerts" && <AlertsPanel alerts={stats.alerts} alertCount={stats.alertCount} />}
        {activeTab === "simulation" && <SimulationPanel API_URL={API_URL} />}
        {activeTab === "arp" && <ARPPanel arpTable={stats.arpTable} />}
      </div>
    </main>
  );
}