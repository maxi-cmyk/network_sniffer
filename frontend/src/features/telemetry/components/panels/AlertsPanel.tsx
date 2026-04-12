/**
 * Alerts Panel Component
 * Displays active network alerts
 */

"use client";

import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  source_ip: string;
  description: string;
  timestamp: string;
  count: number;
}

interface AlertsPanelProps {
  alerts: Alert[];
  alertCount: number;
}

export function AlertsPanel({ alerts, alertCount }: AlertsPanelProps) {
  return (
    <div className="surface-glass rounded-sm ring-1 ring-white/5 p-4">
      <div className="p-3 border-b border-white/5">
        <span className="text-technical text-[10px]">ACTIVE ALERTS</span>
        <span className="ml-2 text-[10px] text-muted-foreground">
          ({alertCount} active)
        </span>
      </div>

      {alerts.length > 0 ? (
        <div className="space-y-2 mt-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-sm text-[10px]",
                alert.severity === "critical"
                  ? "bg-red-500/20 text-red-400"
                  : alert.severity === "warning"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-blue-500/20 text-blue-400"
              )}
            >
              <span>
                {alert.severity === "critical"
                  ? "🔴"
                  : alert.severity === "warning"
                  ? "🟡"
                  : "🔵"}
              </span>
              <span className="font-mono">{alert.source_ip}</span>
              <span className="flex-1">{alert.description}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground text-technical text-[10px] mt-3">
          No alerts
        </div>
      )}
    </div>
  );
}