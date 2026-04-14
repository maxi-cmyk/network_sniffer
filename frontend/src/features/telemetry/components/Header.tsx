/**
 * Header Component
 * Contains title, status indicator, and control buttons
 */

import { cn } from "@/lib/utils";

interface HeaderProps {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onClear: () => void;
  disabled?: boolean;
}

const ACCENT = "#69f6b8";

export function Header({ isConnected, isConnecting, connectionError, onConnect, onDisconnect, onClear, disabled }: HeaderProps) {
  const statusColor = isConnected ? ACCENT : connectionError ? "#ef4444" : isConnecting ? "#f59e0b" : "#525252";
  const statusText = isConnected ? "Live" : connectionError ? "Error" : isConnecting ? "Connecting..." : "Disconnected";

  return (
    <div className="flex items-center justify-between pb-4 border-b border-white/5">
      <div>
        <h1 className="text-xl font-bold text-white tracking-widest uppercase">Network Sniffer</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-technical text-[9px] text-primary/60">Intercept Active</span>
        </div>
      </div>
      
      {/* Status & Controls */}
      <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-sm ring-1 ring-white/10">
        <div className="relative flex items-center justify-center w-3 h-3">
          <div className={cn("absolute w-full h-full rounded-full transition-all duration-500", isConnected ? "bg-primary animate-ping opacity-20" : isConnecting ? "bg-amber-500 animate-pulse" : "bg-white/20")} />
          <div className="relative w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
        </div>
        <span className="text-technical text-[10px] text-muted-foreground mr-1">{statusText}</span>
      </div>

      <div className="flex items-center gap-2">
        {isConnected ? (
          <button onClick={onDisconnect} className="px-4 h-12 rounded-sm text-[10px] text-technical font-medium bg-white/5 text-white hover:bg-white/10 border border-white/10">Stop</button>
        ) : (
          <button onClick={onConnect} disabled={disabled} className={cn("px-4 h-12 rounded-sm text-[10px] font-medium transition-all duration-300 shadow-[0_0_15px_rgba(105,246,184,0.2)]", disabled ? "opacity-30 bg-white/10 text-muted-foreground" : "bg-primary text-primary-foreground hover:brightness-110")}>
            {isConnecting ? "Connecting..." : "Start"}
          </button>
        )}
        <button onClick={onClear} className="px-4 h-12 rounded-sm text-[10px] text-technical font-medium bg-white/5 text-white hover:bg-white/10 border border-white/10">Clear</button>
      </div>
    </div>
  );
}