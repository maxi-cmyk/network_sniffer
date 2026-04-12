"""
WebSocket Route
=============

WebSocket endpoint for real-time packet streaming.
"""

import asyncio
import json
import threading

from fastapi import WebSocket, WebSocketDisconnect
from fastapi import APIRouter

from app.services.registry import sniffer_service

router = APIRouter()


@router.websocket("/ws/traffic")
async def websocket_traffic(websocket: WebSocket):
    """
    WebSocket endpoint for real-time packet streaming.
    """
    print(f"[WS] sniffer_service ID: {id(sniffer_service)}")
    await websocket.accept()
    
    # Get the event loop
    loop = asyncio.get_event_loop()
    sniffer_service.set_loop(loop)
    sniffer_service.add_client(websocket)
    
    # Start sniffer if not running
    global sniffer_thread
    with _sniffer_lock:
        if sniffer_thread is None or not sniffer_thread.is_alive():
            # Start buffer flush task
            sniffer_service._flush_task = asyncio.create_task(sniffer_service.flush_buffer())
            # Start Scapy sniff in separate thread
            sniffer_thread = threading.Thread(target=_run_sniff, daemon=True)
            sniffer_thread.start()
            print("Sniffer thread started")
    
    # Handle client messages (filter updates)
    try:
        while True:
            message = await websocket.receive_text()
            try:
                data = json.loads(message)
                if isinstance(data, dict):
                    ip_filter = data.get("ip_filter", "")
                    protocol_filter = data.get("protocol_filter", "")
                    sniffer_service.set_filters(ip_filter, protocol_filter)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        sniffer_service.remove_client(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        sniffer_service.remove_client(websocket)


# =============================================================================
# Sniffer Thread (imported from main for now)
# =============================================================================

def _run_sniff():
    """
    Start the packet sniffer in a background thread.
    """
    from scapy.all import sniff
    
    sniffer_service.sniffing = True
    sniff(prn=sniffer_service.process_packet, store=False, filter="ip or arp")


# Global thread storage
sniffer_thread = None
_sniffer_lock = threading.Lock()