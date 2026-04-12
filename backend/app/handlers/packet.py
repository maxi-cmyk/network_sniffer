"""
Packet Handler
Processes raw Scapy packets into Packet objects.
"""

from __future__ import annotations
import logging
from datetime import datetime
from typing import Dict, Optional, TYPE_CHECKING

from scapy.all import IP, TCP, UDP, ICMP, ARP

from app.models.packet import Packet
from app.services.decoder import DecoderService

if TYPE_CHECKING:
    from app.services.alerts import AlertService

logger = logging.getLogger(__name__)


class PacketHandler:
    """Processes captured network packets into specialized Packet model."""
    
    MAX_IP_STATS = 100
    MAX_ARP_DEVICES = 100
    
    def __init__(self, max_decode_bytes: int = 1024, alert_service: "AlertService" = None):
        """Initialize packet handler with decoder."""
        self._raw_packets = []
        self._decoder = DecoderService(max_bytes=max_decode_bytes)
        self._alert_service = alert_service
        # IP traffic stats (bytes per IP)
        self._ip_stats: Dict[str, Dict[str, int]] = {}  # IP -> {sent: bytes, recv: bytes}
        # ARP table (IP -> MAC)
        self._arp_table: Dict[str, str] = {}
    
    def set_alert_service(self, alert_service: "AlertService"):
        """Set the alert service for intrusion detection."""
        self._alert_service = alert_service
        logger.info("Alert service attached to packet handler")
    
    @property
    def raw_packets(self) -> list:
        """Get list of raw packets for PCAP export."""
        return self._raw_packets
    
    def _extract_tcp_flags(self, tcp_layer) -> str:
        """Extract TCP flags as string."""
        flags = []
        if tcp_layer.flags.F: flags.append("FIN")
        if tcp_layer.flags.S: flags.append("SYN")
        if tcp_layer.flags.R: flags.append("RST")
        if tcp_layer.flags.P: flags.append("PSH")
        if tcp_layer.flags.A: flags.append("ACK")
        if tcp_layer.flags.U: flags.append("URG")
        return ",".join(flags) if flags else "NONE"
    
    def _get_tcp_state(self, flags_str: str) -> str:
        """Determine TCP connection state from flags."""
        if "SYN" in flags_str and "ACK" in flags_str:
            return "SYN_RCVD"
        elif "SYN" in flags_str:
            return "SYN_SENT"
        elif "FIN" in flags_str and "ACK" in flags_str:
            return "FIN_WAIT"
        elif "FIN" in flags_str:
            return "CLOSE_WAIT"
        elif "RST" in flags_str:
            return "RESET"
        elif "ACK" in flags_str:
            return "ESTABLISHED"
        return "UNKNOWN"
    
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
        
        # TCP state tracking
        tcp_state = None
        tcp_flags = None
        
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
                
                # Extract TCP flags and state
                tcp_flags = self._extract_tcp_flags(pkt[TCP])
                tcp_state = self._get_tcp_state(tcp_flags)
                
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
            
            # Track ARP table (IP -> MAC)
            mac = pkt[ARP].hwsrc
            if src and mac:
                self._arp_table[src] = mac
                self._cleanup_arp()
        
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
        
        # Track IP traffic stats
        if src and dst and length:
            self._update_ip_stats(src, dst, length)
        
        # Check for alerts using AlertService
        if self._alert_service and src:
            # Get L7 data for protocol anomaly detection
            l7_data = {}
            if decoded:
                l7_data = decoded
            
            # Process packet through alert service
            self._alert_service.process_packet(
                ip=src,
                protocol=proto,
                src_port=src_port,
                dst_port=dst_port,
                tcp_state=tcp_state,
                tcp_flags=tcp_flags,
                bytes_transferred=length,
                l7_data=l7_data
            )
        
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
                tcp_state=tcp_state,
                tcp_flags=tcp_flags,
            )
        
        return None
    
    def clear_raw(self):
        """Clear stored raw packets."""
        self._raw_packets = []
    
    def get_ip_stats(self, max_count: int = 10) -> list:
        """Get top talkers by traffic (bytes)."""
        stats = []
        for ip, data in self._ip_stats.items():
            total = data.get('sent', 0) + data.get('recv', 0)
            stats.append({
                'ip': ip,
                'sent': data.get('sent', 0),
                'recv': data.get('recv', 0),
                'total': total,
            })
        
        # Sort by total and return top N
        stats.sort(key=lambda x: x['total'], reverse=True)
        return stats[:max_count]
    
    def get_arp_table(self) -> list:
        """Get ARP table as list."""
        return [
            {'ip': ip, 'mac': mac}
            for ip, mac in self._arp_table.items()
        ]
    
    def _update_ip_stats(self, src: str, dst: str, length: int):
        """Update IP traffic stats."""
        # Track source IP (sent)
        if src not in self._ip_stats:
            self._ip_stats[src] = {'sent': 0, 'recv': 0}
        self._ip_stats[src]['sent'] = self._ip_stats[src].get('sent', 0) + length
        
        # Track destination IP (received)
        if dst not in self._ip_stats:
            self._ip_stats[dst] = {'sent': 0, 'recv': 0}
        self._ip_stats[dst]['recv'] = self._ip_stats[dst].get('recv', 0) + length
        
        # Cleanup if over limit
        if len(self._ip_stats) > self.MAX_IP_STATS:
            # Remove IPs with least traffic
            sorted_ips = sorted(
                self._ip_stats.items(),
                key=lambda x: x[1].get('sent', 0) + x[1].get('recv', 0)
            )
            for ip, _ in sorted_ips[:len(self._ip_stats) - self.MAX_IP_STATS]:
                del self._ip_stats[ip]
    
    def _cleanup_arp(self):
        """Cleanup ARP table if over limit."""
        if len(self._arp_table) > self.MAX_ARP_DEVICES:
            # Remove oldest (keep first N)
            items = list(self._arp_table.items())[-self.MAX_ARP_DEVICES:]
            self._arp_table = dict(items)