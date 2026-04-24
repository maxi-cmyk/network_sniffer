/**
 * Dashboard - net-noir
 * Main entry point with sidebar, command palette, and terminal aesthetic
 */

"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useTrafficStream } from "../hooks/useTrafficStream";
import { 
  SimulationPanel, 
  AlertsPanel, 
  ARPPanel, 
  OverviewPanel, 
  SettingsPanel 
} from "./panels";
import { Header } from "./Header";
import { CommandPalette, CommandHint } from "./CommandPalette";
import { Sidebar, HelpOverlay } from "./Sidebar";
import { StatsGrid } from "./StatsGrid";
import { PacketSizeChart } from "./PacketSizeChart";
import { ProtocolChart } from "./ProtocolChart";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type TabType = "overview" | "alerts" | "simulation" | "arp" | "settings";

export default function Dashboard() {
  const { 
    isConnected, 
    isConnecting, 
    packets, 
    stats, 
    connect, 
    disconnect, 
    clearPackets,
    setFilters,
    ipFilter,
    protocolFilter,
    connectionError 
  } = useTrafficStream();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [localProtocolFilter, setLocalProtocolFilter] = useState("all");
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [packetsPerSecond, setPacketsPerSecond] = useState(0);

  const filteredPackets = useMemo(() => {
    return (packets || []).filter(p => localProtocolFilter === "all" || p.proto === localProtocolFilter);
  }, [packets, localProtocolFilter]);

  // Calculate packets per second
  useEffect(() => {
    if (!isConnected || !packets?.length) {
      setPacketsPerSecond(0);
      return;
    }
    
    const now = Date.now();
    const recent = packets.filter(p => now - new Date(p.timestamp).getTime() < 1000);
    setPacketsPerSecond(recent.length);
  }, [packets, isConnected]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsPaletteOpen(true);
        return;
      }

      // Help
      if (e.key === "?" && !e.shiftKey) {
        e.preventDefault();
        setIsHelpOpen(true);
        return;
      }

      // Tab switching (1-5)
      if (e.key >= "1" && e.key <= "5") {
        e.preventDefault();
        const tabs: TabType[] = ["overview", "alerts", "simulation", "arp", "settings"];
        setActiveTab(tabs[parseInt(e.key) - 1]);
        return;
      }

      // Start/Stop with Space
      if (e.key === " " && !isConnected && !isConnecting) {
        e.preventDefault();
        connect();
        return;
      }

      // Clear with C
      if (e.key === "c" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        clearPackets();
        return;
      }

      // Escape to close overlays
      if (e.key === "Escape") {
        if (isHelpOpen) setIsHelpOpen(false);
        else if (isPaletteOpen) setIsPaletteOpen(false);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConnected, isConnecting, isPaletteOpen, isHelpOpen, connect, clearPackets]);

  // Commands for palette
  const commands = useMemo(() => [
    { id: "start", label: "START CAPTURE", shortcut: "Space", category: "Capture", action: connect },
    { id: "stop", label: "STOP CAPTURE", category: "Capture", action: disconnect },
    { id: "clear", label: "CLEAR PACKETS", shortcut: "C", category: "Capture", action: clearPackets },
    { id: "overview", label: "VIEW: OVERVIEW", shortcut: "1", category: "Navigate", action: () => setActiveTab("overview") },
    { id: "alerts", label: "VIEW: ALERTS", shortcut: "2", category: "Navigate", action: () => setActiveTab("alerts") },
    { id: "simulate", label: "VIEW: SIMULATION", shortcut: "3", category: "Navigate", action: () => setActiveTab("simulation") },
    { id: "arp", label: "VIEW: ARP TABLE", shortcut: "4", category: "Navigate", action: () => setActiveTab("arp") },
    { id: "settings", label: "VIEW: SETTINGS", shortcut: "5", category: "Navigate", action: () => setActiveTab("settings") },
    { id: "filter-tcp", label: "FILTER: TCP", category: "Filter", action: () => setLocalProtocolFilter("TCP") },
    { id: "filter-udp", label: "FILTER: UDP", category: "Filter", action: () => setLocalProtocolFilter("UDP") },
    { id: "filter-all", label: "FILTER: ALL", category: "Filter", action: () => setLocalProtocolFilter("all") },
    { id: "help", label: "HELP", shortcut: "?", category: "System", action: () => setIsHelpOpen(true) },
  ], [connect, disconnect, clearPackets]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewPanel 
            packets={packets} 
            filteredPackets={filteredPackets} 
            connections={stats.connections} 
            topTalkers={stats.topTalkers} 
            localProtocolFilter={localProtocolFilter} 
            onProtocolFilterChange={setLocalProtocolFilter}
            ipFilter={ipFilter}
            onIpFilterChange={(f) => setFilters(f, protocolFilter)}
          />
        );
      case "alerts":
        return <AlertsPanel alerts={stats.alerts} alertCount={stats.alertCount} />;
      case "simulation":
        return <SimulationPanel API_URL={API_URL} />;
      case "arp":
        return <ARPPanel arpTable={stats.arpTable} />;
      case "settings":
        return <SettingsPanel API_URL={API_URL} />;
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-6 scanlines grain crt-vignette">
      <div className="max-w-[calc(100vw-80px)] ml-[60px] space-y-4">
        {/* Header with Waveform */}
        <Header 
          isConnected={isConnected}
          isConnecting={isConnecting}
          connectionError={!!connectionError}
          onConnect={connect}
          onDisconnect={disconnect}
          onClear={clearPackets}
          disabled={isConnecting}
          packetsPerSecond={packetsPerSecond}
        />

        {/* Stats Grid */}
        {stats && <StatsGrid stats={stats} />}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PacketSizeChart packets={filteredPackets} />
          <ProtocolChart protocols={stats.protocols} />
        </div>

        {/* Tab Content with CRT animation */}
        <div className="animate-crt-on" key={activeTab}>
          {renderTabContent()}
        </div>
      </div>

      {/* Floating Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabType)}
        alertCount={stats.alertCount}
        arpCount={stats.arpTable?.length}
      />

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        commands={commands}
      />
      <CommandHint />

      {/* Help Overlay */}
      <HelpOverlay 
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </main>
  );
}