/**
 * ARP Panel - net-noir
 * Terminal-style ARP table display
 */

"use client";

const CYAN = "#00ffcc";

interface ARPEntry {
  ip: string;
  mac: string;
}

interface ARPPanelProps {
  arpTable: ARPEntry[];
}

export function ARPPanel({ arpTable }: ARPPanelProps) {
  return (
    <div className="surface-cyber rounded-md">
      <div className="p-3 border-b border-[var(--border)]">
<span className="font-tech text-sm tracking-wider text-phosphor">ARP_TABLE</span>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {arpTable.map((entry, i) => (
              <tr key={i} className="hover:bg-[var(--surface-elevated)] transition-colors">
                <td className="p-3 font-tech" style={{ color: CYAN }}>{entry.ip}</td>
                <td className="p-3 font-tech text-[var(--text-muted)]">{entry.mac}</td>
              </tr>
            ))}
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