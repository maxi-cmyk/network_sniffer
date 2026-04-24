/**
 * Simulation Panel Component
 * Attack simulation controls and output display
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const CYAN = "#00ffcc";

interface SimulationPanelProps {
  API_URL: string;
}

export function SimulationPanel({ API_URL }: SimulationPanelProps) {
  const [targetIp, setTargetIp] = useState("127.0.0.1");
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [portScan, setPortScan] = useState(false);
  const [synFlood, setSynFlood] = useState(false);
  const [highVolume, setHighVolume] = useState(false);
  const [packetRate, setPacketRate] = useState(false);
  const [intensity, setIntensity] = useState(5);
  const [networkMode, setNetworkMode] = useState(false);
  const [history, setHistory] = useState<{
    id: number;
    timestamp: string;
    attacks: string[];
    results: any[];
    alertCount: number;
  }[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("simulation_history");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const runSimulation = async () => {
    if (!portScan && !synFlood && !highVolume && !packetRate) return;
    setRunning(true);
    setLogs([]);

    const endpoint = networkMode ? "/alerts/sim/real" : "/alerts/simulate";
    const selectedAttacks: string[] = [];
    if (portScan) selectedAttacks.push("port_scan");
    if (synFlood) selectedAttacks.push("syn_flood");
    if (highVolume) selectedAttacks.push("high_volume");
    if (packetRate) selectedAttacks.push("packet_rate");

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          port_scan: portScan,
          syn_flood: synFlood,
          high_volume: highVolume,
          packet_rate: packetRate,
          target_ip: targetIp,
          intensity: intensity,
        }),
      });
      const data = await res.json();

      const newLogs: string[] = [];
      const results = data.results || [];
      let triggeredCount = 0;

      results.forEach((r: any) => {
        if (r.triggered || r.sent) {
          triggeredCount++;
          if (r.type === "port_scan") {
            newLogs.push(`✓ Port Scan: ${r.ports || r.sent} ports scanned`);
          } else if (r.type === "syn_flood") {
            newLogs.push(`✓ SYN Flood: ${r.count || r.sent} SYNs sent`);
          } else if (r.type === "high_volume") {
            newLogs.push(`✓ High Volume: ${r.bytes || r.payload_size} bytes`);
          } else if (r.type === "packet_rate") {
            newLogs.push(`✓ Packet Rate: ${r.iterations} iterations`);
          }
        } else {
          newLogs.push(`✗ ${r.type}: skipped`);
        }
      });

      const alertCount = data.alerts?.length || 0;
      newLogs.push(`Alerts triggered: ${alertCount}`);

      setLogs(newLogs);

      const newHistory = [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          attacks: selectedAttacks,
          results: results,
          alertCount: alertCount,
        },
        ...history.slice(0, 9),
      ];
      setHistory(newHistory);
      if (typeof window !== "undefined") {
        localStorage.setItem("simulation_history", JSON.stringify(newHistory));
      }
    } catch (e) {
      setLogs([`Error: ${e}`]);
    }
    setRunning(false);
  };

  const clearHistory = () => {
    setHistory([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("simulation_history");
    }
  };

  const isDisabled = running || (!portScan && !synFlood && !highVolume && !packetRate);

  return (
    <div className="surface-cyber rounded-md p-4 space-y-4">
      <div className="font-tech text-sm tracking-wider text-phosphor border-b border-[var(--border)] pb-3 mb-4">ATTACK_SIMULATION</div>

      {/* Target IP */}
      <div className="flex items-center gap-4">
        <label className="font-tech text-sm text-[var(--text-muted)]">TARGET_IP:</label>
        <input
          type="text"
          value={targetIp}
          onChange={(e) => setTargetIp(e.target.value)}
          className="px-3 h-10 bg-black/40 border border-white/10 rounded-sm text-[11px] text-primary font-mono w-40 focus:outline-none focus:border-primary/40"
          placeholder="127.0.0.1"
        />
      </div>

      {/* Intensity Slider */}
      <div className="flex items-center gap-4">
        <label className="font-tech text-sm text-[var(--text-muted)]">INTENSITY:</label>
        <input
          type="range"
          min="1"
          max="10"
          value={intensity}
          onChange={(e) => setIntensity(parseInt(e.target.value))}
          className="flex-1 h-2 bg-[var(--surface-elevated)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)]"
        />
        <span className="font-tech text-sm" style={{ color: CYAN }}>{intensity}</span>
      </div>

      {/* Attack Type Toggles */}
      <div className="grid grid-cols-2 gap-3">
        <Toggle
          checked={portScan}
          onChange={setPortScan}
          label="Port Scan"
        />
        <Toggle
          checked={synFlood}
          onChange={setSynFlood}
          label="SYN Flood"
        />
        <Toggle
          checked={highVolume}
          onChange={setHighVolume}
          label="High Volume"
        />
        <Toggle
          checked={packetRate}
          onChange={setPacketRate}
          label="Packet Rate"
        />
      </div>

      {/* Network Mode Toggle */}
      <label
        className={cn(
          "flex items-center gap-3 p-3 rounded-sm cursor-pointer border transition-colors",
          networkMode
            ? "border-primary bg-primary/10"
            : "border-[var(--border)] hover:bg-[var(--surface-elevated)]"
        )}
      >
        <input
          type="checkbox"
          checked={networkMode}
          onChange={(e) => setNetworkMode(e.target.checked)}
          className="sr-only"
        />
        <span
          className={cn(
            "w-3 h-3 rounded-sm border",
            networkMode ? "bg-primary border-primary" : "border-white/30"
          )}
        >
          {networkMode && (
            <span className="text-[8px] text-black block text-center">✓</span>
          )}
        </span>
        <span className="font-tech text-sm text-[var(--text-foreground)]">Network Mode (Real Packets)</span>
        {networkMode && (
          <span className="font-tech text-xs text-[var(--text-dim)] ml-auto">via Scapy</span>
        )}
      </label>

      {/* Run Button */}
      <button
        onClick={runSimulation}
        disabled={isDisabled}
        className={cn(
          "w-full py-3 rounded-sm font-tech text-sm tracking-wider transition-all",
          isDisabled
            ? "bg-[var(--surface-elevated)] text-[var(--text-muted)] cursor-not-allowed"
            : "bg-primary text-primary-foreground hover:brightness-110"
        )}
      >
        {running ? "RUNNING..." : "RUN SIMULATION"}
      </button>

      {/* Output */}
      {logs.length > 0 && (
        <div className="bg-black/40 rounded-sm p-3 max-h-32 overflow-auto">
          <div className="font-tech text-sm text-[var(--text-dim)] mb-2">OUTPUT:</div>
          {logs.map((log, i) => (
            <div key={i} className="font-tech text-sm" style={{ color: CYAN }}>
              {log}
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-tech text-sm text-[var(--text-dim)]">HISTORY</div>
            <button
              onClick={clearHistory}
              className="font-tech text-xs hover:text-[var(--primary)]"
            >
              Clear History
            </button>
          </div>
          <div className="space-y-1 max-h-24 overflow-auto">
            {history.map((entry, i) => (
              <div
                key={entry.id}
                className="font-tech text-sm text-[var(--text-dim)]"
              >
                #{i + 1} - {entry.attacks.join(", ")} - {entry.alertCount} alerts -{" "}
                {entry.timestamp}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 p-3 rounded-sm cursor-pointer border transition-colors",
        checked
          ? "border-primary bg-primary/10"
          : "border-[var(--border)] hover:bg-[var(--surface-elevated)]"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={cn(
          "w-3 h-3 rounded-sm border",
          checked ? "bg-primary border-primary" : "border-white/30"
        )}
      >
        {checked && (
          <span className="text-[8px] text-black block text-center">✓</span>
        )}
      </span>
      <span className="font-tech text-sm text-[var(--text-foreground)]">{label}</span>
    </label>
  );
}