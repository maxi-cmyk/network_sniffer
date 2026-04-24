/**
 * Overview Panel - net-noir
 * Terminal-style packet display with phosphor aesthetic
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const CYAN = "#00ffcc";
const AMBER = "#ffaa00";
const PINK = "#ff3366";

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

const PROTOCOL_COLORS: Record<string, { color: string; bg: string }> = {
  TCP: { color: CYAN, bg: "rgba(0, 255, 204, 0.12)" },
  UDP: { color: AMBER, bg: "rgba(255, 170, 0, 0.12)" },
  ICMP: { color: PINK, bg: "rgba(255, 51, 102, 0.12)" },
  ARP: { color: "#9966ff", bg: "rgba(153, 102, 255, 0.12)" },
  IP: { color: "#5a8a70", bg: "rgba(90, 138, 112, 0.12)" },
  DNS: { color: AMBER, bg: "rgba(255, 170, 0, 0.12)" },
  HTTP: { color: CYAN, bg: "rgba(0, 255, 204, 0.12)" },
  TLS: { color: PINK, bg: "rgba(255, 51, 102, 0.12)" },
};

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
    <div className="space-y-3">
      {/* TCP Connections Panel */}
      <div className="surface-cyber rounded-md">
        <button
          onClick={() => setShowConnections(!showConnections)}
          className="w-full flex items-center justify-between p-3 hover:bg-[var(--surface-elevated)] transition-colors"
        >
          <span className="font-tech text-sm tracking-wider text-phosphor">TCP_CONNECTIONS</span>
          <span className="font-tech text-sm text-[var(--text-muted)]">
            {showConnections ? "▲" : "▼"}{" "}
            {connections
              ? ` ${connections.ESTABLISHED} EST / ${connections.CONNECTING} SYN / ${connections.CLOSED} CL`
              : ""}
          </span>
        </button>
        {showConnections && (
          <div className="border-t border-[var(--border)] max-h-48 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--surface)]">
                <tr className="text-left font-tech text-sm text-[var(--text-dim)] border-b border-[var(--border)]">
                  <th className="p-2 font-medium">SOURCE</th>
                  <th className="p-2 font-medium">DESTINATION</th>
                  <th className="p-2 font-medium">STATE</th>
                  <th className="p-2 font-medium text-right">FLAGS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredPackets
                  .filter((p) => p.proto === "TCP" && p.tcp_state)
                  .slice(-20)
                  .reverse()
                  .map((p, i) => {
                    const stateColor = p.tcp_state === "ESTABLISHED" 
                      ? { color: CYAN, bg: CYAN }
                      : p.tcp_state === "CLOSED"
                      ? { color: "#5a8a70", bg: "#5a8a70" }
                      : { color: AMBER, bg: AMBER };
                    return (
                      <tr key={`${p.timestamp}-${i}`} className="hover:bg-[var(--surface-elevated)] transition-colors">
                        <td className="p-2 font-tech" style={{ color: CYAN }}>
                          {p.src}:{p.src_port}
                        </td>
                        <td className="p-2 font-tech" style={{ color: CYAN }}>
                          {p.dst}:{p.dst_port}
                        </td>
                        <td className="p-2">
                          <span
                            className="px-2 py-1 rounded text-sm font-tech uppercase"
                            style={{ 
                              backgroundColor: `${stateColor.bg}20`,
                              color: stateColor.color,
                              border: `1px solid ${stateColor.color}`
                            }}
                          >
                            {p.tcp_state}
                          </span>
                        </td>
                        <td className="p-2 text-right font-tech text-[var(--text-muted)]">
                          {p.tcp_flags || "—"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {filteredPackets.filter((p) => p.proto === "TCP" && p.tcp_state).length === 0 && (
              <div className="p-6 text-center">
                <span className="font-tech text-sm text-[var(--text-dim)]">
                  // NO TCP CONNECTIONS DETECTED
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top Talkers Panel */}
      <div className="surface-cyber rounded-md">
        <button
          onClick={() => setShowTopTalkers(!showTopTalkers)}
          className="w-full flex items-center justify-between p-3 hover:bg-[var(--surface-elevated)] transition-colors"
        >
          <span className="font-tech text-sm tracking-wider text-phosphor">TOP_TALKERS</span>
          <span className="font-tech text-sm text-[var(--text-muted)]">
            {showTopTalkers ? "▲" : "▼"}
          </span>
        </button>
        {showTopTalkers && (
          <div className="border-t border-[var(--border)] max-h-48 overflow-auto">
            {topTalkers.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--surface)]">
                  <tr className="text-left font-tech text-sm text-[var(--text-dim)] border-b border-[var(--border)]">
                    <th className="p-2 font-medium">IP_ADDRESS</th>
                    <th className="p-2 font-medium text-right">SENT</th>
                    <th className="p-2 font-medium text-right">RECV</th>
                    <th className="p-2 font-medium text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {topTalkers.map((talker, i) => (
                    <tr key={i} className="hover:bg-[var(--surface-elevated)] transition-colors">
                      <td className="p-2 font-tech" style={{ color: CYAN }}>{talker.ip}</td>
                      <td className="p-2 text-right font-tech text-[var(--text-muted)]">
                        {(talker.sent / 1024).toFixed(1)} KB
                      </td>
                      <td className="p-2 text-right font-tech text-[var(--text-muted)]">
                        {(talker.recv / 1024).toFixed(1)} KB
                      </td>
                      <td className="p-2 text-right font-tech" style={{ color: CYAN }}>
                        {(talker.total / 1024).toFixed(1)} KB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center">
                <span className="font-tech text-sm text-[var(--text-dim)]">
                  // NO TRAFFIC DATA YET
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Panel */}
      <div className="surface-cyber rounded-md">
        <div className="flex bg-[var(--surface-elevated)] border-b border-[var(--border)] p-3 gap-3">
          <input
            type="text"
            placeholder="FILTER_IP"
            value={ipFilter}
            onChange={(e) => onIpFilterChange?.(e.target.value)}
            className="input-cyber h-11 w-48"
          />
          <select
            value={localProtocolFilter}
            onChange={(e) => onProtocolFilterChange(e.target.value)}
            className="input-cyber h-11"
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
      <div className="surface-cyber rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--surface)]">
              <tr className="text-left font-tech text-sm text-[var(--text-dim)] border-b border-[var(--border)]">
                <th className="p-2 font-medium w-24">TIMESTAMP</th>
                <th className="p-2 font-medium w-20">PROTO</th>
                <th className="p-2 font-medium">SOURCE</th>
                <th className="p-2 font-medium">DESTINATION</th>
                <th className="p-2 font-medium w-16 text-right">LENGTH</th>
                <th className="p-2 font-medium">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredPackets.slice(-50).reverse().map((p, i) => {
                const pColor = PROTOCOL_COLORS[p.proto] || PROTOCOL_COLORS.IP;
                return (
                  <tr 
                    key={`${p.timestamp}-${i}`} 
                    className="hover:bg-[var(--surface-elevated)] transition-colors"
                  >
                    <td className="p-2 font-tech text-sm text-[var(--text-muted)]">
                      {new Date(p.timestamp).toLocaleTimeString('en-GB', { hour12: false })}
                    </td>
                    <td className="p-2">
                      <span 
                        className="px-2 py-1 rounded text-sm font-tech uppercase"
                        style={{ 
                          backgroundColor: pColor.bg,
                          color: pColor.color,
                          border: `1px solid ${pColor.color}`
                        }}
                      >
                        {p.proto}
                      </span>
                    </td>
                    <td className="p-2 font-tech" style={{ color: CYAN }}>{p.src}</td>
                    <td className="p-2 font-tech" style={{ color: CYAN }}>{p.dst}</td>
                    <td className="p-2 text-right font-tech text-[var(--text-muted)]">
                      {p.length}
                    </td>
                    <td className="p-2 font-tech text-[var(--text-muted)] max-w-[200px] truncate">
                      {p.info}
                      {p.tls_sni && <span className="ml-2" style={{ color: CYAN }}>TLS:{p.tls_sni}</span>}
                      {p.tls_version && <span className="ml-2" style={{ color: AMBER }}>[{p.tls_version}{p.tls_cipher ? ` ${p.tls_cipher}` : ''}]</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredPackets.length === 0 && (
          <div className="p-8 text-center">
            <div className="font-tech text-sm text-phosphor mb-2">◈</div>
            <span className="font-tech text-sm text-[var(--text-dim)]">
              // AWAITING PACKET STREAM...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}