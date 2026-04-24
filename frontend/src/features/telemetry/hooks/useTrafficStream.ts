/**
 * WebSocket stream hook for network traffic.
 */

// IMPORTS
import { useState, useEffect, useCallback, useRef } from "react";

// TYPE DEFINITIONS

/**
 * PacketData Interface
 * -------------------
 * Defines the shape of a single packet from the backend.
 * This matches what the Python backend sends.
 * 
 * What each field means:
 * - timestamp: When the packet was captured (as ISO string)
 * - src: Source IP address (where packet came from)
 * - dst: Destination IP address (where packet is going)
 * - src_port: Source port number (the "door" on the sending computer)
 * - dst_port: Destination port number (the "door" on the receiving computer)
 * - proto: Protocol type (TCP, UDP, ICMP, ARP)
 * - length: Size of packet in bytes
 * - info: Human-readable description
 */
export interface PacketData {
  timestamp: string;
  src: string;
  dst: string;
  src_port: number;
  dst_port: number;
  proto: string;
  length: number;
  info: string;
  // L7 decoded data
  dns_domain?: string;
  http_host?: string;
  http_method?: string;
  http_path?: string;
  http_user_agent?: string;
  tls_sni?: string;
  // TCP connection tracking
  tcp_state?: string;
  tcp_flags?: string;
}

/**
 * Configuration options for the hook
 */
interface UseTrafficStreamOptions {
  url?: string;              // WebSocket URL (defaults to env var or localhost)
  onPacket?: (data: PacketData) => void;  // Callback when new packets arrive
  initialIpFilter?: string;
  initialProtocolFilter?: string;
}

/**
 * Alert data
 */
export interface AlertData {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  source_ip: string;
  description: string;
  timestamp: string;
  count: number;
}

/**
 * IP traffic stat
 */
export interface IPStats {
  ip: string;
  sent: number;
  recv: number;
  total: number;
}

/**
 * ARP entry
 */
export interface ARPEntry {
  ip: string;
  mac: string;
}

/**
 * Statistics computed from packets
 */
interface PacketStats {
  totalPackets: number;
  totalBytes: number;
  uniqueIPs: number;
  protocols: Record<string, number>;
  connections: {
    ESTABLISHED: number;
    CONNECTING: number;
    CLOSED: number;
  };
  alerts: AlertData[];
  alertCount: number;
  topTalkers: IPStats[];
  arpTable: ARPEntry[];
}

const DEFAULT_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/traffic";
const MAX_PACKETS = 100;
const BATCH_INTERVAL_MS = 100;
const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 5;
const STORAGE_KEY = "network_sniffer_auto_connect";

export function useTrafficStream({ 
  url = DEFAULT_URL, 
  onPacket,
  initialIpFilter = "",
  initialProtocolFilter = ""
}: UseTrafficStreamOptions = {}) {
   
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [packets, setPackets] = useState<PacketData[]>([]);
  const [stats, setStats] = useState<PacketStats>({
    totalPackets: 0,
    totalBytes: 0,
    uniqueIPs: 0,
    protocols: {},
    connections: {
      ESTABLISHED: 0,
      CONNECTING: 0,
      CLOSED: 0,
    },
    alerts: [],
    alertCount: 0,
    topTalkers: [],
    arpTable: [],
  });

  const [shouldConnect, setShouldConnect] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

  const [ipFilter, setIpFilter] = useState(initialIpFilter);
  const [protocolFilter, setProtocolFilter] = useState(initialProtocolFilter);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const packetBufferRef = useRef<PacketData[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onPacketRef = useRef(onPacket);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenIPsRef = useRef<Set<string>>(new Set());
  const ipFilterRef = useRef(ipFilter);
  const protocolFilterRef = useRef(protocolFilter);

  useEffect(() => {
    onPacketRef.current = onPacket;
  }, [onPacket]);

  useEffect(() => {
    ipFilterRef.current = ipFilter;
    protocolFilterRef.current = protocolFilter;
  }, [ipFilter, protocolFilter]);

  const disconnect = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.onopen = null;
      
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const stopSniffer = useCallback(() => {
    disconnect();
    setShouldConnect(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "false");
    }
  }, [disconnect]);

  const clearPackets = useCallback(() => {
    setPackets([]);
    setStats({
      totalPackets: 0,
      totalBytes: 0,
      uniqueIPs: 0,
      protocols: {},
      connections: {
        ESTABLISHED: 0,
        CONNECTING: 0,
        CLOSED: 0,
      },
      alerts: [],
      alertCount: 0,
      topTalkers: [],
      arpTable: [],
    });
    packetBufferRef.current = [];
    seenIPsRef.current = new Set();
  }, []);

  const setFilters = useCallback((newIpFilter: string, newProtocolFilter: string) => {
    setIpFilter(newIpFilter);
    setProtocolFilter(newProtocolFilter);
    ipFilterRef.current = newIpFilter;
    protocolFilterRef.current = newProtocolFilter;
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ip_filter: newIpFilter,
        protocol_filter: newProtocolFilter,
      }));
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionError(null);
    setIsConnecting(true);

    console.info("Connecting to WebSocket:", url);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      reconnectAttemptsRef.current = 0;
      console.info("WebSocket connected");

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        if (packetBufferRef.current.length === 0) return;

        const newPackets = [...packetBufferRef.current];
        packetBufferRef.current = [];

        setPackets((prev) => {
          const updated = [...prev, ...newPackets];
          if (updated.length > MAX_PACKETS) {
            return updated.slice(updated.length - MAX_PACKETS);
          }
          return updated;
        });

        setStats((prev) => {
          const newProtocols = { ...prev.protocols };
          const newSeenIPs = new Set(seenIPsRef.current);
          let newBytes = prev.totalBytes;
          
          // Track TCP connections by state
          const newConnections = { ...prev.connections };
          
          newPackets.forEach((p) => {
            newProtocols[p.proto] = (newProtocols[p.proto] || 0) + 1;
            newSeenIPs.add(p.src);
            newSeenIPs.add(p.dst);
            newBytes += p.length;
            
            // Update TCP connection counts
            if (p.proto === "TCP" && p.tcp_state) {
              const state = p.tcp_state;
              if (state === "ESTABLISHED") {
                newConnections.ESTABLISHED = (newConnections.ESTABLISHED || 0) + 1;
              } else if (state === "SYN_SENT" || state === "SYN_RCVD") {
                newConnections.CONNECTING = (newConnections.CONNECTING || 0) + 1;
              } else if (state === "CLOSED" || state === "CLOSE_WAIT" || state === "RESET" || state === "FIN_WAIT") {
                newConnections.CLOSED = (newConnections.CLOSED || 0) + 1;
              }
            }
            onPacketRef.current?.(p);
          });

          seenIPsRef.current = newSeenIPs;

          return {
            totalPackets: prev.totalPackets + newPackets.length,
            totalBytes: newBytes,
            uniqueIPs: newSeenIPs.size,
            protocols: newProtocols,
            connections: newConnections,
            alerts: prev.alerts,
            alertCount: prev.alertCount,
            topTalkers: prev.topTalkers,
            arpTable: prev.arpTable,
          };
        });
      }, BATCH_INTERVAL_MS);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (Array.isArray(data)) {
          packetBufferRef.current.push(...data);
        } else {
          packetBufferRef.current.push(data as PacketData);
        }
      } catch (e) {
        console.error("Failed to parse packet:", e);
      }
    };

    ws.onclose = () => {
      disconnect();
      
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        const delay = RECONNECT_DELAY_MS * reconnectAttemptsRef.current;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionError("Connection failed. Check backend is running.");
      setIsConnecting(false);
      disconnect();
    };
  }, [url, disconnect]);

  const startSniffer = useCallback(() => {
    console.info("startSniffer called, shouldConnect:", true);
    setShouldConnect(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    connect();
  }, [connect]);

  useEffect(() => {
    console.info("Effect running, shouldConnect:", shouldConnect, "isConnected:", isConnected);
    if (shouldConnect) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [connect, shouldConnect]);

  // Poll alerts from API
  useEffect(() => {
    if (!isConnected) return;
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    let polling = true;
    
    const pollAlerts = async () => {
      if (!polling) return;
      try {
        const res = await fetch(`${API_URL}/alerts`);
        const data = await res.json();
        if (data.alerts) {
          setStats(prev => ({
            ...prev,
            alerts: data.alerts,
            alertCount: data.count,
          }));
        }
      } catch (e) {
        console.error("Failed to fetch alerts:", e);
      }
    };
    
    pollAlerts();
    const interval = setInterval(pollAlerts, 3000);
    return () => {
      polling = false;
      clearInterval(interval);
    };
  }, [isConnected]);

  return {
    isConnected,
    isConnecting,
    packets,
    stats,
    connect: startSniffer,
    disconnect: stopSniffer,
    clearPackets,
    setFilters,
    ipFilter,
    protocolFilter,
    connectionError,
    savePCAP: async (filename: string = "capture.pcap") => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/pcap/save?filename=${encodeURIComponent(filename)}`, {
        method: "POST",
      });
      return res.json();
    },
    loadPCAP: async (filename: string) => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/pcap/load?filename=${encodeURIComponent(filename)}`, {
        method: "POST",
      });
      return res.json();
    },
    addPackets: (newPackets: PacketData[]) => {
      if (!newPackets.length) return;
      
      setPackets((prev) => {
        const updated = [...prev, ...newPackets];
        return updated.slice(-MAX_PACKETS);
      });
      
      setStats((prev) => {
        const newProtocols = { ...prev.protocols };
        const newSeenIPs = new Set(seenIPsRef.current);
        let newBytes = prev.totalBytes;
        
        // Track TCP connections by state
        const newConnections = { ...prev.connections };
        
        newPackets.forEach((p) => {
          newProtocols[p.proto] = (newProtocols[p.proto] || 0) + 1;
          newSeenIPs.add(p.src);
          newSeenIPs.add(p.dst);
          newBytes += p.length;
          
          // Update TCP connection counts
          if (p.proto === "TCP" && p.tcp_state) {
            const state = p.tcp_state;
            if (state === "ESTABLISHED") {
              newConnections.ESTABLISHED = (newConnections.ESTABLISHED || 0) + 1;
            } else if (state === "SYN_SENT" || state === "SYN_RCVD") {
              newConnections.CONNECTING = (newConnections.CONNECTING || 0) + 1;
            } else if (state === "CLOSED" || state === "CLOSE_WAIT" || state === "RESET" || state === "FIN_WAIT") {
              newConnections.CLOSED = (newConnections.CLOSED || 0) + 1;
            }
          }
        });
        
        seenIPsRef.current = newSeenIPs;
        
        return {
          totalPackets: prev.totalPackets + newPackets.length,
          totalBytes: newBytes,
          uniqueIPs: newSeenIPs.size,
          protocols: newProtocols,
          connections: newConnections,
          alerts: prev.alerts,
          alertCount: prev.alertCount,
          topTalkers: prev.topTalkers,
          arpTable: prev.arpTable,
        };
      });
    },
  };
}
