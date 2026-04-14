/**
 * Settings Panel Component
 * Configure alert thresholds
 */

"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

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
      <div className="surface-glass rounded-sm ring-1 ring-white/5 p-4">
        <span className="text-muted-foreground text-technical text-[10px]">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="surface-glass rounded-sm ring-1 ring-white/5 p-4 space-y-4">
      <div className="text-technical text-[10px] mb-4">ALERT SETTINGS</div>

      {settings?.test_mode && (
        <div className="bg-amber-500/20 text-amber-400 text-[10px] p-2 rounded-sm">
          TEST MODE - Lower thresholds active
        </div>
      )}

      <div className="space-y-3">
        <SliderSetting
          label="Port Scan Threshold"
          value={localSettings.portScan}
          min={5}
          max={100}
          step={5}
          unit="ports"
          onChange={(v) => setLocalSettings(s => ({ ...s, portScan: v }))}
        />

        <SliderSetting
          label="Port Scan Window"
          value={localSettings.portScanWindow}
          min={1}
          max={30}
          step={1}
          unit="seconds"
          onChange={(v) => setLocalSettings(s => ({ ...s, portScanWindow: v }))}
        />

        <SliderSetting
          label="SYN Flood Threshold"
          value={localSettings.synFlood}
          min={5}
          max={100}
          step={5}
          unit="SYNs"
          onChange={(v) => setLocalSettings(s => ({ ...s, synFlood: v }))}
        />

        <SliderSetting
          label="High Volume Threshold"
          value={localSettings.highVolume}
          min={102400}
          max={10485760}
          step={102400}
          unit="bytes"
          display={(v) => `${(v / 1024 / 1024).toFixed(1)} MB`}
          onChange={(v) => setLocalSettings(s => ({ ...s, highVolume: v }))}
        />

        <SliderSetting
          label="Packet Rate Threshold"
          value={localSettings.packetRate}
          min={10}
          max={500}
          step={10}
          unit="pps"
          onChange={(v) => setLocalSettings(s => ({ ...s, packetRate: v }))}
        />

        <SliderSetting
          label="Alert TTL"
          value={localSettings.alertTtl}
          min={10}
          max={300}
          step={10}
          unit="seconds"
          onChange={(v) => setLocalSettings(s => ({ ...s, alertTtl: v }))}
        />

        <SliderSetting
          label="Alert Cooldown"
          value={localSettings.alertCooldown}
          min={10}
          max={300}
          step={10}
          unit="seconds"
          onChange={(v) => setLocalSettings(s => ({ ...s, alertCooldown: v }))}
        />
      </div>

      <button
        onClick={saveSettings}
        disabled={saving}
        className={cn(
          "w-full py-3 rounded-sm text-[10px] font-medium transition-all",
          saving
            ? "bg-white/10 text-muted-foreground cursor-not-allowed"
            : saved
            ? "bg-green-600 text-white"
            : "bg-primary text-primary-foreground hover:brightness-110"
        )}
      >
        {saving ? "SAVING..." : saved ? "SAVED!" : "SAVE SETTINGS"}
      </button>

      <div className="text-[9px] text-muted-foreground text-center">
        Current: Port Scan {settings?.port_scan_threshold || 25} | SYN Flood {settings?.syn_flood_threshold || 30}
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
  unit,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  display?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-muted-foreground w-36">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
      />
      <span className="text-[10px] text-primary font-mono w-20 text-right">
        {display ? display(value) : `${value}${unit}`}
      </span>
    </div>
  );
}