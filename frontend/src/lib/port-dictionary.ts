/**
 * Port Dictionary
 * ==============
 * Maps port numbers to service/protocol names with educational descriptions.
 * 
 * Port references:
 * - IANA Port Numbers: https://www.iana.org/assignments/service-names-port-numbers/
 * - Common ports are well-documented, dynamic ports (49152+) are typically ephemeral
 * 
 * Usage:
 *   import { PORT_DICTIONARY, getPortInfo } from '@/lib/port-dictionary';
 *   getPortInfo(80) // { name: 'HTTP', description: '...' }
 */

export interface PortInfo {
  name: string;
  protocol: string;
  description: string;
  layer: string;
  wiki?: string;
}

export const PORT_DICTIONARY: Record<number, PortInfo> = {
  // =========================================================================
  // WEB & BROWSING
  // =========================================================================
  80: {
    name: 'HTTP',
    protocol: 'TCP',
    description: 'HyperText Transfer Protocol - unencrypted web traffic',
    layer: 'Application (L7)',
    wiki: 'http',
  },
  443: {
    name: 'HTTPS',
    protocol: 'TCP',
    description: 'HTTP Secure - encrypted web traffic using TLS/SSL',
    layer: 'Application (L7)',
    wiki: 'tls',
  },
  8080: {
    name: 'HTTP Alt',
    protocol: 'TCP',
    description: 'Alternative HTTP - commonly used for web proxies or dev servers',
    layer: 'Application (L7)',
    wiki: 'http',
  },
  8443: {
    name: 'HTTPS Alt',
    protocol: 'TCP',
    description: 'Alternative HTTPS - commonly used for dev servers',
    layer: 'Application (L7)',
    wiki: 'tls',
  },

  // =========================================================================
  // NAME RESOLUTION (DNS)
  // =========================================================================
  53: {
    name: 'DNS',
    protocol: 'UDP/TCP',
    description: 'Domain Name System - the "phonebook of the internet"',
    layer: 'Application (L7)',
    wiki: 'dns',
  },

  // =========================================================================
  // EMAIL
  // =========================================================================
  25: {
    name: 'SMTP',
    protocol: 'TCP',
    description: 'Simple Mail Transfer Protocol - sending email',
    layer: 'Application (L7)',
    wiki: 'smtp',
  },
  110: {
    name: 'POP3',
    protocol: 'TCP',
    description: 'Post Office Protocol v3 - receiving email',
    layer: 'Application (L7)',
  },
  143: {
    name: 'IMAP',
    protocol: 'TCP',
    description: 'Internet Message Access Protocol - accessing email',
    layer: 'Application (L7)',
  },
  465: {
    name: 'SMTPS',
    protocol: 'TCP',
    description: 'SMTP over SSL - secure email sending',
    layer: 'Application (L7)',
  },
  587: {
    name: 'SMTP MST',
    protocol: 'TCP',
    description: 'SMTP Mail Submission - email sending submission',
    layer: 'Application (L7)',
  },

  // =========================================================================
  // FILE TRANSFER
  // =========================================================================
  20: {
    name: 'FTP Data',
    protocol: 'TCP',
    description: 'File Transfer Protocol (data) - file transfers',
    layer: 'Application (L7)',
    wiki: 'ftp',
  },
  21: {
    name: 'FTP',
    protocol: 'TCP',
    description: 'File Transfer Protocol (control) - file transfers',
    layer: 'Application (L7)',
    wiki: 'ftp',
  },
  22: {
    name: 'SSH/SFTP',
    protocol: 'TCP',
    description: 'Secure Shell - encrypted remote access and file transfer',
    layer: 'Application (L7)',
    wiki: 'ssh',
  },
  69: {
    name: 'TFTP',
    protocol: 'UDP',
    description: 'Trivial FTP - simple file transfer without authentication',
    layer: 'Application (L7)',
  },

  // =========================================================================
  // NETWORKING & MANAGEMENT
  // =========================================================================
  23: {
    name: 'TELNET',
    protocol: 'TCP',
    description: 'TELNET (DEPRECATED) - unencrypted remote access. Use SSH instead!',
    layer: 'Application (L7)',
    wiki: 'telnet',
  },

  // =========================================================================
  // DHCP & AUTO-CONFIG
  // =========================================================================
  67: {
    name: 'DHCP Server',
    protocol: 'UDP',
    description: 'Dynamic Host Configuration Protocol - assigning IP addresses',
    layer: 'Application (L7)',
    wiki: 'dhcp',
  },
  68: {
    name: 'DHCP Client',
    protocol: 'UDP',
    description: 'DHCP Client - receiving IP configuration',
    layer: 'Application (L7)',
    wiki: 'dhcp',
  },

  // =========================================================================
  // DATABASE (COMMON)
  // =========================================================================
  3306: {
    name: 'MySQL',
    protocol: 'TCP',
    description: 'MySQL Database - popular open-source database',
    layer: 'Application (L7)',
  },
  5432: {
    name: 'PostgreSQL',
    protocol: 'TCP',
    description: 'PostgreSQL Database - advanced open-source database',
    layer: 'Application (L7)',
  },
  27017: {
    name: 'MongoDB',
    protocol: 'TCP',
    description: 'MongoDB - popular NoSQL document database',
    layer: 'Application (L7)',
  },
  6379: {
    name: 'Redis',
    protocol: 'TCP',
    description: 'Redis - in-memory data store (caching, queues)',
    layer: 'Application (L7)',
  },

  // =========================================================================
  // MESSAGING & COLLABORATION
  // =========================================================================
  5222: {
    name: 'XMPP',
    protocol: 'TCP',
    description: 'Extensible Messaging and Presence Protocol (Jabber) - chat/messaging',
    layer: 'Application (L7)',
  },
  1883: {
    name: 'MQTT',
    protocol: 'TCP',
    description: 'Message Queuing Telemetry Transport - IoT messaging',
    layer: 'Application (L7)',
  },

  // =========================================================================
  // KERBEROS & AUTHENTICATION
  // =========================================================================
  88: {
    name: 'Kerberos',
    protocol: 'UDP/TCP',
    description: 'Kerberos authentication - network authentication protocol',
    layer: 'Application (L7)',
  },
  389: {
    name: 'LDAP',
    protocol: 'TCP',
    description: 'Lightweight Directory Access Protocol - directory services',
    layer: 'Application (L7)',
  },
  636: {
    name: 'LDAPS',
    protocol: 'TCP',
    description: 'LDAP over SSL - secure directory services',
    layer: 'Application (L7)',
  },

  // =========================================================================
  // NETWORK SERVICES
  // =========================================================================
  123: {
    name: 'NTP',
    protocol: 'UDP',
    description: 'Network Time Protocol - synchronizing system clocks',
    layer: 'Application (L7)',
    wiki: 'ntp',
  },
  161: {
    name: 'SNMP',
    protocol: 'UDP',
    description: 'Simple Network Management Protocol - network monitoring',
    layer: 'Application (L7)',
  },
  162: {
    name: 'SNMP Trap',
    protocol: 'UDP',
    description: 'SNMP Traps - network event notifications',
    layer: 'Application (L7)',
  },
};

/**
 * Get port information with fallback for unknown ports
 * 
 * @param port - The port number
 * @returns PortInfo object with educational description
 */
export function getPortInfo(port: number): PortInfo {
  // Check if port is in well-known range
  if (port > 0 && port < 1024) {
    return PORT_DICTIONARY[port] || {
      name: `Port ${port}`,
      protocol: 'Unknown',
      description: `${port} is a well-known system port (0-1023)`,
      layer: 'Unknown',
    };
  }
  
  // Registered ports (1024-49151)
  if (port >= 1024 && port < 49152) {
    return PORT_DICTIONARY[port] || {
      name: `Port ${port}`,
      protocol: 'Unknown',
      description: `${port} is a registered port (1024-49151)`,
      layer: 'Application (L7)',
    };
  }
  
  // Dynamic/private ports (49152-65535)
  return {
    name: `Port ${port} (Ephemeral)`,
    protocol: 'Dynamic',
    description: `${port} is a dynamic/ephemeral port (49152-65535) - typically assigned to outgoing connections`,
    layer: 'OS Assignment',
  };
}

/**
 * Get color coding for port type
 */
export function getPortColor(port: number): string {
  const info = getPortInfo(port);
  
  // Web ports
  if ([80, 443, 8080, 8443].includes(port)) return '#69f6b8'; // Emerald
  // DNS
  if (port === 53) return '#60a5fa'; // Blue
  // Email
  if ([25, 110, 143, 465, 587].includes(port)) return '#fbbf24'; // Amber
  // SSH
  if (port === 22) return '#f87171'; // Red
  // Database
  if ([3306, 5432, 27017, 6379].includes(port)) return '#a78bfa'; // Purple
  
  return '#9ca3af'; // Gray
}