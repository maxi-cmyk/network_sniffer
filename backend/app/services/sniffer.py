import asyncio
import logging
import threading
from typing import Optional

from app.models.packet import Packet
from app.handlers.packet import PacketHandler

logger = logging.getLogger(__name__)


class SnifferService:
    """Manages packet capture and broadcasting to clients."""
    
    def __init__(self):
        self.clients: set = set()
        self.sniffing = False
        self.ip_filter: str = ""
        self.protocol_filter: str = ""
        
        self._clients_lock = threading.Lock()
        self._buffer_lock = threading.Lock()
        
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        
        # Packet buffer for broadcasting
        self._packet_buffer: list[Packet] = []
        
        # Packet handler (processes raw packets)
        self._packet_handler = PacketHandler()
        
        # Background task for flushing the buffer
        self._flush_task = None
    
    @property
    def raw_packets(self) -> list:
        """Get raw packets from handler for PCAP export."""
        return self._packet_handler.raw_packets
    
    def set_loop(self, loop: asyncio.AbstractEventLoop):
        """Store reference to the asyncio event loop."""
        self._loop = loop
    
    def set_filters(self, ip_filter: str = "", protocol_filter: str = ""):
        """
        Set packet filters.
        
        Args:
            ip_filter: IP address to filter
            protocol_filter: Protocol to filter (tcp, udp, etc.)
        """
        self.ip_filter = ip_filter.strip()
        self.protocol_filter = protocol_filter.strip().lower()
        logger.info(f"Filters set - IP: '{self.ip_filter}', Protocol: '{self.protocol_filter}'")
    
    # =========================================================================
    # Client Management
    # =========================================================================
    
    def add_client(self, websocket):
        """Add a WebSocket client."""
        with self._clients_lock:
            self.clients.add(websocket)
            logger.info(f"Client connected. Total: {len(self.clients)}")
    
    def remove_client(self, websocket):
        """Remove a WebSocket client."""
        with self._clients_lock:
            self.clients.discard(websocket)
            logger.info(f"Client disconnected. Total: {len(self.clients)}")
    
    # =========================================================================
    # Broadcasting
    # =========================================================================
    
    async def broadcast(self, packet: Packet):
        """
        Send a single packet to all connected clients.
        
        Args:
            packet: Packet to broadcast
        """
        import json
        
        with self._clients_lock:
            clients_snapshot = set(self.clients)
        
        if not clients_snapshot:
            return
        
        message = json.dumps(packet.to_dict())
        disconnected = set()
        
        for client in clients_snapshot:
            try:
                await client.send_text(message)
            except Exception as e:
                logger.error(f"Error sending to client: {e}")
                disconnected.add(client)
        
        if disconnected:
            with self._clients_lock:
                self.clients -= disconnected
    
    async def broadcast_batch(self, packets: list[Packet]):
        """
        Send multiple packets as a batch.
        
        Args:
            packets: List of packets to broadcast
        """
        import json
        
        if not packets:
            return
        
        message = json.dumps([p.to_dict() for p in packets])
        
        with self._clients_lock:
            clients_snapshot = set(self.clients)
        
        disconnected = set()
        for client in clients_snapshot:
            try:
                await client.send_text(message)
            except Exception as e:
                logger.error(f"Error sending to client: {e}")
                disconnected.add(client)
        
        if disconnected:
            with self._clients_lock:
                self.clients -= disconnected
    
    # =========================================================================
    # Buffer Flushing
    # =========================================================================
    
    async def flush_buffer(self):
        """
        Periodically flush the packet buffer to clients.
        Runs every 50ms to batch packets.
        """
        while True:
            await asyncio.sleep(0.05)  # 50ms
            
            with self._buffer_lock:
                batch = list(self._packet_buffer)
                self._packet_buffer.clear()
            
            if not batch:
                continue
            
            # Limit batch size to prevent browser freeze
            if len(batch) > 200:
                batch = batch[-200:]
            
            await self.broadcast_batch(batch)
    
    # =========================================================================
    # Packet Processing
    # =========================================================================
    
    def process_packet(self, pkt):
        """
        Process a captured packet and add to buffer.
        
        Args:
            pkt: Raw Scapy packet
        """
        if not self.sniffing:
            return
        
        # Process through handler (applies filters, stores raw packet)
        packet = self._packet_handler.process(
            pkt, 
            self.ip_filter, 
            self.protocol_filter
        )
        
        if packet:
            with self._buffer_lock:
                self._packet_buffer.append(packet)