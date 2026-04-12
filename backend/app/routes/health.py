"""
Health Route
==========

Simple health check endpoint.
"""

from fastapi import APIRouter

from app.services.registry import sniffer_service, alert_service

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


@router.get("/alerts")
async def get_alerts():
    """
    Get active alerts.
    """
    alerts = alert_service.get_alerts(max_count=20)
    return {
        "alerts": alerts,
        "count": len(alerts),
    }


@router.get("/alerts/stats")
async def get_alert_stats():
    """
    Get alert statistics.
    """
    return alert_service.get_stats()


@router.post("/alerts/clear")
async def clear_alerts():
    """
    Clear all alerts.
    """
    alert_service.clear_alerts()
    return {"status": "cleared"}


@router.post("/alerts/simulate")
async def simulate_attacks(request: dict):
    """
    Run selected attack simulations.
    
    Body:
        port_scan: bool - Trigger port scan detection
        syn_flood: bool - Trigger SYN flood detection
        high_volume: bool - Trigger high volume detection
        packet_rate: bool - Trigger packet rate detection
        target_ip: str - Target IP for attacks
        intensity: int - Attack intensity (1-10)
    """
    port_scan = request.get("port_scan", False)
    syn_flood = request.get("syn_flood", False)
    high_volume = request.get("high_volume", False)
    packet_rate = request.get("packet_rate", False)
    target_ip = request.get("target_ip", "127.0.0.1")
    intensity = request.get("intensity", 5)
    
    results = []
    
    if port_scan:
        port_count = intensity * 2  # 2-20 ports
        ports = [80, 443, 8080, 22, 3306, 5432, 6379, 8080][:port_count]
        alert = alert_service.check_port_scan(target_ip, ports)
        results.append({
            "type": "port_scan", 
            "triggered": bool(alert), 
            "ports": len(ports),
            "target": target_ip
        })
    
    if syn_flood:
        syn_count = intensity * 2  # 2-20 SYNs
        for _ in range(syn_count):
            alert_service.check_syn_flood(target_ip, "SYN", False)
        results.append({
            "type": "syn_flood", 
            "triggered": True, 
            "count": syn_count,
            "target": target_ip
        })
    
    if high_volume:
        bytes_count = intensity * 1024 * 100  # 100KB-1MB based on intensity
        alert = alert_service.check_high_volume(target_ip, bytes_count)
        results.append({
            "type": "high_volume", 
            "triggered": bool(alert), 
            "bytes": bytes_count,
            "target": target_ip
        })
    
    if packet_rate:
        for _ in range(intensity):
            alert_service.check_packet_rate(target_ip)
        results.append({
            "type": "packet_rate", 
            "triggered": True, 
            "iterations": intensity,
            "target": target_ip
        })
    
    return {
        "results": results,
        "alerts": alert_service.get_alerts(),
        "target_ip": target_ip,
        "intensity": intensity
    }


@router.post("/alerts/sim/real")
async def simulate_real_attacks(request: dict):
    """
    Send actual network packets using Scapy (requires elevated privileges).
    
    Body:
        port_scan: bool - Send TCP SYN to multiple ports
        syn_flood: bool - Send multiple SYN packets
        high_volume: bool - Send large payload packets
        target_ip: str - Target IP for attacks
        intensity: int - Attack intensity (1-10)
    """
    port_scan = request.get("port_scan", False)
    syn_flood = request.get("syn_flood", False)
    high_volume = request.get("high_volume", False)
    target_ip = request.get("target_ip", "127.0.0.1")
    intensity = request.get("intensity", 5)
    
    from scapy.all import IP, TCP, RandShort, Raw, send
    import random
    
    results = []
    
    if port_scan:
        ports = [80, 443, 22, 3306, 5432, 6379, 8080, 8443][:intensity * 2]
        for port in ports:
            pkt = IP(src="10.0.0.1", dst=target_ip)/TCP(sport=RandShort(), dport=port)
            send(pkt, verbose=0)
        results.append({
            "type": "port_scan", 
            "sent": len(ports), 
            "target": target_ip,
            "mode": "real_packets"
        })
    
    if syn_flood:
        count = intensity * 5
        for _ in range(count):
            pkt = IP(src="10.0.0.1", dst=target_ip)/TCP(sport=RandShort(), dport=80, flags="S")
            send(pkt, verbose=0)
        results.append({
            "type": "syn_flood", 
            "sent": count, 
            "target": target_ip,
            "mode": "real_packets"
        })
    
    if high_volume:
        payload = b"X" * (intensity * 1024)  # 1-10KB payload
        for _ in range(intensity):
            pkt = IP(src="10.0.0.1", dst=target_ip)/TCP(sport=RandShort(), dport=80)/Raw(load=payload)
            send(pkt, verbose=0)
        results.append({
            "type": "high_volume", 
            "sent": intensity, 
            "payload_size": len(payload),
            "target": target_ip,
            "mode": "real_packets"
        })
    
    return {
        "results": results,
        "target_ip": target_ip,
        "intensity": intensity,
        "mode": "real_packets"
    }


@router.get("/alerts/full")
async def get_alerts_full():
    """
    Get alerts + top talkers + ARP table in single response.
    """
    alerts = alert_service.get_alerts(max_count=20)
    top_talkers = sniffer_service.get_top_talkers(max_count=10)
    arp_table = sniffer_service.get_arp_table()
    stats = alert_service.get_stats()
    
    return {
        "alerts": alerts,
        "alertCount": len(alerts),
        "topTalkers": top_talkers,
        "arpTable": arp_table,
        "stats": stats,
    }