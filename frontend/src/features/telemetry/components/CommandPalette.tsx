/**
 * Command Palette - net-noir
 * Ctrl+K / Cmd+K to open, fuzzy search commands
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
  category: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

const CYAN = "#00ffcc";
const AMBER = "#ffaa00";
const DIM = "#5a8a70";

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        onClose();
        break;
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Global keyboard listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Palette */}
      <div className="relative w-full max-w-md surface-cyber-elevated rounded-lg border border-[var(--primary)] shadow-[0_0_30px_var(--primary-glow)] animate-crt-on overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
          <span className="font-tech text-[var(--primary)]">{" > "}</span>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Type command..."
            className="flex-1 bg-transparent font-tech text-[var(--foreground)] text-sm outline-none placeholder:text-[var(--text-dim)]"
          />
          <span className="font-tech text-xs text-[var(--text-dim)]">ESC</span>
        </div>

        {/* Commands List */}
        <div className="max-h-80 overflow-y-auto py-2">
          {Object.entries(grouped).map(([category, cmds]) => (
            <div key={category}>
              <div className="px-4 py-1 font-tech text-sm text-[var(--text-dim)] tracking-wider">
                {category.toUpperCase()}
              </div>
              {cmds.map(cmd => {
                const isSelected = flatIndex === selectedIndex;
                flatIndex++;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(flatIndex - 1)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2 text-left transition-colors",
                      isSelected 
                        ? "bg-[var(--primary-dim)] text-[var(--foreground)]" 
                        : "text-[var(--text-muted)] hover:bg-[var(--surface)]"
                    )}
                  >
                    <span className="font-tech text-sm">{cmd.label}</span>
                    {cmd.shortcut && (
                      <span className="font-tech text-xs text-[var(--text-dim)]">
                        {cmd.shortcut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          
          {filteredCommands.length === 0 && (
            <div className="px-4 py-6 text-center">
              <span className="font-tech text-xs text-[var(--text-dim)]">
                // No commands found
              </span>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-[var(--border)] px-4 py-2 flex items-center gap-4">
<span className="font-tech text-xs text-[var(--text-dim)]">
            <span className="text-[var(--primary)]">↑↓</span> navigate

            <span className="text-[var(--primary)]">↵</span> select

            <span className="text-[var(--primary)]">esc</span> close
          </span>
          <span className="font-tech text-xs text-[var(--text-dim)]">
            <span className="text-[var(--primary)]">↵</span> select
          </span>
          <span className="font-tech text-xs text-[var(--text-dim)]">
            <span className="text-[var(--primary)]">esc</span> close
          </span>
        </div>
      </div>
    </div>
  );
}

// Keyboard hint component - shown in corner
export function CommandHint() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac"));
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="surface-cyber px-3 py-2 rounded border border-[var(--border)]">
        <span className="font-tech text-xs text-[var(--text-muted)]">
          <span className="text-[var(--primary)]">{isMac ? "⌘" : "Ctrl"}</span>
          <span className="text-[var(--text-dim)]">+</span>
          <span className="text-[var(--primary)]">K</span>
          <span className="text-[var(--text-dim)] ml-2">commands</span>
        </span>
      </div>
    </div>
  );
}