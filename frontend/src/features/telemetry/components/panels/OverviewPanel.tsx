/**
 * Overview Panel Component
 * TCP connections, Top Talkers, and packet table
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface PacketData {
  timestamp: string;
  src: string;
  dst: string;
  src_port: number;
  dst_port: number;
  proto: string;
  length: number;
  info: string;
  tcp_state?: string;
  tcp_flags?: string;
  dns_domain?: string;
  http_host?: string;
  http_method?: string;
  http_path?: string;
  tls_sni?: string;
  tls_version?: string;
  tls_cipher?: string;
}

interface IPStats {
  ip: string;
  sent: number;
  recv: number;
  total: number;
}

interface OverviewPanelProps {
  packets: PacketData[];
  filteredPackets: PacketData[];
  connections: {
    ESTABLISHED: number;
    CONNECTING: number;
    CLOSED: number;
  };
  topTalkers: IPStats[];
  localProtocolFilter: string;
  onProtocolFilterChange: (value: string) => void;
  ipFilter?: string;
  onIpFilterChange?: (filter: string) => void;
}

export function OverviewPanel({
  packets,
  filteredPackets,
  connections,
  topTalkers,
  localProtocolFilter,
  onProtocolFilterChange,
  ipFilter = "",
  onIpFilterChange,
}: OverviewPanelProps) {
  const [showConnections, setShowConnections] = useState(false);
  const [showTopTalkers, setShowTopTalkers] = useState(false);

  return (
    <div>
      {/* TCP Connections Panel */}
      <div className="surface-glass rounded-sm ring-1 ring-white/5">
        <button
          onClick={() => setShowConnections(!showConnections)}
          className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
        >
          <span className="text-technical text-[10px]">TCP CONNECTIONS</span>
          <span className="text-[10px] text-muted-foreground">
            {showConnections ? "▲" : "▼"}{" "}
            {connections
              ? ` ${connections.ESTABLISHED} EST / ${connections.CONNECTING} SYN / ${connections.CLOSED} CL`
              : ""}
          </span>
        </button>
        {showConnections && (
          <div className="border-t border-white/5 max-h-48 overflow-auto">
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-background/80 backdrop-blur-md">
                <tr className="text-left text-secondary-foreground text-technical text-[10px] border-b border-border/10">
                  <th className="p-2 font-medium">Source</th>
                  <th className="p-2 font-medium">Destination</th>
                  <th className="p-2 font-medium">State</th>
                  <th className="p-2 font-medium text-right">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {filteredPackets
                  .filter((p) => p.proto === "TCP" && p.tcp_state)
                  .slice(-20)
                  .reverse()
                  .map((p, i) => (
                    <tr key={`${p.timestamp}-${i}`} className="hover:bg-white/5">
                      <td className="p-2 font-mono text-primary">
                        {p.src}:{p.src_port}
                      </td>
                      <td className="p-2 font-mono text-primary">
                        {p.dst}:{p.dst_port}
                      </td>
                      <td className="p-2">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-sm text-[9px] uppercase font-bold",
                            p.tcp_state === "ESTABLISHED"
                              ? "bg-green-500/20 text-green-400"
                              : p.tcp_state === "CLOSED"
                              ? "bg-gray-500/20 text-gray-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          )}
                        >
                          {p.tcp_state}
                        </span>
                      </td>
                      <td className="p-2 text-right text-muted-foreground">
                        {p.tcp_flags || "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {filteredPackets.filter((p) => p.proto === "TCP" && p.tcp_state)
              .length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-[10px]">
                No TCP connections detected
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top Talkers Panel */}
      <div className="surface-glass rounded-sm ring-1 ring-white/5 mt-2">
        <button
          onClick={() => setShowTopTalkers(!showTopTalkers)}
          className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
        >
          <span className="text-technical text-[10px]">TOP TALKERS</span>
          <span className="text-[10px] text-muted-foreground">
            {showTopTalkers ? "▲" : "▼"}
          </span>
        </button>
        {showTopTalkers && (
          <div className="border-t border-white/5 max-h-48 overflow-auto">
            {topTalkers.length > 0 ? (
              <table className="w-full text-[10px]">
                <thead className="sticky top-0 bg-background/80 backdrop-blur-md">
                  <tr className="text-left text-secondary-foreground text-technical text-[10px] border-b border-border/10">
                    <th className="p-2 font-medium">IP Address</th>
                    <th className="p-2 font-medium text-right">Sent</th>
                    <th className="p-2 font-medium text-right">Recv</th>
                    <th className="p-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {topTalkers.map((talker, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      <td className="p-2 font-mono text-primary">{talker.ip}</td>
                      <td className="p-2 text-right text-muted-foreground">
                        {(talker.sent / 1024).toFixed(1)} KB
                      </td>
                      <td className="p-2 text-right text-muted-foreground">
                        {(talker.recv / 1024).toFixed(1)} KB
                      </td>
                      <td className="p-2 text-right text-primary">
                        {(talker.total / 1024).toFixed(1)} KB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-[10px]">
                No traffic data yet
              </div>
            )}
          </div>
        )}
      </div>

      {/* Protocol Filter */}
      <div className="surface-glass rounded-sm ring-1 ring-white/5 mt-2">
        <div className="flex bg-white/5 border-b border-white/5 p-2 gap-2">
          <input
            type="text"
            placeholder="FILTER_IP"
            value={ipFilter}
            onChange={(e) => onIpFilterChange?.(e.target.value)}
            className="px-3 h-12 bg-black/40 border rounded-sm text-[11px] text-primary font-mono w-48 focus:outline-none focus:border-primary/40 transition-colors border-white/10"
          />
          <select
            value={localProtocolFilter}
            onChange={(e) => onProtocolFilterChange(e.target.value)}
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
      </div>

      {/* Packet Table */}
      <div className="surface-glass rounded-sm ring-1 ring-white/5 mt-2">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead className="sticky top-0 bg-background/80 backdrop-blur-md">
              <tr className="text-left text-secondary-foreground text-technical text-[10px] border-b border-border/10">
                <th className="p-2 font-medium w-24">Time</th>
                <th className="p-2 font-medium w-20">Proto</th>
                <th className="p-2 font-medium">Source</th>
                <th className="p-2 font-medium">Destination</th>
                <th className="p-2 font-medium w-16 text-right">Len</th>
                <th className="p-2 font-medium">Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {filteredPackets.slice(-50).reverse().map((p, i) => (
                <tr key={`${p.timestamp}-${i}`} className="hover:bg-white/5">
                  <td className="p-2 font-mono text-muted-foreground text-[9px]">
                    {new Date(p.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-2">
                    <span className="px-1.5 py-0.5 rounded-sm text-[9px] bg-white/10 text-primary">
                      {p.proto}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-primary">{p.src}</td>
                  <td className="p-2 font-mono text-primary">{p.dst}</td>
                  <td className="p-2 text-right text-muted-foreground">
                    {p.length}
                  </td>
                  <td className="p-2 font-mono text-muted-foreground max-w-[200px] truncate">
                    {p.info}
                    {p.tls_sni && <span className="text-primary ml-1">TLS:{p.tls_sni}</span>}
                    {p.tls_version && <span className="text-amber-400 ml-1">[{p.tls_version}{p.tls_cipher ? ` ${p.tls_cipher}` : ''}]</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}