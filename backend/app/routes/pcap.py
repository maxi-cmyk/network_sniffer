"""
PCAP Routes
==========

Endpoints for PCAP save/load/replay operations.

API Endpoints:
- POST /pcap/save - Save captured packets to PCAP file
- POST /pcap/load - Load PCAP file and replay to clients
"""

import os
import json
from fastapi import APIRouter

from app.services.pcap import PCAPService
from app.services.registry import sniffer_service

router = APIRouter()


@router.post("/pcap/save")
async def save_pcap(filename: str = "capture.pcap"):
    """
    Save captured packets to a PCAP file.
    """
    pcap_service = PCAPService(lambda: sniffer_service.raw_packets)
    
    filepath = os.path.join(os.getcwd(), filename)
    result = pcap_service.save(filepath)
    
    return {
        "success": result["success"],
        "filepath": filepath if result["success"] else None,
        "packet_count": result.get("packet_count", 0),
        "error": result.get("error")
    }


@router.post("/pcap/load")
async def load_pcap(filename: str):
    """
    Load packets from a PCAP file and return them to client.
    """
    pcap_service = PCAPService(lambda: [])
    filepath = os.path.join(os.getcwd(), filename)
    packets = pcap_service.load(filepath)
    
    if not packets:
        return {"success": False, "error": "No packets loaded", "packets": []}
    
    # Return packets directly in response
    packet_data = [p.to_dict() for p in packets]
    
    return {
        "success": True,
        "packet_count": len(packets),
        "packets": packet_data
    }