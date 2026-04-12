/**
 * ARP Panel Component
 * Displays ARP table of discovered devices
 */

"use client";

interface ARPEntry {
  ip: string;
  mac: string;
}

interface ARPPanelProps {
  arpTable: ARPEntry[];
}

export function ARPPanel({ arpTable }: ARPPanelProps) {
  return (
    <div className="surface-glass rounded-sm ring-1 ring-white/5">
      <div className="p-3 border-b border-white/5">
        <span className="text-technical text-[10px]">ARP TABLE</span>
        <span className="ml-2 text-[10px] text-muted-foreground">
          ({arpTable.length} devices)
        </span>
      </div>
      {arpTable.length ? (
        <table className="w-full text-[10px]">
          <thead className="sticky top-0 bg-background/80">
            <tr className="text-left text-technical text-[10px] border-b border-border/10">
              <th className="p-2 font-medium">IP Address</th>
              <th className="p-2 font-medium">MAC Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {arpTable.map((entry, i) => (
              <tr key={i} className="hover:bg-white/5">
                <td className="p-2 font-mono text-primary">{entry.ip}</td>
                <td className="p-2 font-mono text-muted-foreground">{entry.mac}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="p-4 text-muted-foreground text-technical text-[10px]">
          No ARP entries
        </div>
      )}
    </div>
  );
}