/**
 * Protocol Wiki
 * =============
 * Educational explanations for networking concepts shown in tooltips.
 * 
 * These explanations are beginner-friendly and explain the "why" behind protocols,
 * not just the technical details.
 * 
 * Usage:
 *   import { PROTOCOL_WIKI, getProtocolInfo } from '@/lib/protocol-wiki';
 *   getProtocolInfo('TCP') // Returns explanation of TCP
 */

export interface ProtocolInfo {
  name: string;
  shortDescription: string;
  layer: string;
  howItWorks: string;
  learnMore: string[];
  handshake?: string[];
  keyTerms: Record<string, string>;
}

export const PROTOCOL_WIKI: Record<string, ProtocolInfo> = {
  // TRANSPORT LAYER (L4)
  TCP: {
    name: 'TCP',
    shortDescription: 'Transmission Control Protocol',
    layer: 'Transport (L4)',
    howItWorks: `TCP ensures reliable, ordered delivery of data. It breaks files into packets, 
numbers them, waits for acknowledgment, and resends lost packets. This is why web pages load completely 
even on bad connections.`,
    learnMore: [
      'Three-way handshake establishes connection',
      'Packets are numbered and acknowledged',
      'Lost packets are automatically resent',
      'Connection closes gracefully',
    ],
    handshake: [
      'SYN: "Hello, want to talk?"',
      'SYN-ACK: "Hello! OK, let\'s talk."',
      'ACK: "Great! Let\'s start."',
    ],
    keyTerms: {
      'SYN': 'Synchronize - starting a connection',
      'ACK': 'Acknowledgment - confirming receipt',
      'FIN': 'Finish - closing a connection',
      'RST': 'Reset - abrupt connection drop',
    },
  },
  
  UDP: {
    name: 'UDP',
    shortDescription: 'User Datagram Protocol',
    layer: 'Transport (L4)',
    howItWorks: `UDP is faster but unreliable. It sends packets without waiting for 
acknowledgment or resending lost packets. Used for streaming, gaming, and DNS where speed 
matters more than perfect delivery.`,
    learnMore: [
      'No connection setup needed',
      'Packets may be lost or arrive out of order',
      'No acknowledgment system',
      'Perfect for real-time streaming',
    ],
    keyTerms: {
      'Datagram': 'A single UDP packet',
      '端口': 'Like a door on a computer for specific services',
    },
  },

  // APPLICATION LAYER (L7)
  DNS: {
    name: 'DNS',
    shortDescription: 'Domain Name System',
    layer: 'Application (L7)',
    howItWorks: `DNS is the "phonebook of the internet." When you type "google.com", DNS servers 
translate that to an IP address (like 142.250.185.78). Your computer asks a DNS server: 
"What's google.com's address?" and gets the answer.`,
    learnMore: [
      'Your computer caches DNS responses for speed',
      'Multiple DNS servers exist worldwide for redundancy',
      'DNS over HTTPS (DoH) encrypts lookups for privacy',
      'Subdomains like "mail.google.com" are also resolved',
    ],
    keyTerms: {
      'Query': 'A request to translate a domain name',
      'Response': 'The IP address returned by DNS',
      'TTL': 'Time To Live - how long to cache the response',
      'A Record': 'Maps domain to IPv4 address',
      'AAAA Record': 'Maps domain to IPv6 address',
    },
  },
  
  HTTP: {
    name: 'HTTP',
    shortDescription: 'HyperText Transfer Protocol',
    layer: 'Application (L7)',
    howItWorks: `HTTP is how web browsers and servers talk. The browser sends a "GET" request 
for a page, the server responds with the HTML. Without encryption (HTTPS), this traffic 
can be read by anyone on the network.`,
    learnMore: [
      'GET requests data from the server',
      'POST sends data to the server',
      'Headers contain metadata (User-Agent, cookies)',
      'HTTP/2 multiplexes multiple requests over one connection',
    ],
    keyTerms: {
      'GET': 'Request to read data',
      'POST': 'Request to send data',
      'Header': 'Metadata about the request/response',
      'Status Code': '200=OK, 404=NotFound, 500=ServerError',
    },
  },
  
  TLS: {
    name: 'TLS',
    shortDescription: 'Transport Layer Security',
    layer: 'Application (L7)',
    howItWorks: `TLS encrypts your web traffic so no one (not even your ISP) can see what 
you're browsing. Even though they can't read the content, they CAN see which website 
you're visiting through SNI (Server Name Indication).`,
    learnMore: [
      'TLS 1.2: Standard encryption (being phased out)',
      'TLS 1.3: Faster, more secure (recommended)',
      'SNI: Server Name Indication - reveals website even with encryption',
      'Certificate verifies the server\'s identity',
    ],
    keyTerms: {
      'SNI': 'Server Name Indication - which website you\'re visiting',
      'Certificate': 'Digital ID proving the server is legitimate',
      'Handshake': 'Initial negotiation between client and server',
      'Cipher Suite': 'Encryption algorithms being used',
    },
  },
  
  ARP: {
    name: 'ARP',
    shortDescription: 'Address Resolution Protocol',
    layer: 'Data Link (L2)',
    howItWorks: `ARP translates IP addresses to MAC addresses (your network card's unique ID). 
When your computer wants to send data to another computer on your network, it broadcasts:
"Who has IP 192.168.1.1? Tell 192.168.1.100" and the owner responds with their MAC.`,
    learnMore: [
      'Only works on local networks (LAN)',
      'Computers cache ARP responses',
      'ARP spoofing is a security attack vector',
      'No authentication - anyone can respond',
    ],
    keyTerms: {
      'MAC': 'Media Access Control - your network card\'s unique ID',
      'ARP Table': 'Cached IP-to-MAC translations',
      'Broadcast': 'Sending to everyone on the network',
    },
  },
  
  ICMP: {
    name: 'ICMP',
    shortDescription: 'Internet Control Message Protocol',
    layer: 'Network (L3)',
    howItWorks: `ICMP is used for diagnostics - the famous "ping" command uses ICMP to 
test if a computer is reachable. It sends an "Echo Request" and expects an "Echo Reply". 
Network routers also use ICMP to report errors like "destination unreachable."`,
    learnMore: [
      'Ping tests if a host is reachable',
      'Traceroute reveals the path packets take',
      'Type 0 = Echo Reply, Type 8 = Echo Request',
      'Many firewalls block ICMP for security',
    ],
    keyTerms: {
      'Echo Request': 'A ping - "Are you there?"',
      'Echo Reply': 'Pong - "Yes, I\'m here!"',
      'TTL': 'Time To Live - prevents infinite loops',
      'Type/Code': 'ICMP message type and subtype',
    },
  },
  
  DHCP: {
    name: 'DHCP',
    shortDescription: 'Dynamic Host Configuration Protocol',
    layer: 'Application (L7)',
    howItWorks: `When you connect to WiFi, DHCP automatically assigns your computer an IP address. 
Without DHCP, you'd need to manually configure every device. The process: DISCOVER → 
OFFER → REQUEST → ACKNOWLEDGE (DORA).`,
    learnMore: [
      'Uses UDP ports 67 (server) and 68 (client)',
      'Addresses are "leased" and must be renewed',
      'Private addresses typically: 192.168.x.x, 10.x.x.x',
      'IPv6 uses SLAAC instead of DHCP',
    ],
    keyTerms: {
      'Lease': 'Time period before IP must be renewed',
      'Scope': 'Range of IPs available to assign',
      'Reservation': 'Permanent IP for a specific device',
      'DORA': 'The 4-step process: Discover, Offer, Request, Acknowledge',
    },
  },
  
  FTP: {
    name: 'FTP',
    shortDescription: 'File Transfer Protocol',
    layer: 'Application (L7)',
    howItWorks: `FTP transfers files between computers. It uses two connections: one for commands 
(control) and another for data transfer. Unlike modern protocols, FTP sends everything 
(including passwords!) in plain text unless explicitly secured with TLS.`,
    learnMore: [
      'PORT command opens a data connection',
      'PASV tells server to open a data connection',
      'ASCII for text files, BINARY for images/programs',
      'SFTP (SSH FTP) is the secure version',
    ],
    keyTerms: {
      'ASCII': 'Text file format',
      'BINARY': 'Image/program format',
      'PORT': 'Client opens a port for data transfer',
      'PASV': 'Server opens a port for data transfer',
    },
  },
};

/**
 * Get protocol information
 */
export function getProtocolInfo(protocol: string): ProtocolInfo | undefined {
  return PROTOCOL_WIKI[protocol.toUpperCase()];
}

/**
 * Get OSI layer color (for visual coding)
 */
export function getLayerColor(layer: string): string {
  if (layer.includes('L7') || layer.includes('Application')) return '#69f6b8'; // Emerald
  if (layer.includes('L4') || layer.includes('Transport')) return '#60a5fa'; // Blue
  if (layer.includes('L3') || layer.includes('Network')) return '#fbbf24'; // Amber
  if (layer.includes('L2') || layer.includes('Data')) return '#a78bfa'; // Purple
  return '#9ca3af'; // Gray
}
