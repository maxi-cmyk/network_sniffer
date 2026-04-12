/**
 * Port Dictionary
 * ==============
 * Maps port numbers to service/protocol names with educational descriptions.
 * Data loaded from ports.json for better maintainability.
 * 
 * Usage:
 *   import { PORT_DICTIONARY, getPortInfo } from '@/lib/port-dictionary';
 *   getPortInfo(80) // { name: 'HTTP', description: '...' }
 */

import portsData from './ports.json';

export interface PortInfo {
  name: string;
  protocol: string;
  description: string;
  layer: string;
  wiki?: string;
}

type PortsData = Record<number, PortInfo>;

export const PORT_DICTIONARY: PortsData = portsData as PortsData;

export function getPortInfo(port: number): PortInfo {
  if (port > 0 && port < 1024) {
    return PORT_DICTIONARY[port] || {
      name: `Port ${port}`,
      protocol: 'Unknown',
      description: `${port} is a well-known system port (0-1023)`,
      layer: 'Unknown',
    };
  }
  
  if (port >= 1024 && port < 49152) {
    return PORT_DICTIONARY[port] || {
      name: `Port ${port}`,
      protocol: 'Unknown',
      description: `${port} is a registered port (1024-49151)`,
      layer: 'Application (L7)',
    };
  }
  
  return {
    name: `Port ${port} (Ephemeral)`,
    protocol: 'Dynamic',
    description: `${port} is a dynamic/ephemeral port (49152-65535) - typically assigned to outgoing connections`,
    layer: 'OS Assignment',
  };
}

export function getPortColor(port: number): string {
  if ([80, 443, 8080, 8443].includes(port)) return '#69f6b8';
  if (port === 53) return '#60a5fa';
  if ([25, 110, 143, 465, 587].includes(port)) return '#fbbf24';
  if (port === 22) return '#f87171';
  if ([3306, 5432, 27017, 6379].includes(port)) return '#a78bfa';
  return '#9ca3af';
}