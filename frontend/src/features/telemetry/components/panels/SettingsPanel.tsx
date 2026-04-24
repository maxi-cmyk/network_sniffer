/**
 * Settings Panel - net-noir
 * Terminal-style settings with phosphor aesthetic
 */

"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const CYAN = "#00ffcc";
const AMBER = "#ffaa00";

interface SettingsPanelProps {
  API_URL: string;
}

interface Settings {
  port_scan_threshold: number;
  port_scan_window: number;
  syn_flood_threshold: number;
  high_volume_threshold: number;
  packet_rate_threshold: number;
  alert_ttl: number;
  alert_cooldown: number;
  test_mode: boolean;
}

export function SettingsPanel({ API_URL }: SettingsPanelProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [localSettings, setLocalSettings] = useState({
    portScan: 25,
    portScanWindow: 5,
    synFlood: 30,
    highVolume: 1048576,
    packetRate: 100,
    alertTtl: 60,
    alertCooldown: 60,
  });

  useEffect(() => {
    fetch(`${API_URL}/alerts/settings`)
      .then(r => r.json())
      .then(data => {
        setSettings(data);
        setLocalSettings({
          portScan: data.port_scan_threshold || 25,
          portScanWindow: data.port_scan_window || 5,
          synFlood: data.syn_flood_threshold || 30,
          highVolume: data.high_volume_threshold || 1048576,
          packetRate: data.packet_rate_threshold || 100,
          alertTtl: data.alert_ttl || 60,
          alertCooldown: data.alert_cooldown || 60,
        });
      })
      .finally(() => setLoading(false));
  }, [API_URL]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/alerts/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          port_scan_threshold: localSettings.portScan,
          port_scan_window: localSettings.portScanWindow,
          syn_flood_threshold: localSettings.synFlood,
          high_volume_threshold: localSettings.highVolume,
          packet_rate_threshold: localSettings.packetRate,
          alert_ttl: localSettings.alertTtl,
          alert_cooldown: localSettings.alertCooldown,
        }),
      });
      const data = await res.json();
      setSettings(data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="surface-cyber rounded-md p-6 text-center">
        <div className="font-tech text-sm text-phosphor animate-pulse mb-2">◈</div>
        <div className="font-tech text-sm text-[var(--text-dim)]">
          // LOADING CONFIG...
        </div>
      </div>
    );
  }

  return (
    <div className="surface-cyber rounded-md p-4 space-y-4">
<div className="font-tech text-sm tracking-wider text-phosphor border-b border-[var(--border)] pb-3">
        SYSTEM_SETTINGS
      </div>

      {settings?.test_mode && (
        <div 
          className="font-tech text-sm p-3 rounded"
          style={{ 
            backgroundColor: "rgba(255, 170, 0, 0.12)", 
            color: AMBER,
            border: `1px solid ${AMBER}`
          }}
        >
          ⚠ TEST MODE ACTIVE
        </div>
      )}

      <div className="space-y-4">
        <SliderSetting
          label="Port Scan Threshold"
          value={localSettings.portScan}
          min={5}
          max={100}
          step={5}
          onChange={(v) => setLocalSettings(s => ({ ...s, portScan: v }))}
        />

        <SliderSetting
          label="Port Scan Window"
          value={localSettings.portScanWindow}
          min={1}
          max={30}
          step={1}
          onChange={(v) => setLocalSettings(s => ({ ...s, portScanWindow: v }))}
        />

        <SliderSetting
          label="SYN Flood Threshold"
          value={localSettings.synFlood}
          min={5}
          max={100}
          step={5}
          onChange={(v) => setLocalSettings(s => ({ ...s, synFlood: v }))}
        />

        <SliderSetting
          label="High Volume Threshold"
          value={localSettings.highVolume}
          min={102400}
          max={10485760}
          step={102400}
          displayValue={(v) => `${(v / 1024 / 1024).toFixed(1)} MB`}
          onChange={(v) => setLocalSettings(s => ({ ...s, highVolume: v }))}
        />

        <SliderSetting
          label="Packet Rate Threshold"
          value={localSettings.packetRate}
          min={10}
          max={500}
          step={10}
          onChange={(v) => setLocalSettings(s => ({ ...s, packetRate: v }))}
        />

        <SliderSetting
          label="Alert TTL"
          value={localSettings.alertTtl}
          min={10}
          max={300}
          step={10}
          displayValue={(v) => `${v}s`}
          onChange={(v) => setLocalSettings(s => ({ ...s, alertTtl: v }))}
        />

        <SliderSetting
          label="Alert Cooldown"
          value={localSettings.alertCooldown}
          min={10}
          max={300}
          step={10}
          displayValue={(v) => `${v}s`}
          onChange={(v) => setLocalSettings(s => ({ ...s, alertCooldown: v }))}
        />
      </div>

      <button
        onClick={saveSettings}
        disabled={saving}
        className={cn(
          "w-full py-3 rounded font-tech text-sm tracking-wider transition-all",
          saving
            ? "bg-[var(--surface-elevated)] text-[var(--text-dim)] border border-[var(--border)] cursor-not-allowed"
            : saved
            ? "border-[var(--secondary)]"
            : "btn-primary"
        )}
        style={saved ? { backgroundColor: AMBER } : undefined}
      >
        {saving ? "// SAVING..." : saved ? "[SAVED]" : "[SAVE CONFIG]"}
      </button>

      <div className="font-tech text-xs text-[var(--text-dim)] text-center">
        CURRENT: PS:{settings?.port_scan_threshold || 25} | SF:{settings?.syn_flood_threshold || 30}
      </div>
    </div>
  );
}

function SliderSetting({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-tech text-sm text-[var(--text-muted)] w-40">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 h-2 bg-[var(--surface-elevated)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:shadow-[0_0_8px_var(--primary-glow)]"
      />
      <span className="font-tech text-sm w-20 text-right" style={{ color: CYAN }}>
        {displayValue ? displayValue(value) : value}
      </span>
    </div>
  );
}