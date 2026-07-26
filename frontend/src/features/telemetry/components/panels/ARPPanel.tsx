/**
 * ARP Panel - net-noir
 * Terminal-style ARP table display
 */

"use client";

import { InfoHint } from "../InfoHint";

const CYAN = "#00ffcc";
const PINK = "#ff3366";

interface ARPEntry {
  ip: string;
  mac: string;
}

interface Alert {
  alert_type: string;
  source_ip: string;
}

interface ARPPanelProps {
  arpTable: ARPEntry[];
  alerts: Alert[];
}

export function ARPPanel({ arpTable, alerts }: ARPPanelProps) {
  const conflictedIPs = new Set(
    alerts.filter((alert) => alert.alert_type === "arp_conflict").map((alert) => alert.source_ip)
  );

  return (
    <div className="surface-cyber rounded-md">
      <div className="p-3 border-b border-[var(--border)]">
        <span className="font-tech text-sm tracking-wider text-phosphor">
          ARP_TABLE
          <InfoHint label="What is the ARP table?">
            ARP links a local IP address to a MAC address. This table is learned from captured ARP packets; it is not a guarantee of device identity.
          </InfoHint>
        </span>
        <span className="ml-2 font-tech text-sm text-[var(--text-muted)]">
          ({arpTable.length} DEVICES)
        </span>
      </div>
      {arpTable.length ? (
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[var(--surface)]">
            <tr className="text-left font-tech text-sm text-[var(--text-dim)] border-b border-[var(--border)]">
              <th className="p-3 font-medium">IP_ADDRESS</th>
              <th className="p-3 font-medium">MAC_ADDRESS</th>
              <th className="p-3 font-medium">
                STATUS
                <InfoHint label="What does ARP status mean?">
                  Observed means one mapping was seen. Conflict means the detector saw this IP claimed by a different MAC address; inspect the related alert and verify the network context.
                </InfoHint>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {arpTable.map((entry) => {
              const hasConflict = conflictedIPs.has(entry.ip);
              return (
                <tr key={entry.ip} className="hover:bg-[var(--surface-elevated)] transition-colors">
                  <td className="p-3 font-tech" style={{ color: CYAN }}>{entry.ip}</td>
                  <td className="p-3 font-tech text-[var(--text-muted)]">{entry.mac}</td>
                  <td
                    className="p-3 font-tech"
                    title={hasConflict ? "This IP was observed with more than one MAC address during the current alert window." : "Only one MAC mapping has been observed for this IP during the current capture."}
                    style={{ color: hasConflict ? PINK : CYAN }}
                  >
                    {hasConflict ? "CONFLICT" : "OBSERVED"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-12">
          <div className="font-tech text-2xl text-phosphor mb-3">◈</div>
          <div className="font-tech text-sm text-[var(--text-dim)]">
            // NO DEVICES DISCOVERED
          </div>
          <div className="font-tech text-xs text-[var(--text-dim)] mt-2">
            // ARP SCAN PENDING...
          </div>
        </div>
      )}
    </div>
  );
}