# Services Registry
# ==============
# 
# Central registry for all service instances.
# Ensures the same instance is used across all routes.
#
# Usage in routes:
#   from app.services.registry import sniffer_service

from app.services.sniffer import SnifferService

# Single instance - used by all routes
sniffer_service = SnifferService()

__all__ = ['sniffer_service']