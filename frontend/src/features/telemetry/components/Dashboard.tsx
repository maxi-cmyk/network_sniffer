/**
 * Dashboard UI for real-time traffic analysis.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useTrafficStream, type PacketData } from "../hooks/useTrafficStream";
import { cn } from "@/lib/utils";

const ACCENT = "#69f6b8";
const ACCENT_DIM = "#06b77f";
const SURFACE_DARK = "#0e0e0e";
const SURFACE_CARD = "#1a1919";

const isValidIpFilter = (ip: string): boolean => {
  if (!ip.trim()) return true;
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return false;
  const parts = ip.split('.').map(Number);
  return parts.every(p => p >= 0 && p <= 255);
};


function AnimatedNumber({ value, duration = 300 }: { value: number; duration?: number }) {
  // Current displayed value (may be different from actual value during animation)
  const [displayValue, setDisplayValue] = useState(value);
  
  // Store previous value for animation start point
  const prevValue = useRef(value);

  // When the actual value changes, animate to it
  useEffect(() => {
    const start = prevValue.current;  // Where we're starting from
    const end = value;                // Where we're going to
    const startTime = performance.now();  // When animation started

    /**
     * Animation loop function
     */
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic ease-out: fast at start, slow at end
      // This mimics how physical objects slow down
      const eased = 1 - Math.pow(1 - progress, 3);
      
      // Calculate current value
      const current = Math.round(start + (end - start) * eased);
      setDisplayValue(current);

      // Continue animation until complete
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    // Start the animation
    requestAnimationFrame(animate);
    
    // Save current value for next animation's starting point
    prevValue.current = value;
  }, [value, duration]);

  // Format number with commas (e.g., 1,234)
  return <span>{displayValue.toLocaleString()}</span>;
}


function PacketList({ packets }: { packets: PacketData[] }) {
  return (
    <div className="overflow-auto max-h-[400px]">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead className="sticky top-0 bg-background/80 backdrop-blur-md z-10">
          <tr className="text-left text-secondary-foreground text-technical text-[10px] border-b border-border">
            <th className="p-3 font-medium">Time</th>
            <th className="p-3 font-medium">Source</th>
            <th className="p-3 font-medium">Port</th>
            <th className="p-3 font-medium">Destination</th>
            <th className="p-3 font-medium">Port</th>
            <th className="p-3 font-medium">Protocol</th>
            <th className="p-3 font-medium">Decoded</th>
            <th className="p-3 font-medium text-right">Size</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/10">
          {(packets || []).slice().reverse().map((p, i) => (
            <tr
              key={`${p.timestamp}-${i}`}
              className="group hover:bg-primary/5 transition-colors duration-150"
              style={{ opacity: 0, animation: "fadeIn 0.2s ease-out forwards" }}
            >
              <td className="p-3 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                {new Date(p.timestamp).toLocaleTimeString([], { hour12: false })}
              </td>
              <td className="p-3 font-mono text-xs text-white">{p.src}</td>
              <td className="p-3 font-mono text-xs text-muted-foreground">{p.src_port || "—"}</td>
              <td className="p-3 font-mono text-xs text-white">{p.dst}</td>
              <td className="p-3 font-mono text-xs text-muted-foreground">{p.dst_port || "—"}</td>
              <td className="p-3">
                <span
                  className="px-2 py-0.5 rounded-sm text-[10px] technical uppercase font-bold"
                  style={{
                    backgroundColor: `${ACCENT}15`,
                    color: ACCENT,
                    boxShadow: `0 0 10px ${ACCENT}20`,
                  }}
                >
                  {p.proto}
                </span>
              </td>
              <td className="p-3 font-mono text-xs text-primary max-w-[150px] truncate" title={p.dns_domain || p.http_host || p.tls_sni || (p.http_method ? `${p.http_method} ${p.http_path}` : "") || ""}>
                {p.dns_domain || p.http_host || p.tls_sni || p.http_method ? (
                  <span className="text-primary">
                    {p.dns_domain && `DNS: ${p.dns_domain.slice(0, 20)}${p.dns_domain.length > 20 ? '...' : ''}`}
                    {p.http_host && `Host: ${p.http_host.slice(0, 20)}${p.http_host.length > 20 ? '...' : ''}`}
                    {p.http_method && `${p.http_method} ${p.http_path?.slice(0, 15)}${(p.http_path?.length ?? 0) > 15 ? '...' : ''}`}
                    {p.tls_sni && `SNI: ${p.tls_sni.slice(0, 20)}${p.tls_sni.length > 20 ? '...' : ''}`}
                  </span>
                ) : <span className="text-muted-foreground">—</span>}
              </td>
              <td className="p-3 font-mono text-xs text-muted-foreground text-right">
                {p.length} B
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* CSS animation for new rows appearing */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}


function StatsGrid({ stats }: { 
  stats?: { 
    totalPackets: number; 
    totalBytes: number; 
    uniqueIPs: number; 
    protocols: Record<string, number> 
  }
}) {
  // Sort protocols by count to find the top one
  const protocolEntries = Object.entries(stats?.protocols || {}).sort((a, b) => b[1] - a[1]);
  const topProtocol = protocolEntries[0];

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Packets Card */}
      <div className="surface-glass rounded-sm p-4 ring-1 ring-white/5">
        <div className="text-muted-foreground text-technical text-[10px]">
          Total Packets
        </div>
        <div className="text-2xl font-bold mt-1 glow-primary" style={{ color: ACCENT }}>
          <AnimatedNumber value={stats.totalPackets} />
        </div>
      </div>

      {/* Total Data Card */}
      <div className="surface-glass rounded-sm p-4 ring-1 ring-white/5">
        <div className="text-muted-foreground text-technical text-[10px]">
          Total Data
        </div>
        <div className="text-2xl font-bold mt-1 text-white">
          <AnimatedNumber value={Math.round(stats.totalBytes / 1024)} /> <span className="text-xs text-muted-foreground">KB</span>
        </div>
      </div>

      {/* Top Protocol Card */}
      <div className="surface-glass rounded-sm p-4 ring-1 ring-white/5">
        <div className="text-muted-foreground text-technical text-[10px]">
          Top Protocol
        </div>
        <div className="text-2xl font-bold mt-1 text-white">
          {topProtocol?.[0] || "—"}
        </div>
        <div className="text-[10px] text-muted-foreground technical uppercase mt-1">
          {topProtocol?.[1] || 0} pks
        </div>
      </div>

      {/* Unique IPs Card */}
      <div className="surface-glass rounded-sm p-4 ring-1 ring-white/5">
        <div className="text-muted-foreground text-technical text-[10px]">
          Unique Nodes
        </div>
        <div className="text-2xl font-bold mt-1 text-white">
          <AnimatedNumber value={stats.uniqueIPs} />
        </div>
      </div>
    </div>
  );
}


function ProtocolChart({ protocols = {} }: { protocols?: Record<string, number> }) {
  const entries = Object.entries(protocols).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const total = Object.entries(protocols).reduce((acc, [_, count]) => acc + count, 0);

  // Show placeholder if no data yet
  if (total === 0) {
    return (
      <div className="surface-glass rounded-sm p-4 h-48 flex items-center justify-center ring-1 ring-white/5">
        <span className="text-muted-foreground text-technical text-[10px]">Awaiting Signal...</span>
      </div>
    );
  }

  return (
    <div className="surface-glass rounded-sm p-4 ring-1 ring-white/5">
      <div className="text-muted-foreground text-technical text-[10px] mb-4">
        Signal Distribution
      </div>
      <div className="space-y-3">
        {entries.map(([proto, count]) => {
          // Calculate percentage of total
          const percentage = (count / total) * 100;
          
          return (
            <div key={proto} className="flex items-center gap-3">
              {/* Protocol name */}
              <span className="text-xs text-white w-12">{proto}</span>
              
              {/* Progress bar */}
              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out glow-primary"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: ACCENT,
                    transform: "scaleX(0)",
                    animation: "growWidth 0.4s ease-out forwards",
                  }}
                />
              </div>
              
              {/* Count */}
              <span className="text-xs text-[#a3a3a3] w-16 text-right">{count}</span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes growWidth {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}


function PacketSizeChart({ packets = [] }: { packets?: PacketData[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Effect: Draw the chart whenever packets change
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    
    // Don't draw if not enough data
    if (!canvas || !packets || packets.length < 2) return;

    // Get canvas context (the "pen" we draw with)
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high-DPI displays (retina screens)
    // This makes text and lines look crisp on modern screens
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Chart dimensions
    const width = rect.width;
    const height = rect.height;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Get last 50 packets for the chart
    const recentPackets = packets.slice(-50);
    
    // Find max packet size for Y-axis scaling
    const maxSize = Math.max(...recentPackets.map((p) => p.length), 1);

    // Fill background (dark)
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines (horizontal)
    ctx.strokeStyle = "#262626";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw the line chart
    ctx.beginPath();
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 2;

    recentPackets.forEach((pkt, i) => {
      // X position: distribute across chart width
      const x = padding + (i / (recentPackets.length - 1)) * chartWidth;
      
      // Y position: scale based on packet size (inverted - higher = higher on screen)
      const y = padding + chartHeight - (pkt.length / maxSize) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw a dot at the end point (current packet)
    const lastPkt = recentPackets[recentPackets.length - 1];
    if (lastPkt) {
      const lastX = width - padding;
      const lastY = padding + chartHeight - (lastPkt.length / maxSize) * chartHeight;

      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [packets]);

  // Show placeholder if not enough data
  if (!packets || packets.length < 2) {
    return (
      <div className="surface-glass rounded-sm p-4 h-48 flex items-center justify-center ring-1 ring-white/5">
        <span className="text-muted-foreground text-technical text-[10px]">Synchronizing...</span>
      </div>
    );
  }

  return (
    <div className="surface-glass rounded-sm p-4 ring-1 ring-white/5">
      <div className="text-muted-foreground text-technical text-[10px] mb-4">
        Telemetry Flux (bits/s)
      </div>
      <canvas ref={canvasRef} className="w-full h-32" style={{ width: "100%", height: "128px" }} />
    </div>
  );
}


export default function Dashboard() {
  // Use our custom hook to get packet data
  const { isConnected, isConnecting, packets, stats, connect, disconnect, clearPackets, setFilters, ipFilter, protocolFilter, connectionError, savePCAP, loadPCAP, addPackets } = useTrafficStream();
  
  // PCAP state
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pcapStatus, setPcapStatus] = useState<string>("");
  
  // Handle save PCAP
  const handleSavePCAP = async () => {
    setIsSaving(true);
    setPcapStatus("Saving...");
    try {
      const result = await savePCAP(`capture_${Date.now()}.pcap`);
      setPcapStatus(result.success ? `Saved ${result.packet_count} packets` : "Save failed");
    } catch {
      setPcapStatus("Save failed");
    }
    setIsSaving(false);
    setTimeout(() => setPcapStatus(""), 3000);
  };
  
  // Handle load PCAP - trigger file input
  const handleLoadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pcap';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setIsLoading(true);
      setPcapStatus("Loading...");
      try {
        const result = await loadPCAP(file.name);
        if (result.success && result.packets) {
          addPackets(result.packets);
          setPcapStatus(`Loaded ${result.packet_count} packets`);
        } else {
          setPcapStatus(result.error || "Load failed");
        }
      } catch {
        setPcapStatus("Load failed");
      }
      setIsLoading(false);
      setTimeout(() => setPcapStatus(""), 3000);
    };
    input.click();
  };
  
  // State for the Live Feed vs Full List toggle
  const [activeTab, setActiveTab] = useState<"live" | "list">("live");
  
  // Local protocol filter state for dropdown control
  const [localProtocolFilter, setLocalProtocolFilter] = useState<string>("all");

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      
      switch (e.key.toLowerCase()) {
        case 's':
          if (isConnected) disconnect();
          else connect();
          break;
        case 'c':
          clearPackets();
          break;
        case 'f':
          document.querySelector<HTMLInputElement>('input[placeholder="FILTER_IP"]')?.focus();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConnected, connect, disconnect, clearPackets]);

  // Handle IP filter change
  const handleIpFilterChange = (value: string) => {
    setFilters(value, localProtocolFilter === "all" ? "" : localProtocolFilter);
  };

  // Handle protocol filter change
  const handleProtocolFilterChange = (value: string) => {
    setLocalProtocolFilter(value);
    setFilters(ipFilter, value === "all" ? "" : value);
  };

  // Filter packets based on selected protocol and IP (for local display)
  const filteredPackets = (packets || []).filter(p => {
    const matchesProtocol = localProtocolFilter === "all" || p.proto === localProtocolFilter;
    const matchesIp = !ipFilter || p.src.includes(ipFilter) || p.dst.includes(ipFilter);
    return matchesProtocol && matchesIp;
  });

  // Determine connection status text and color
  const connectionStatus = isConnected ? "Live" : connectionError ? "Error" : isConnecting ? "Connecting..." : "Disconnected";
  const statusColor = isConnected ? "#69f6b8" : connectionError ? "#ef4444" : isConnecting ? "#f59e0b" : "#525252";

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div>
            <h1 className="text-xl font-bold text-white tracking-widest uppercase">Network Sniffer</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-technical text-[9px] text-primary/60">Intercept Active</span>
            </div>
          </div>
          
          {/* Connection Controls */}
          <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-sm ring-1 ring-white/10">
            <div className="relative flex items-center justify-center w-3 h-3">
              <div
                className={cn(
                  "absolute w-full h-full rounded-full transition-all duration-500",
                  isConnected ? "bg-primary animate-ping opacity-20" : 
                  isConnecting ? "bg-amber-500 animate-pulse" : "bg-white/20"
                )}
              />
              <div
                className={cn(
                  "relative w-1.5 h-1.5 rounded-full transition-transform duration-300",
                  isConnecting && !isConnected ? "animate-pulse" : ""
                )}
                style={{
                  backgroundColor: statusColor,
                  boxShadow: isConnected ? "0 0 10px #69f6b8" : "none",
                }}
              />
            </div>
            <span className="text-technical text-[10px] text-muted-foreground mr-1">
              {connectionStatus}
            </span>
          </div>
            
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <button
                onClick={disconnect}
                className="px-4 h-12 rounded-sm text-[10px] text-technical font-medium bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors duration-150"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className={cn(
                  "px-4 h-12 rounded-sm text-[10px] text-technical font-medium transition-all duration-300 shadow-[0_0_15px_rgba(105,246,184,0.2)]",
                  isConnecting ? "opacity-30 cursor-not-allowed bg-white/10 text-muted-foreground" : "bg-primary text-primary-foreground hover:brightness-110"
                )}
              >
                {isConnecting ? "Connecting..." : "Start"}
              </button>
            )}
            
            <button
              onClick={clearPackets}
              className="px-4 h-12 rounded-sm text-[10px] text-technical font-medium bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors duration-150"
            >
              Clear
            </button>
            <button
              onClick={handleSavePCAP}
              disabled={isSaving || isLoading}
              className="px-4 h-12 rounded-sm text-[10px] text-technical font-medium bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors duration-150"
            >
              {isSaving ? "Saving..." : "Save PCAP"}
            </button>
            <button
              onClick={handleLoadClick}
              disabled={isSaving || isLoading}
              className="px-4 h-12 rounded-sm text-[10px] text-technical font-medium bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors duration-150"
            >
              {isLoading ? "Loading..." : "Load PCAP"}
            </button>
            {pcapStatus && (
              <span className="text-[10px] text-muted-foreground">{pcapStatus}</span>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && <StatsGrid stats={stats} />}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PacketSizeChart packets={filteredPackets} />
          <ProtocolChart protocols={stats.protocols} />
        </div>

        <div className="surface-glass rounded-sm ring-1 ring-white/5">
          {/* Controls Bar: Filters */}
          <div className="flex bg-white/5 border-b border-white/5 p-2 gap-2">
            <input
              type="text"
              placeholder="FILTER_IP"
              value={ipFilter}
              onChange={(e) => handleIpFilterChange(e.target.value)}
              className={cn(
                "px-3 h-12 bg-black/40 border rounded-sm text-[11px] text-primary font-mono w-48 focus:outline-none focus:border-primary/40 transition-colors",
                ipFilter && !isValidIpFilter(ipFilter) ? "border-red-500 text-red-400" : "border-white/10"
              )}
            />
            <select
              value={localProtocolFilter}
              onChange={(e) => handleProtocolFilterChange(e.target.value)}
              className="px-3 h-12 bg-black/40 border border-white/10 rounded-sm text-[11px] text-primary font-mono focus:outline-none focus:border-primary/40 transition-colors cursor-pointer"
            >
              <option value="all">ALL_PROTOCOLS</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
              <option value="ARP">ARP</option>
              <option value="IP">IP</option>
            </select>
          </div>

          {/* Tab Buttons */}
          <div className="flex border-b border-white/5 transition-all">
            <button
              onClick={() => setActiveTab("live")}
              className={cn(
                "px-6 py-4 text-technical text-[10px] transition-all duration-300 border-b-2",
                activeTab === "live"
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-white"
              )}
            >
              Signal Feed
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={cn(
                "px-6 py-4 text-technical text-[10px] transition-all duration-300 border-b-2",
                activeTab === "list"
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-white"
              )}
            >
              Archive ({filteredPackets.length})
            </button>
          </div>
          
          <div className="p-4">
            {activeTab === "live" ? (
              <PacketList packets={filteredPackets.slice(-20)} />
            ) : (
              <PacketList packets={filteredPackets} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}