"""
Alert Service
Detects and tracks suspicious network activity.

Features:
- Port Scan Detection
- SYN Flood Detection  
- High Volume Alert
- Packet Rate Analysis
- Connection State Tracking
- Protocol Anomaly Detection
- Geographic IP Analysis (Private vs Public)
"""

from __future__ import annotations
import logging
import os
from dataclasses import dataclass
from datetime import datetime, timedelta
from ipaddress import ip_address, AddressValueError
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


# =============================================================================
# CONFIGURATION
# =============================================================================

class AlertConfig:
    """Configurable thresholds for alert detection."""
    
    # Test mode - set via environment variable
    TEST_MODE = os.environ.get('ALERT_TEST_MODE', 'false').lower() == 'true'
    
    # Port Scan thresholds (can be updated via API)
    PORT_SCAN_THRESHOLD = 15 if TEST_MODE else 25
    PORT_SCAN_WINDOW = 5  # seconds
    
    # SYN Flood thresholds
    SYN_FLOOD_THRESHOLD = 10 if TEST_MODE else 30  # SYNs without ACK
    
    # High Volume thresholds
    HIGH_VOLUME_THRESHOLD = 102400 if TEST_MODE else 1024 * 1024  # bytes
    
    # Packet Rate thresholds
    PACKET_RATE_THRESHOLD = 50 if TEST_MODE else 100  # packets/second
    
    # Connection ratio threshold
    CONNECTION_RATIO_THRESHOLD = 0.5  # half_open / established
    
    # Alert limits
    MAX_ALERTS = 50
    ALERT_TTL = 60  # seconds
    
    # Cooldown period to prevent alert spam
    ALERT_COOLDOWN = 60  # seconds
    
    # IP type tracking
    TRACK_PRIVATE_IPS = True
    TRACK_PUBLIC_IPS = True
    
    @classmethod
    def update_thresholds(cls, settings: dict):
        """Update thresholds from settings dict."""
        if 'port_scan_threshold' in settings:
            cls.PORT_SCAN_THRESHOLD = int(settings['port_scan_threshold'])
        if 'port_scan_window' in settings:
            cls.PORT_SCAN_WINDOW = int(settings['port_scan_window'])
        if 'syn_flood_threshold' in settings:
            cls.SYN_FLOOD_THRESHOLD = int(settings['syn_flood_threshold'])
        if 'high_volume_threshold' in settings:
            cls.HIGH_VOLUME_THRESHOLD = int(settings['high_volume_threshold'])
        if 'packet_rate_threshold' in settings:
            cls.PACKET_RATE_THRESHOLD = int(settings['packet_rate_threshold'])
        if 'alert_ttl' in settings:
            cls.ALERT_TTL = int(settings['alert_ttl'])
        if 'alert_cooldown' in settings:
            cls.ALERT_COOLDOWN = int(settings['alert_cooldown'])
        logger.info(f"Thresholds updated: {settings}")
    
    @classmethod
    def to_dict(cls) -> dict:
        """Export current thresholds."""
        return {
            "port_scan_threshold": cls.PORT_SCAN_THRESHOLD,
            "port_scan_window": cls.PORT_SCAN_WINDOW,
            "syn_flood_threshold": cls.SYN_FLOOD_THRESHOLD,
            "high_volume_threshold": cls.HIGH_VOLUME_THRESHOLD,
            "packet_rate_threshold": cls.PACKET_RATE_THRESHOLD,
            "connection_ratio_threshold": cls.CONNECTION_RATIO_THRESHOLD,
            "alert_ttl": cls.ALERT_TTL,
            "alert_cooldown": cls.ALERT_COOLDOWN,
            "max_alerts": cls.MAX_ALERTS,
            "test_mode": cls.TEST_MODE,
        }


# =============================================================================
# DATA MODELS
# =============================================================================

@dataclass
class Alert:
    """Represents a network alert."""
    id: str
    severity: str  # critical, warning, info
    source_ip: str
    ip_category: str  # private, public, localhost
    description: str
    timestamp: datetime
    count: int = 1
    alert_type: str = ""  # port_scan, syn_flood, etc.
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "severity": self.severity,
            "source_ip": self.source_ip,
            "ip_category": self.ip_category,
            "description": self.description,
            "timestamp": self.timestamp.isoformat(),
            "count": self.count,
            "alert_type": self.alert_type,
        }


# =============================================================================
# ALERT SERVICE
# =============================================================================

class AlertService:
    """Detects patterns in network traffic."""
    
    # Expected port mappings for protocol anomaly detection
    EXPECTED_PORTS = {
        'HTTP': {80, 443, 8080, 8000, 3000, 5000},
        'HTTPS': {443, 8443, 9443},
        'SSH': {22, 2222},
        'DNS': {53},
        'MySQL': {3306, 33060},
        'PostgreSQL': {5432},
        'Redis': {6379},
        'SMTP': {25, 587, 465},
        'FTP': {21, 20},
        'RDP': {3389},
    }
    
    def __init__(self):
        self._alerts: List[Alert] = []
        self._config = AlertConfig()
        
        # Port scan tracker: IP -> [timestamps]
        self._port_scan_tracker: Dict[str, List[datetime]] = {}
        
        # SYN flood tracker: IP -> count
        self._syn_tracker: Dict[str, int] = {}
        
        # Packet rate tracker: IP -> [timestamps]
        self._packet_rate_tracker: Dict[str, List[datetime]] = {}
        
        # Connection tracker: IP -> {half_open: count, established: count}
        self._connection_tracker: Dict[str, Dict[str, int]] = {}
        
        # High volume tracker: IP -> bytes
        self._volume_tracker: Dict[str, int] = {}
        
        # Cooldown tracker: key = "ip:alert_type", value = last trigger time
        self._cooldowns: Dict[str, datetime] = {}
        
        self._last_cleanup = datetime.now()
        
        logger.info(f"AlertService initialized (TEST_MODE={self._config.TEST_MODE})")
    
    def _get_ip_category(self, ip: str) -> str:
        """Determine if IP is private, public, or localhost."""
        try:
            addr = ip_address(ip)
            if addr.is_loopback:
                return 'localhost'
            if addr.is_private:
                return 'private'
            return 'public'
        except (AddressValueError, ValueError):
            return 'unknown'
    
    def _get_expected_protocol(self, port: int) -> Optional[str]:
        """Get expected protocol for a port."""
        for protocol, ports in self.EXPECTED_PORTS.items():
            if port in ports:
                return protocol
        return None
    
    # -------------------------------------------------------------------------
    # PORT SCAN DETECTION
    # -------------------------------------------------------------------------
    
    def check_port_scan(self, ip: str, ports: List[int], ip_category: str = None) -> Optional[Alert]:
        """Detect port scanning - many ports in short time."""
        if ip_category is None:
            ip_category = self._get_ip_category(ip)
        
        # Skip localhost/private IPs for port scan (common behavior)
        if ip_category in ('localhost', 'private') and not self._config.TRACK_PRIVATE_IPS:
            return None
        
        now = datetime.now()
        
        if ip not in self._port_scan_tracker:
            self._port_scan_tracker[ip] = []
        
        # Store ports with timestamps for sequential detection
        for port in ports:
            self._port_scan_tracker[ip].append((now, port))
        
        # Clean old entries
        cutoff = now - timedelta(seconds=self._config.PORT_SCAN_WINDOW)
        self._port_scan_tracker[ip] = [
            (ts, port) for ts, port in self._port_scan_tracker[ip] if ts > cutoff
        ]
        
        # Count total port contacts
        count = len(self._port_scan_tracker[ip])
        threshold = self._config.PORT_SCAN_THRESHOLD
        
        # Check for sequential port scan (e.g., 22, 23, 24, 25)
        sequential_alert = self._check_sequential_ports(ip, now)
        if sequential_alert:
            return sequential_alert
        
        if count >= threshold:
            # Check cooldown to prevent spam
            if self._is_on_cooldown(ip, "port_scan"):
                return None
            
            alert = Alert(
                id=f"port_scan_{ip}_{now.timestamp()}",
                severity="warning",
                source_ip=ip,
                ip_category=ip_category,
                description=f"Port scan: {count} ports in {self._config.PORT_SCAN_WINDOW}s",
                timestamp=now,
                count=count,
                alert_type="port_scan",
            )
            self._add_alert(alert)
            self._port_scan_tracker[ip] = []
            logger.warning(f"ALERT: Port scan from {ip} ({ip_category}): {count} ports")
            return alert
        
        return None
    
    def _check_sequential_ports(self, ip: str, now: datetime) -> Optional[Alert]:
        """Detect sequential port scanning (e.g., 22,23,24 vs random ports)."""
        if ip not in self._port_scan_tracker:
            return None
        
        # Get recent ports (last 10)
        recent = self._port_scan_tracker[ip][-10:]
        if len(recent) < 5:
            return None
        
        ports_only = [port for _, port in recent]
        
        # Check for sequential pattern (3+ consecutive ports)
        sequential_count = 0
        max_sequential = 0
        for i in range(1, len(ports_only)):
            if ports_only[i] == ports_only[i-1] + 1:
                sequential_count += 1
                max_sequential = max(max_sequential, sequential_count)
            else:
                sequential_count = 0
        
        # Alert if 3+ sequential ports detected
        if max_sequential >= 3:
            if self._is_on_cooldown(ip, "sequential_scan"):
                return None
            
            ip_category = self._get_ip_category(ip)
            alert = Alert(
                id=f"sequential_scan_{ip}_{now.timestamp()}",
                severity="warning",
                source_ip=ip,
                ip_category=ip_category,
                description=f"Sequential port scan: {max_sequential}+ consecutive ports",
                timestamp=now,
                count=max_sequential,
                alert_type="sequential_scan",
            )
            self._add_alert(alert)
            logger.warning(f"ALERT: Sequential port scan from {ip}: {max_sequential} consecutive ports")
            return alert
        
        return None
    
    # -------------------------------------------------------------------------
    # SYN FLOOD DETECTION
    # -------------------------------------------------------------------------
    
    def check_syn_flood(self, ip: str, flags: str, has_ack: bool, ip_category: str = None) -> Optional[Alert]:
        """Detect SYN flood - many SYNs without completing handshake."""
        if ip_category is None:
            ip_category = self._get_ip_category(ip)
        
        if ip_category == 'localhost':
            return None
            
        now = datetime.now()
        
        # Initialize tracker
        if ip not in self._syn_tracker:
            self._syn_tracker[ip] = 0
        
        # Count SYNs without ACK
        if "SYN" in flags and not has_ack:
            self._syn_tracker[ip] += 1
        elif has_ack and "ACK" in flags:
            self._syn_tracker[ip] = 0  # Reset on successful handshake
        
        count = self._syn_tracker[ip]
        threshold = self._config.SYN_FLOOD_THRESHOLD
        
        if count >= threshold:
            # Check cooldown to prevent spam
            if self._is_on_cooldown(ip, "syn_flood"):
                return None
            
            alert = Alert(
                id=f"syn_flood_{ip}_{now.timestamp()}",
                severity="critical",
                source_ip=ip,
                ip_category=ip_category,
                description=f"SYN flood: {count} SYNs without ACK",
                timestamp=now,
                count=count,
                alert_type="syn_flood",
            )
            self._add_alert(alert)
            self._syn_tracker[ip] = 0
            logger.critical(f"ALERT: SYN flood from {ip} ({ip_category}): {count} SYNs")
            return alert
        
        return None
    
    # -------------------------------------------------------------------------
    # HIGH VOLUME DETECTION
    # -------------------------------------------------------------------------
    
    def check_high_volume(self, ip: str, bytes_transferred: int, ip_category: str = None) -> Optional[Alert]:
        """Detect high volume traffic from single IP."""
        if ip_category is None:
            ip_category = self._get_ip_category(ip)
        
        # Skip localhost for volume tracking
        if ip_category == 'localhost':
            return None
        
        now = datetime.now()
        
        # Accumulate bytes
        if ip not in self._volume_tracker:
            self._volume_tracker[ip] = 0
        self._volume_tracker[ip] += bytes_transferred
        
        threshold = self._config.HIGH_VOLUME_THRESHOLD
        total = self._volume_tracker[ip]
        
        if total >= threshold:
            # Check cooldown to prevent spam
            if self._is_on_cooldown(ip, "high_volume"):
                return None
            
            alert = Alert(
                id=f"high_vol_{ip}_{now.timestamp()}",
                severity="warning",
                source_ip=ip,
                ip_category=ip_category,
                description=f"High volume: {total / 1024 / 1024:.1f}MB from {ip}",
                timestamp=now,
                count=total,
                alert_type="high_volume",
            )
            self._add_alert(alert)
            self._volume_tracker[ip] = 0  # Reset after alert
            logger.warning(f"ALERT: High volume from {ip} ({ip_category}): {total / 1024 / 1024:.1f}MB")
            return alert
        
        return None
    
    # -------------------------------------------------------------------------
    # PACKET RATE ANALYSIS (NEW)
    # -------------------------------------------------------------------------
    
    def check_packet_rate(self, ip: str, ip_category: str = None) -> Optional[Alert]:
        """Detect packet flood - unusually high packet rate."""
        if ip_category is None:
            ip_category = self._get_ip_category(ip)
        
        if ip_category in ('localhost', 'private') and not self._config.TRACK_PRIVATE_IPS:
            return None
        
        now = datetime.now()
        
        if ip not in self._packet_rate_tracker:
            self._packet_rate_tracker[ip] = []
        
        # Add current timestamp
        self._packet_rate_tracker[ip].append(now)
        
        # Keep only last 1 second
        cutoff = now - timedelta(seconds=1)
        self._packet_rate_tracker[ip] = [
            ts for ts in self._packet_rate_tracker[ip] if ts > cutoff
        ]
        
        rate = len(self._packet_rate_tracker[ip])
        threshold = self._config.PACKET_RATE_THRESHOLD
        
        if rate >= threshold:
            # Check cooldown to prevent spam
            if self._is_on_cooldown(ip, "packet_flood"):
                return None
            
            alert = Alert(
                id=f"packet_rate_{ip}_{now.timestamp()}",
                severity="warning",
                source_ip=ip,
                ip_category=ip_category,
                description=f"Packet flood: {rate} packets/s from {ip}",
                timestamp=now,
                count=rate,
                alert_type="packet_flood",
            )
            self._add_alert(alert)
            self._packet_rate_tracker[ip] = []
            logger.warning(f"ALERT: Packet flood from {ip} ({ip_category}): {rate} pps")
            return alert
        
        return None
    
    # -------------------------------------------------------------------------
    # CONNECTION TRACKING (NEW)
    # -------------------------------------------------------------------------
    
    def check_connection_ratio(self, ip: str, tcp_state: str, ip_category: str = None) -> Optional[Alert]:
        """Detect abnormal half-open to established connection ratio."""
        if ip_category is None:
            ip_category = self._get_ip_category(ip)
        
        if ip_category in ('localhost', 'private') and not self._config.TRACK_PRIVATE_IPS:
            return None
        
        if ip not in self._connection_tracker:
            self._connection_tracker[ip] = {'half_open': 0, 'established': 0}
        
        tracker = self._connection_tracker[ip]
        
        # Update counts based on state
        if tcp_state in ('SYN_SENT', 'SYN_RCVD'):
            tracker['half_open'] += 1
        elif tcp_state == 'ESTABLISHED':
            tracker['half_open'] = max(0, tracker['half_open'] - 1)
            tracker['established'] += 1
        elif tcp_state in ('CLOSED', 'CLOSE_WAIT', 'RESET', 'FIN_WAIT'):
            tracker['half_open'] = max(0, tracker['half_open'] - 1)
        
        # Check ratio
        half_open = tracker['half_open']
        established = tracker['established']
        
        if established > 0:
            ratio = half_open / established
            threshold = self._config.CONNECTION_RATIO_THRESHOLD
            
            if ratio > threshold and half_open > 5:
                now = datetime.now()
                alert = Alert(
                    id=f"conn_ratio_{ip}_{now.timestamp()}",
                    severity="warning",
                    source_ip=ip,
                    ip_category=ip_category,
                    description=f"Connection anomaly: {half_open} half-open, {established} established (ratio {ratio:.1f})",
                    timestamp=now,
                    count=half_open,
                    alert_type="connection_ratio",
                )
                self._add_alert(alert)
                logger.warning(f"ALERT: Connection ratio anomaly {ip}: {ratio:.1f}")
                return alert
        
        return None
    
    # -------------------------------------------------------------------------
    # PROTOCOL ANOMALY DETECTION (NEW)
    # -------------------------------------------------------------------------
    
    def check_protocol_anomaly(self, ip: str, protocol: str, port: int, 
                               l7_data: dict = None, ip_category: str = None) -> Optional[Alert]:
        """Detect unusual protocol/port combinations."""
        if ip_category is None:
            ip_category = self._get_ip_category(ip)
        
        # Skip non-TCP protocols for this check
        if protocol != 'TCP':
            return None
        
        expected = self._get_expected_protocol(port)
        
        # Check for HTTP on non-HTTP ports
        if l7_data:
            # HTTP data on SSH port
            if port == 22 and (l7_data.get('http_method') or l7_data.get('http_host')):
                return self._create_anomaly_alert(ip, ip_category, "HTTP data on SSH port (22)")
            
            # HTTP on MySQL port
            if port == 3306 and (l7_data.get('http_method') or l7_data.get('http_host')):
                return self._create_anomaly_alert(ip, ip_category, "HTTP data on MySQL port (3306)")
        
        return None
    
    def _create_anomaly_alert(self, ip: str, ip_category: str, description: str) -> Alert:
        """Create protocol anomaly alert."""
        now = datetime.now()
        alert = Alert(
            id=f"protocol_anomaly_{ip}_{now.timestamp()}",
            severity="info",
            source_ip=ip,
            ip_category=ip_category,
            description=f"Protocol anomaly: {description}",
            timestamp=now,
            count=1,
            alert_type="protocol_anomaly",
        )
        self._add_alert(alert)
        logger.info(f"ALERT: Protocol anomaly from {ip}: {description}")
        return alert
    
    # -------------------------------------------------------------------------
    # PUBLIC API
    # -------------------------------------------------------------------------
    
    def process_packet(self, ip: str, protocol: str, src_port: int, dst_port: int,
                       tcp_state: str, tcp_flags: str, bytes_transferred: int,
                       l7_data: dict = None) -> List[Alert]:
        """Process a packet and check all alert conditions. Returns list of triggered alerts."""
        alerts = []
        ip_category = self._get_ip_category(ip)
        
        # Port scan (check both ports from packet)
        ports = [p for p in [src_port, dst_port] if p > 0]
        alert = self.check_port_scan(ip, ports, ip_category)
        if alert:
            alerts.append(alert)
        
        # SYN flood
        has_ack = 'ACK' in tcp_flags if tcp_flags else False
        if protocol == 'TCP':
            alert = self.check_syn_flood(ip, tcp_flags, has_ack, ip_category)
            if alert:
                alerts.append(alert)
            
            # Connection ratio
            if tcp_state:
                alert = self.check_connection_ratio(ip, tcp_state, ip_category)
                if alert:
                    alerts.append(alert)
        
        # High volume
        if bytes_transferred > 0:
            alert = self.check_high_volume(ip, bytes_transferred, ip_category)
            if alert:
                alerts.append(alert)
        
        # Packet rate (always triggered on any packet)
        alert = self.check_packet_rate(ip, ip_category)
        if alert:
            alerts.append(alert)
        
        # Protocol anomaly
        if protocol == 'TCP':
            alert = self.check_protocol_anomaly(ip, protocol, dst_port, l7_data, ip_category)
            if alert:
                alerts.append(alert)
        
        return alerts
    
    def get_alerts(self, max_count: int = 10) -> List[dict]:
        """Get active alerts."""
        self._cleanup()
        return [a.to_dict() for a in self._alerts[:max_count]]
    
    def get_alert_count(self) -> int:
        """Get active alert count."""
        self._cleanup()
        return len(self._alerts)
    
    def get_stats(self) -> dict:
        """Get alert statistics."""
        self._cleanup()
        return {
            "total_alerts": len(self._alerts),
            "by_severity": {
                "critical": len([a for a in self._alerts if a.severity == "critical"]),
                "warning": len([a for a in self._alerts if a.severity == "warning"]),
                "info": len([a for a in self._alerts if a.severity == "info"]),
            },
            "by_type": self._get_alert_type_counts(),
            "test_mode": self._config.TEST_MODE,
        }
    
    def _get_alert_type_counts(self) -> dict:
        """Get count by alert type."""
        counts = {}
        for alert in self._alerts:
            counts[alert.alert_type] = counts.get(alert.alert_type, 0) + 1
        return counts
    
    def dismiss_alert(self, alert_id: str) -> bool:
        """Dismiss an alert."""
        for i, alert in enumerate(self._alerts):
            if alert.id == alert_id:
                self._alerts.pop(i)
                return True
        return False
    
    def clear_alerts(self):
        """Clear all alerts."""
        self._alerts = []
        self._port_scan_tracker = {}
        self._syn_tracker = {}
        self._packet_rate_tracker = {}
        self._connection_tracker = {}
        self._volume_tracker = {}
        logger.info("All alerts cleared")
    
    def _add_alert(self, alert: Alert):
        """Add alert to list with deduplication."""
        # Check for duplicate within TTL
        for existing in self._alerts:
            if (existing.source_ip == alert.source_ip and 
                existing.alert_type == alert.alert_type and
                (datetime.now() - existing.timestamp).total_seconds() < self._config.ALERT_TTL):
                return  # Skip duplicate
        
        self._alerts.append(alert)
        
        # Set cooldown to prevent rapid re-triggering
        cooldown_key = f"{alert.source_ip}:{alert.alert_type}"
        self._cooldowns[cooldown_key] = datetime.now()
        
        # Keep max alerts
        if len(self._alerts) > self._config.MAX_ALERTS:
            self._alerts = self._alerts[-self._config.MAX_ALERTS:]
    
    def _is_on_cooldown(self, ip: str, alert_type: str) -> bool:
        """Check if IP/alert_type is on cooldown."""
        cooldown_key = f"{ip}:{alert_type}"
        last_trigger = self._cooldowns.get(cooldown_key)
        if not last_trigger:
            return False
        elapsed = (datetime.now() - last_trigger).total_seconds()
        return elapsed < self._config.ALERT_COOLDOWN
    
    def _cleanup(self):
        """Remove old alerts and stale tracker entries."""
        now = datetime.now()
        cutoff = now - timedelta(seconds=self._config.ALERT_TTL)

        # Cleanup every 10 seconds max
        if (now - self._last_cleanup).total_seconds() < 10:
            return

        # Remove old alerts
        self._alerts = [a for a in self._alerts if a.timestamp > cutoff]

        tracker_cutoff = now - timedelta(seconds=30)

        # Clean port_scan_tracker: values are list of (timestamp, port) tuples
        for ip in list(self._port_scan_tracker.keys()):
            entries = [(ts, port) for ts, port in self._port_scan_tracker[ip] if ts > tracker_cutoff]
            if entries:
                self._port_scan_tracker[ip] = entries
            else:
                del self._port_scan_tracker[ip]

        # Clean packet_rate_tracker: values are list of timestamps
        for ip in list(self._packet_rate_tracker.keys()):
            entries = [ts for ts in self._packet_rate_tracker[ip] if ts > tracker_cutoff]
            if entries:
                self._packet_rate_tracker[ip] = entries
            else:
                del self._packet_rate_tracker[ip]

        # Cap simple trackers (syn, volume, connection, cooldowns) at 200 keys
        for tracker in [self._syn_tracker, self._volume_tracker,
                        self._connection_tracker, self._cooldowns]:
            if len(tracker) > 200:
                keys = list(tracker.keys())
                for k in keys[:len(keys) - 200]:
                    del tracker[k]

        self._last_cleanup = now