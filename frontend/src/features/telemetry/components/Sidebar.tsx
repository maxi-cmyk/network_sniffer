/**
 * Sidebar Navigation - net-noir
 * Floating sidebar with keyboard binds
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  alertCount?: number;
  arpCount?: number;
}

interface TabItem {
  id: string;
  label: string;
  key: string;
  hasBadge: boolean;
}

const TABS: TabItem[] = [
  { id: "overview", label: "OVERVIEW", key: "1", hasBadge: false },
  { id: "alerts", label: "ALERTS", key: "2", hasBadge: true },
  { id: "simulation", label: "SIMULATE", key: "3", hasBadge: false },
  { id: "arp", label: "ARP TABLE", key: "4", hasBadge: true },
  { id: "settings", label: "SETTINGS", key: "5", hasBadge: false },
];

const CYAN = "#00ffcc";
const AMBER = "#ffaa00";
const PINK = "#ff3366";

export function Sidebar({ activeTab, onTabChange, alertCount, arpCount }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getBadge = (tabId: string): number => {
    if (tabId === "alerts") return alertCount || 0;
    if (tabId === "arp") return arpCount || 0;
    return 0;
  };

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed left-0 top-0 h-full surface-cyber z-30 transition-all duration-75",
        "border-r border-[var(--border)]",
        "flex flex-col"
      )}
    >
      {/* System Logo */}
      <div className="h-16 flex items-center justify-center border-b border-[var(--border)]">
        <div className="flex flex-col items-center">
          <div 
            className="w-3 h-3 rounded-full transition-all duration-300"
            style={{ 
              backgroundColor: CYAN,
              boxShadow: `0 0 8px ${CYAN}`
            }}
          />
          {isHovered && (
            <span className="font-display text-sm text-phosphor tracking-wider mt-2">
              NET-NOIR
            </span>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const badge = getBadge(tab.id);
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 h-12 transition-all duration-200",
                "relative"
              )}
            >
              {/* Active indicator */}
              <div 
                className="absolute left-0 w-[2px] h-8 rounded-r transition-all duration-200"
                style={{
                  backgroundColor: isActive ? CYAN : 'transparent',
                  boxShadow: isActive ? `0 0 8px var(--primary-glow)` : 'none'
                }}
              />
              
              {/* Key badge */}
              <div 
                className="w-8 h-8 rounded flex items-center justify-center font-tech text-sm transition-all duration-200"
                style={{
                  backgroundColor: isActive ? CYAN : (tab.id === "alerts" && alertCount && alertCount > 0 ? PINK : 'var(--surface-elevated)'),
                  color: isActive ? 'var(--background)' : (tab.id === "alerts" && alertCount && alertCount > 0 ? 'white' : 'var(--text-muted)')
                }}
              >
                {tab.key}
              </div>
              
              {/* Label + Badge */}
              {isHovered && (
                <div className="flex items-center gap-2">
                  <span 
                    className="font-tech text-sm tracking-wider transition-colors"
                    style={{ color: isActive ? 'var(--foreground)' : 'var(--text-muted)' }}
                  >
                    {tab.label}
                  </span>
                  {tab.hasBadge && badge > 0 && (
                    <span 
                      className="px-2 py-1 rounded text-sm font-tech"
                      style={{
                        backgroundColor: tab.id === "alerts" ? 'rgba(255, 51, 102, 0.2)' : 'rgba(255, 170, 0, 0.2)',
                        color: tab.id === "alerts" ? PINK : AMBER
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom hints */}
      {isHovered && (
        <div className="border-t border-[var(--border)] p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-tech text-xs" style={{ color: CYAN }}>K</span>
            <span className="font-tech text-xs" style={{ color: 'var(--text-dim)' }}>Command Palette</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-tech text-xs" style={{ color: CYAN }}>Space</span>
            <span className="font-tech text-xs" style={{ color: 'var(--text-dim)' }}>Start/Stop</span>
          </div>
        </div>
      )}

      {/* Collapsed state indicators */}
      {!isHovered && (
        <div className="py-4">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <div key={tab.id} className="relative flex items-center justify-center h-12">
                {isActive && (
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ 
                      backgroundColor: CYAN,
                      boxShadow: `0 0 6px ${CYAN}`
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}

// Help overlay component
interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpOverlay({ isOpen, onClose }: HelpOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative surface-cyber-elevated rounded-lg border border-[var(--primary)] p-6 shadow-[0_0_30px_var(--primary-glow)] animate-crt-on">
        <h2 className="font-display text-lg text-phosphor mb-6 text-center tracking-wider">
          KEYBINDINGS
        </h2>
        <div className="space-y-3 font-tech text-sm">
          <div className="flex items-center gap-6">
            <span className="w-20" style={{ color: CYAN }}>1-5</span>
            <span style={{ color: 'var(--foreground)' }}>Switch tabs</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="w-20" style={{ color: CYAN }}>Ctrl/⌘+K</span>
            <span style={{ color: 'var(--foreground)' }}>Command palette</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="w-20" style={{ color: CYAN }}>Space</span>
            <span style={{ color: 'var(--foreground)' }}>Start/Stop capture</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="w-20" style={{ color: CYAN }}>C</span>
            <span style={{ color: 'var(--foreground)' }}>Clear packets</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="w-20" style={{ color: CYAN }}>Esc</span>
            <span style={{ color: 'var(--foreground)' }}>Close panels</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="w-20" style={{ color: CYAN }}>?</span>
            <span style={{ color: 'var(--foreground)' }}>This help</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-8 w-full btn-cyber py-3 text-center"
        >
          [ESC] CLOSE
        </button>
      </div>
    </div>
  );
}