"""
Packet Model
Represents a captured network packet with metadata.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Dict


@dataclass
class Packet:
    """
    Represents a captured network packet.
    """
    
    timestamp: datetime
    src: str
    dst: str
    src_port: int
    dst_port: int
    proto: str
    length: int
    info: str
    
    # L7 (Application Layer) decoded data
    dns_domain: str = None
    http_host: str = None
    http_method: str = None
    http_path: str = None
    http_user_agent: str = None
    tls_sni: str = None
    
    # TCP connection tracking
    tcp_state: str = None  # ESTABLISHED, SYN_SENT, SYN_RCVD, FIN_WAIT, CLOSED, etc.
    tcp_flags: str = None  # Raw flags: SYN, ACK, FIN, RST, PSH, etc.
    
    def to_dict(self) -> Dict:
        """
        Convert packet to a dictionary (for JSON serialization).
        """
        return {
            "timestamp": self.timestamp.isoformat(),
            "src": self.src,
            "dst": self.dst,
            "src_port": self.src_port,
            "dst_port": self.dst_port,
            "proto": self.proto,
            "length": self.length,
            "info": self.info,
            "dns_domain": self.dns_domain,
            "http_host": self.http_host,
            "http_method": self.http_method,
            "http_path": self.http_path,
            "http_user_agent": self.http_user_agent,
            "tls_sni": self.tls_sni,
            "tcp_state": self.tcp_state,
            "tcp_flags": self.tcp_flags,
        }