/**
 * Header Component - net-noir
 * Waveform status, system title, control buttons
 */

"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onClear: () => void;
  disabled?: boolean;
  packetsPerSecond?: number;
}

const CYAN = "#00ffcc";
const AMBER = "#ffaa00";
const PINK = "#ff3366";
const DIM = "#2a3a35";

export function Header({ 
  isConnected, 
  isConnecting, 
  connectionError, 
  onConnect, 
  onDisconnect, 
  onClear, 
  disabled,
  packetsPerSecond = 0 
}: HeaderProps) {
  const [typedText, setTypedText] = useState("");
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(12).fill(10));
  
  const statusText = isConnected ? "CAPTURING" : connectionError ? "ERROR" : isConnecting ? "INITIALIZING" : "STANDBY";
  const statusColor = isConnected ? CYAN : connectionError ? PINK : isConnecting ? AMBER : DIM;

  // Typewriter effect for status
  useEffect(() => {
    if (isConnected || connectionError) {
      setTypedText("");
      let i = 0;
      const interval = setInterval(() => {
        if (i < statusText.length) {
          setTypedText(statusText.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 40);
      return () => clearInterval(interval);
    }
  }, [statusText, isConnected, connectionError]);

  // Waveform animation when connected
  useEffect(() => {
    if (!isConnected) {
      setWaveformBars(Array(24).fill(10));
      return;
    }

    const interval = setInterval(() => {
      setWaveformBars(prev => {
        const intensity = Math.min(packetsPerSecond / 50, 1);
        return prev.map((_, i) => {
          const base = 10 + Math.random() * 60 * intensity;
          const variation = Math.sin(Date.now() / 200 + i) * 20;
          return Math.max(10, Math.min(100, base + variation));
        });
      });
    }, 80);

    return () => clearInterval(interval);
  }, [isConnected, packetsPerSecond]);

  return (
    <header className="flex items-center justify-between pb-4 border-b border-[var(--border)] crt-vignette">
      {/* Left: System Title */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl text-phosphor tracking-wider animate-flicker">
          NET-NOIR
        </h1>
        <div className="flex items-center gap-3">
          <span className="font-tech text-sm" style={{ color: statusColor }}>
            [{typedText}<span className="cursor-blink">{" "}</span>]
          </span>
        </div>
      </div>

      {/* Center: Waveform Visualizer */}
      <div className="flex items-center gap-4 bg-[var(--surface)] px-5 py-3 rounded-md border border-[var(--border)]">
        <div className="flex items-center gap-1 h-10">
          {waveformBars.map((height, i) => (
            <div
              key={i}
              className="w-1 rounded-full transition-all duration-50"
              style={{
                height: `${height}%`,
                backgroundColor: isConnected ? CYAN : DIM,
                boxShadow: isConnected ? `0 0 4px ${CYAN}` : 'none',
                opacity: isConnected ? 0.7 + (height / 200) : 0.3,
              }}
            />
          ))}
        </div>
        <div className="flex flex-col items-center">
          <span 
            className="font-tech text-lg font-bold"
            style={{ color: isConnected ? CYAN : DIM }}
          >
            {packetsPerSecond}
          </span>
          <span className="font-tech text-xs text-[var(--text-muted)]">
            PKT/S
          </span>
        </div>
      </div>

      {/* Right: Control Buttons */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <button 
            onClick={onDisconnect} 
            className={cn(
              "btn-cyber h-12",
              "hover:border-[var(--tertiary)] hover:text-[var(--tertiary)]",
              "hover:shadow-[0_0_15px_var(--tertiary-glow)]"
            )}
          >
            [STOP]
          </button>
        ) : (
          <button 
            onClick={onConnect} 
            disabled={disabled}
            className={cn(
              "btn-cyber btn-primary h-12",
              disabled && "opacity-30 cursor-not-allowed"
            )}
          >
            {isConnecting ? "[INIT...]" : "[START]"}
          </button>
        )}
        <button 
          onClick={onClear} 
          className="btn-cyber h-12 hover:border-[var(--secondary)] hover:text-[var(--secondary)]"
        >
          [CLR]
        </button>
      </div>
    </header>
  );
}