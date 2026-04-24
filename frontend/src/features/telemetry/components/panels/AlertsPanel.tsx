/**
 * Alerts Panel - net-noir
 * Terminal-style alert display
 */

"use client";

const CYAN = "#00ffcc";
const AMBER = "#ffaa00";
const PINK = "#ff3366";

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

const SEVERITY_STYLES = {
  critical: { color: PINK, bg: "rgba(255, 51, 102, 0.12)" },
  warning: { color: AMBER, bg: "rgba(255, 170, 0, 0.12)" },
  info: { color: CYAN, bg: "rgba(0, 255, 204, 0.12)" },
};

export function AlertsPanel({ alerts, alertCount }: AlertsPanelProps) {
  return (
    <div className="surface-cyber rounded-md p-4">
      <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
<span className="font-tech text-sm tracking-wider text-phosphor">ACTIVE_ALERTS</span>
          <span className="font-tech text-sm text-[var(--text-muted)]">
          ({alertCount})
        </span>
      </div>

      {alerts.length > 0 ? (
        <div className="space-y-2 mt-3">
          {alerts.map((alert) => {
            const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
            return (
              <div
                key={alert.id}
                className="flex items-center gap-3 p-3 rounded font-tech text-sm"
                style={{ 
                  backgroundColor: style.bg,
                  borderLeft: `2px solid ${style.color}`
                }}
              >
                <span style={{ color: style.color }}>
                  {alert.severity === "critical"
                    ? "◆"
                    : alert.severity === "warning"
                    ? "◇"
                    : "○"}
                </span>
                <span className="font-tech" style={{ color: CYAN }}>{alert.source_ip}</span>
                <span className="flex-1 text-[var(--foreground)]">{alert.description}</span>
                <span className="font-tech text-[var(--text-dim)]">
                  {new Date(alert.timestamp).toLocaleTimeString('en-GB', { hour12: false })}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="font-tech text-2xl text-phosphor mb-3">✓</div>
          <div className="font-tech text-sm text-[var(--text-dim)]">
            // NO ALERTS DETECTED
          </div>
<div className="font-tech text-xs text-[var(--text-dim)] mt-2">
            // NO ACTIVE THREATS DETECTED
          </div>
        </div>
      )}
    </div>
  );
}