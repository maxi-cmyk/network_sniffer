"""
Network Sniffer - Backend Server
============================

FastAPI server that captures network packets using Scapy
and broadcasts them to connected WebSocket clients in real-time.

Project Structure (modular/OOP):
- app/
  - models/         # Data models (Packet)
  - services/       # Business logic (SnifferService, PCAPService)
  - handlers/       # Request handlers (PacketHandler)
  - routes/         # API routes (health, pcap, websocket)
  - core/          # Configuration

For learning more: docs/networking-basics.md
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import config
from app.routes import health, pcap, websocket

# =============================================================================
# LOGGING SETUP
# =============================================================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================================================
# FASTAPI APP SETUP
# =============================================================================
app = FastAPI(title="Network Sniffer API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# REGISTER ROUTES
# =============================================================================
app.include_router(health.router, tags=["health"])
app.include_router(pcap.router, tags=["pcap"])
app.include_router(websocket.router, tags=["websocket"])


# =============================================================================
# SERVER INFO
# =============================================================================
logger.info("Network Sniffer API starting...")
logger.info("Routes: /health, /pcap/save, /pcap/load, /ws/traffic")