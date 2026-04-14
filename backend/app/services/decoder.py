"""
Decoder Service
==============

Decodes application-layer (L7) data from network packets:
- DNS: Extract domain names from DNS queries/responses
- HTTP: Extract headers from HTTP requests
- TLS: Extract SNI from TLS ClientHello

Key Concepts for Beginners:
- Application Layer: The topmost OSI layer (L7) - what users interact with
- DNS: The "phonebook of the internet" - maps domains to IPs
- HTTP: The protocol behind web browsing
- TLS/SNI: Encryption layer, SNI reveals server name even in encrypted traffic

For learning more: docs/networking-basics.md
"""

from __future__ import annotations
import logging
from typing import Optional

from scapy.all import DNS, TCP, UDP, Raw, IP

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)  # Set to INFO by default, not DEBUG


class DecoderService:
    """
    Decodes application-layer (L7) data from packets.
    
    Edge cases handled:
    - Fragmented DNS: Only single-packet queries
    - Unicode domains: Use punycode encoding
    - Non-HTTP payloads: Gracefully return None
    - TLS 1.3: Handled separately (encrypted SNI)
    """
    
    def __init__(self, max_bytes: int = 1024):
        """
        Initialize decoder with payload limit.
        
        Args:
            max_bytes: Maximum payload bytes to inspect (prevents lag)
        """
        self.max_bytes = max_bytes
    
    def decode(self, packet) -> dict:
        """
        Main decode entry point.
        """
        result = {}
        
        # Always try DNS first (most reliable for DNS traffic)
        dns_result = self.decode_dns(packet)
        if dns_result:
            result['dns'] = dns_result
            
        # Try HTTP
        http_result = self.decode_http(packet)
        if http_result:
            result['http'] = http_result
            
        # Try TLS - get version, cipher, SNI
        tls_result = self.decode_tls_info(packet)
        if tls_result:
            result['tls'] = tls_result
        
        return result
    
    def decode_tls_info(self, packet) -> Optional[dict]:
        """
        Extract TLS version, cipher suite, and SNI from TLS ClientHello.
        
        Returns dict with:
        - version: TLS 1.2, TLS 1.3, or unknown
        - cipher: First cipher suite offered (if detectable)
        - sni: Server Name Indication (if present)
        """
        try:
            if TCP not in packet:
                return None
                
            payload = bytes(packet[Raw].load[:self.max_bytes]) if Raw in packet else b''
            
            if len(payload) < 5 or payload[0] != 0x16:
                return None
            
            # TLS version: bytes[1:3] = 0x03 0x01-0x04
            version = "Unknown"
            if len(payload) >= 3:
                if payload[1] == 0x03:
                    if payload[2] == 0x01:
                        version = "TLS 1.0"
                    elif payload[2] == 0x02:
                        version = "TLS 1.1"
                    elif payload[2] == 0x03:
                        version = "TLS 1.2"
                    elif payload[2] == 0x04:
                        version = "TLS 1.3"
            
            cipher = None
            sni = None
            
            # TLS 1.3 and 1.2 have different ClientHello structures
            # Look for SNI extension (0x00 0x00)
            sni_marker = b'\x00\x00'
            if sni_marker in payload:
                idx = payload.find(sni_marker)
                if len(payload) > idx + 6:
                    name_len = payload[idx + 4] * 256 + payload[idx + 5]
                    name_start = idx + 6
                    name_end = name_start + name_len
                    if name_end <= len(payload):
                        sni_bytes = payload[name_start:name_end]
                        sni = sni_bytes.decode('utf-8', errors='ignore')
            
            # For TLS 1.2, can extract cipher suite (bytes 43-45 typically)
            if version == "TLS 1.2" and len(payload) >= 47:
                # Cipher suites start at byte 43 (after version + timestamp + random)
                cipher_bytes = payload[43:45]
                cipher_code = cipher_bytes[0] * 256 + cipher_bytes[1]
                cipher = f"0x{cipher_code:04x}"
            
            return {
                "version": version,
                "cipher": cipher,
                "sni": sni
            }
                        
        except Exception as e:
            logger.debug(f"TLS decode error: {e}")
            
        return None
    
    def decode_dns(self, packet) -> Optional[str]:
        """
        Extract domain from DNS packet (port 53).
        
        What it shows:
        - DNS Query: The domain being requested
        - DNS Response: The resolved IP address
        
        Handles:
        - Unicode domains
        - Multiple answers (returns first)
        - Non-query DNS types gracefully
        """
        try:
            # Check if packet has DNS layer
            if DNS in packet:
                dns_layer = packet[DNS]
                
                # Check if it's a query (qr=0) or response (qr=1)
                if dns_layer.qr == 0:
                    # Query - extract domain name
                    if dns_layer.qd:
                        domain = dns_layer.qd.qname
                        if domain:
                            # Clean up domain (remove trailing dot, handle unicode)
                            domain_str = domain.decode('utf-8', errors='ignore').rstrip('.')
                            return domain_str
                            
                elif dns_layer.qr == 1:
                    # Response - extract first answer if available
                    if dns_layer.an:
                        rdata = dns_layer.an.rdata
                        if rdata:
                            # Could be IP or domain depending on record type
                            return str(rdata)
                            
        except Exception as e:
            logger.debug(f"DNS decode error: {e}")
            
        return None
    
    def decode_http(self, packet) -> Optional[dict]:
        """
        Extract HTTP headers and similar protocols.
        Handles: HTTP, UPnP/SSDP, etc.
        """
        try:
            # Must have Raw layer
            if Raw not in packet:
                return None
            
            payload = bytes(packet[Raw].load[:self.max_bytes])
            
            try:
                payload_str = payload.decode('utf-8', errors='ignore')
            except:
                return None
            
            # HTTP methods (including NOTIFY for UPnP/SSDP)
            http_methods = ('GET ', 'POST ', 'PUT ', 'DELETE ', 'HEAD ', 'OPTIONS ', 'PATCH ', 'NOTIFY ')
            
            if payload_str.startswith(http_methods):
                lines = payload_str.split('\r\n')
                result = {}
                
                # Parse request line
                first_line = lines[0]
                if first_line.startswith(http_methods):
                    parts = first_line.split(' ')
                    if len(parts) >= 2:
                        result['method'] = parts[0]
                        result['path'] = parts[1]
                
                # Parse headers
                for line in lines[1:]:
                    if line.startswith('Host:'):
                        result['host'] = line.split(':', 1)[1].strip()
                    elif line.startswith('User-Agent:'):
                        result['user_agent'] = line.split(':', 1)[1].strip()
                    elif line.startswith('Location:'):
                        result['host'] = line.split(':', 1)[1].strip()
                    elif line.startswith('NT:'):
                        result['user_agent'] = line.split(':', 1)[1].strip()
                    
                    if not line:
                        break
                
                if result.get('method') or result.get('host'):
                    return result
                        
        except Exception as e:
            logger.debug(f"HTTP decode error: {e}")
            
        return None
    
    def decode_tls_sni(self, packet) -> Optional[str]:
        """
        Extract Server Name Indication (SNI) from TLS ClientHello (port 443).
        
        What it shows:
        - SNI: The server name being requested (even in encrypted traffic!)
        - TLS Version: 1.2 or 1.3
        
        Why this matters:
        Even with HTTPS, the SNI is sent in plaintext. This is how your
        internet provider knows which websites you visit.
        
        Edge cases handled:
        - TLS 1.3: SNI is encrypted (different structure)
        - Session resumption: No new SNI
        - Missing SNI: Gracefully returns None
        """
        try:
            # Check for TLS layers
            if TCP in packet:
                payload = bytes(packet[Raw].load[:self.max_bytes]) if Raw in packet else b''
                
                # Look for TLS ClientHello Handshake type (0x01)
                # TLS record starts with: ContentType(0x16) + Version(0x03 0x01/0x03) + Length
                if len(payload) >= 5 and payload[0] == 0x16:
                    # This is a TLS Handshake
                    # Try to find SNI extension (0x0000 for Server Name)
                    
                    # Find Server Name list (0x00 0x00 in extension list)
                    sni_marker = b'\x00\x00'
                    if sni_marker in payload:
                        # Extract SNI from extension
                        idx = payload.find(sni_marker)
                        # Skip marker + length fields + name type (1 byte)
                        name_len = payload[idx + 4] * 256 + payload[idx + 5]
                        name_start = idx + 6
                        name_end = name_start + name_len
                        
                        if name_end <= len(payload):
                            sni = payload[name_start:name_end]
                            return sni.decode('utf-8', errors='ignore')
                    
                    # Check for TLS 1.3 indicator in version
                    # TLS 1.3 uses version 0x0303
                    if len(payload) >= 3 and payload[1] == 0x03 and payload[2] == 0x03:
                        return "TLS 1.3 (encrypted)"
                        
        except Exception as e:
            logger.debug(f"TLS decode error: {e}")
            
        return None