"""
Packet Handler
Processes raw Scapy packets into Packet objects.
"""

from __future__ import annotations
import logging
from datetime import datetime
from typing import Optional

from scapy.all import IP, TCP, UDP, ICMP, ARP

from app.models.packet import Packet
from app.services.decoder import DecoderService

logger = logging.getLogger(__name__)


class PacketHandler:
    """Processes captured network packets into specialized Packet model."""
    
    def __init__(self, max_decode_bytes: int = 1024):
        """Initialize packet handler with decoder."""
        self._raw_packets = []
        self._decoder = DecoderService(max_bytes=max_decode_bytes)
    
    @property
    def raw_packets(self) -> list:
        """Get list of raw packets for PCAP export."""
        return self._raw_packets
    
    def process(self, pkt, ip_filter: str = "", protocol_filter: str = "") -> Optional[Packet]:
        """Process a single packet and apply filters."""
        timestamp = datetime.now()
        src, dst = "", ""
        src_port, dst_port = 0, 0
        proto, length, info = "", 0, ""
        
        # L7 decoded data
        dns_domain = None
        http_host = None
        http_method = None
        http_path = None
        http_user_agent = None
        tls_sni = None
        
        # Process IP layers
        if IP in pkt:
            src = pkt[IP].src
            dst = pkt[IP].dst
            length = len(pkt)
            
            if TCP in pkt:
                proto = "TCP"
                src_port = pkt[TCP].sport
                dst_port = pkt[TCP].dport
                info = f"{src_port} -> {dst_port}"
                
            elif UDP in pkt:
                proto = "UDP"
                src_port = pkt[UDP].sport
                dst_port = pkt[UDP].dport
                info = f"{src_port} -> {dst_port}"
                
            elif ICMP in pkt:
                proto = "ICMP"
                info = f"Type: {pkt[ICMP].type}"
                
            else:
                proto = "IP"
                
        # Process ARP
        elif ARP in pkt:
            proto = "ARP"
            src = pkt[ARP].psrc
            dst = pkt[ARP].pdst
            info = "ARP Request/Reply"
            length = len(pkt)
        
        # Apply IP filter
        if ip_filter and src != ip_filter and dst != ip_filter:
            return None
        
        # Apply protocol filter
        if protocol_filter and proto.lower() != protocol_filter:
            return None
        
        # Decode L7 data (Application Layer)
        decoded = self._decoder.decode(pkt)
        
        if decoded:
            dns_domain = decoded.get('dns')
            http_data = decoded.get('http')
            if http_data:
                http_host = http_data.get('host')
                http_method = http_data.get('method')
                http_path = http_data.get('path')
                http_user_agent = http_data.get('user_agent')
            tls_sni = decoded.get('tls')
        
        # Only return if valid source and destination
        if src and dst:
            # Store raw packet for PCAP export
            self._raw_packets.append(pkt)
            
            return Packet(
                timestamp, src, dst, src_port, dst_port, proto, length, info,
                dns_domain=dns_domain,
                http_host=http_host,
                http_method=http_method,
                http_path=http_path,
                http_user_agent=http_user_agent,
                tls_sni=tls_sni,
            )
        
        return None
    
    def clear_raw(self):
        """Clear stored raw packets."""
        self._raw_packets = []