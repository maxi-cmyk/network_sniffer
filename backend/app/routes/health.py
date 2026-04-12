"""
Health Route
===========

Simple health check endpoint.
"""

from fastapi import APIRouter

from app.services.registry import sniffer_service

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "healthy",
        "sniffing": sniffer_service.sniffing,
        "clients": len(sniffer_service.clients),
    }

@router.get("/debug")
async def debug_info():
    """
    Debug info endpoint.
    """
    return {
        "service_id": id(sniffer_service),
        "clients": len(sniffer_service.clients),
        "buffer_size": len(sniffer_service._packet_buffer),
    }