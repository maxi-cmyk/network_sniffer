/**
 * Dashboard UI for real-time traffic analysis.
 * Main entry point that composes all sub-components.
 */

"use client";

import React, { useState, useMemo } from "react";
import { useTrafficStream } from "../hooks/useTrafficStream";
import { 
  SimulationPanel, 
  AlertsPanel, 
  ARPPanel, 
  OverviewPanel, 
  SettingsPanel 
} from "./panels";
import { Header } from "./Header";
import { TabNavigation } from "./TabNavigation";
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

  const filteredPackets = useMemo(() => {
    return (packets || []).filter(p => localProtocolFilter === "all" || p.proto === localProtocolFilter);
  }, [packets, localProtocolFilter]);

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
    <main className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Header 
          isConnected={isConnected}
          isConnecting={isConnecting}
          connectionError={!!connectionError}
          onConnect={connect}
          onDisconnect={disconnect}
          onClear={clearPackets}
          disabled={isConnecting}
        />

        {/* Stats */}
        {stats && <StatsGrid stats={stats} />}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PacketSizeChart packets={filteredPackets} />
          <ProtocolChart protocols={stats.protocols} />
        </div>

        {/* Tab Navigation */}
        <TabNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          alertCount={stats.alertCount}
          arpCount={stats.arpTable?.length}
        />

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </main>
  );
}