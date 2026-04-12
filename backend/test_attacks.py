#!/usr/bin/env python3
"""
Attack Simulation Script
========================

Generates test traffic to simulate various network attacks for testing the Alert Detection system.

Usage:
    python test_attacks.py --port-scan --target 192.168.1.1
    python test_attacks.py --syn-flood --target 192.168.1.1
    python test_attacks.py --high-volume --target 192.168.1.1
    python test_attacks.py --all --target 192.168.1.1

Note: Requires running Network Sniffer backend. Uses raw sockets or HTTP requests.
"""

import argparse
import socket
import time
import sys
import os
import logging

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)


def test_port_scan(target_ip: str, ports: int = 10):
    """Test port scan detection."""
    print(f"\n{'='*50}")
    print(f"TEST: Port Scan (connecting to {ports} ports)")
    print(f"{'='*50}")
    
    # Common ports to scan
    test_ports = [22, 80, 443, 3306, 5432, 8080, 8000, 3000, 5000, 6379]
    
    for i, port in enumerate(test_ports[:ports]):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.1)
            result = sock.connect_ex((target_ip, port))
            sock.close()
            print(f"  Port {port}: {'OPEN' if result == 0 else 'CLOSED'}")
        except Exception as e:
            print(f"  Port {port}: ERROR - {e}")
        time.sleep(0.05)  # Small delay between ports
    
    print(f"\nPort scan test complete. Check Network Sniffer Alerts tab.")


def test_syn_flood(target_ip: str, count: int = 30):
    """Test SYN flood detection."""
    print(f"\n{'='*50}")
    print(f"TEST: SYN Flood ({count} connections)")
    print(f"{'='*50}")
    
    # This is a simplified test - real SYN flood requires raw sockets
    # We'll simulate by rapidly opening/closing connections
    for i in range(count):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.05)
            # Don't complete handshake - just initiate
            sock.connect((target_ip, 80))
            # Immediately close without sending data
            sock.close()
            print(f"  Connection {i+1}/{count}", end='\r')
        except:
            pass
        time.sleep(0.02)
    
    print(f"\nSYN flood test complete. Check Network Sniffer Alerts tab.")


def test_high_volume(target_ip: str, size_mb: int = 2):
    """Test high volume detection."""
    print(f"\n{'='*50}")
    print(f"TEST: High Volume ({size_mb}MB)")
    print(f"{'='*50}")
    
    # Generate large traffic by sending repeated data
    chunk_size = 1024 * 10  # 10KB chunks
    chunks = (size_mb * 1024 * 1024) // chunk_size
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect((target_ip, 80))
        
        # Send HTTP-like request with large body
        data = b"X" * chunk_size
        for i in range(min(chunks, 200)):  # Cap at 200 to avoid timeout
            try:
                sock.send(data)
                print(f"  Sent {i+1}/{min(chunks, 200)} chunks ({((i+1)*chunk_size)/1024/1024:.1f}MB)", end='\r')
            except:
                break
        
        sock.close()
    except Exception as e:
        print(f"  Error: {e}")
    
    print(f"\nHigh volume test complete. Check Network Sniffer Alerts tab.")


def test_packet_rate(target_ip: str, count: int = 60):
    """Test packet rate detection."""
    print(f"\n{'='*50}")
    print(f"TEST: Packet Rate ({count} packets/second)")
    print(f"{'='*50}")
    
    # Send rapid small packets
    for i in range(count):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.sendto(b"ping", (target_ip, 80))
            sock.close()
            print(f"  Packet {i+1}/{count}", end='\r')
        except:
            pass
        time.sleep(0.01)  # 10ms = 100 pps theoretical max
    
    print(f"\nPacket rate test complete. Check Network Sniffer Alerts tab.")


def show_alert_status():
    """Show current alert status from backend."""
    print(f"\n{'='*50}")
    print("CURRENT ALERTS")
    print(f"{'='*50}")
    
    try:
        import requests
        resp = requests.get("http://localhost:8000/alerts", timeout=2)
        data = resp.json()
        
        if data.get('alerts'):
            for alert in data['alerts']:
                severity = alert.get('severity', '?')
                ip = alert.get('source_ip', 'unknown')
                desc = alert.get('description', '')
                print(f"  [{severity.upper()}] {ip}: {desc}")
        else:
            print("  No alerts detected")
        
        # Show stats
        resp2 = requests.get("http://localhost:8000/alerts/stats", timeout=2)
        stats = resp2.json()
        print(f"\n  Stats: {stats.get('total_alerts', 0)} total alerts")
        print(f"  Test mode: {stats.get('test_mode', False)}")
        
    except ImportError:
        print("  (requests not installed - run: pip install requests)")
        print("  Or check alerts via: curl http://localhost:8000/alerts")
    except Exception as e:
        print(f"  Could not connect to backend: {e}")
        print("  Make sure Network Sniffer backend is running")


def main():
    parser = argparse.ArgumentParser(description="Network Attack Simulation for Testing")
    parser.add_argument('--target', default='127.0.0.1', help='Target IP address')
    parser.add_argument('--port-scan', action='store_true', help='Test port scan detection')
    parser.add_argument('--syn-flood', action='store_true', help='Test SYN flood detection')
    parser.add_argument('--high-volume', action='store_true', help='Test high volume detection')
    parser.add_argument('--packet-rate', action='store_true', help='Test packet rate detection')
    parser.add_argument('--show-alerts', action='store_true', help='Show current alerts')
    parser.add_argument('--all', action='store_true', help='Run all tests')
    
    args = parser.parse_args()
    
    print("""
╔══════════════════════════════════════════════════════════╗
║         Network Sniffer Attack Simulator                 ║
║                                                          ║
║  NOTE: Requires Network Sniffer backend to be running    ║
║  Run: cd backend && sudo python -m uvicorn app.main      ║
╚══════════════════════════════════════════════════════════╝
    """)
    
    if args.show_alerts:
        show_alert_status()
        return
    
    if not any([args.port_scan, args.syn_flood, args.high_volume, args.packet_rate, args.all]):
        parser.print_help()
        print("\nExample: python test_attacks.py --all --target 192.168.1.1")
        return
    
    if args.all or args.port_scan:
        test_port_scan(args.target, ports=10)
        time.sleep(1)
    
    if args.all or args.syn_flood:
        test_syn_flood(args.target, count=30)
        time.sleep(1)
    
    if args.all or args.high_volume:
        test_high_volume(args.target, size_mb=2)
        time.sleep(1)
    
    if args.all or args.packet_rate:
        test_packet_rate(args.target, count=60)
    
    print("\n" + "="*50)
    print("All tests complete!")
    print("="*50)
    show_alert_status()


if __name__ == '__main__':
    main()