# Services Registry
# ==============
# 
# Central registry for all service instances.
# Ensures the same instance is used across all routes.
#
# Usage in routes:
#   from app.services.registry import sniffer_service, alert_service

from app.services.sniffer import SnifferService
from app.services.alerts import AlertService

# Create AlertService first
alert_service = AlertService()

# Create SnifferService with AlertService
sniffer_service = SnifferService(alert_service=alert_service)

__all__ = ['sniffer_service', 'alert_service']