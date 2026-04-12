"""
PCAP Service
===========

Handles PCAP file save/load/replay operations.

Key Concepts for Beginners:
- wrpcap: Scapy function to write packets to PCAP file
- rdpcap: Scapy function to read packets from PCAP file

For learning more: docs/networking-basics.md
"""

from __future__ import annotations
import logging
import os
from typing import List, Dict, Optional

from scapy.all import wrpcap, rdpcap, IP, TCP, UDP, ICMP, ARP

from app.models.packet import Packet

logger = logging.getLogger(__name__)


class PCAPService:
    """
    Service for managing PCAP file operations.
    """
    
    def __init__(self, get_raw_packets):
        """
        Initialize PCAP service.
        
        Args:
            get_raw_packets: Callable that returns current raw packets list
        """
        self._get_raw_packets = get_raw_packets
    
    def save(self, filepath: str) -> Dict:
        """
        Save captured packets to a PCAP file.
        
        Args:
            filepath: Path to save the PCAP file
            
        Returns:
            Dict with success status and packet count
        """
        raw_packets = self._get_raw_packets()
        
        logger.info(f"PCAP save: {len(raw_packets) if raw_packets else 0} raw packets available")
        
        if not raw_packets:
            logger.warning("No packets to save")
            return {"success": False, "error": "No packets captured - start capturing first"}
            
        try:
            wrpcap(filepath, raw_packets)
            logger.info(f"Saved {len(raw_packets)} packets to {filepath}")
            return {"success": True, "packet_count": len(raw_packets)}
        except Exception as e:
            logger.error(f"Failed to save PCAP: {e}")
            return {"success": False, "error": str(e)}
    
    def load(self, filepath: str) -> List[Packet]:
        """
        Load packets from a PCAP file.
        
        Args:
            filepath: Path to the PCAP file
            
        Returns:
            List of Packet objects
        """
        packets = []
        
        try:
            if not os.path.exists(filepath):
                logger.error(f"PCAP file not found: {filepath}")
                return []
                
            loaded_packets = rdpcap(filepath)
            logger.info(f"Loaded {len(loaded_packets)} packets from {filepath}")
            
            for pkt in loaded_packets:
                packet = self._parse_packet(pkt)
                if packet:
                    packets.append(packet)
                    
            return packets
        except Exception as e:
            logger.error(f"Failed to load PCAP: {e}")
            return []
    
    def _parse_packet(self, raw_packet) -> Optional[Packet]:
        """
        Parse a raw Scapy packet into a Packet object.
        
        Args:
            raw_packet: Raw Scapy packet
            
        Returns:
            Packet object or None if parsing fails
        """
        from datetime import datetime
        
        timestamp = datetime.now()
        src, dst = "", ""
        src_port, dst_port = 0, 0
        proto, length, info = "", 0, ""
        
        if IP in raw_packet:
            src = raw_packet[IP].src
            dst = raw_packet[IP].dst
            length = len(raw_packet)
            
            if TCP in raw_packet:
                proto = "TCP"
                src_port = raw_packet[TCP].sport
                dst_port = raw_packet[TCP].dport
                info = f"{src_port} -> {dst_port}"
            elif UDP in raw_packet:
                proto = "UDP"
                src_port = raw_packet[UDP].sport
                dst_port = raw_packet[UDP].dport
                info = f"{src_port} -> {dst_port}"
            elif ICMP in raw_packet:
                proto = "ICMP"
                info = f"Type: {raw_packet[ICMP].type}"
            else:
                proto = "IP"
                
        elif ARP in raw_packet:
            proto = "ARP"
            src = raw_packet[ARP].psrc
            dst = raw_packet[ARP].pdst
            info = "ARP Request/Reply"
            length = len(raw_packet)
        
        if src and dst:
            return Packet(timestamp, src, dst, src_port, dst_port, proto, length, info)
        
        return None