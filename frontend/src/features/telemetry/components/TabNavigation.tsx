/**
 * Tab Navigation Component
 */

import { cn } from "@/lib/utils";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  alertCount?: number;
  arpCount?: number;
}

type TabType = "overview" | "alerts" | "simulation" | "arp" | "settings";

const TABS = ["overview", "alerts", "simulation", "arp", "settings"] as const;

export function TabNavigation({ activeTab, onTabChange, alertCount, arpCount }: TabNavigationProps) {
  return (
    <div className="flex border-b border-white/10">
      {TABS.map(tab => (
        <button 
          key={tab} 
          onClick={() => onTabChange(tab)} 
          className={cn(
            "px-4 py-3 text-[10px] text-technical transition-all border-b-2", 
            activeTab === tab 
              ? "border-primary text-primary bg-primary/5" 
              : "border-transparent text-muted-foreground hover:text-white"
          )}
        >
          {tab.toUpperCase()}
          {tab === "alerts" && alertCount ? ` (${alertCount})` : ""}
          {tab === "arp" && arpCount ? ` (${arpCount})` : ""}
        </button>
      ))}
    </div>
  );
}