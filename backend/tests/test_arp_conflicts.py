"""Regression tests for ARP mapping-conflict detection."""

import unittest

from scapy.all import ARP

from app.handlers.packet import PacketHandler
from app.services.alerts import AlertService


class ARPConflictDetectionTests(unittest.TestCase):
    def setUp(self):
        self.alerts = AlertService()
        self.handler = PacketHandler(alert_service=self.alerts)

    def test_first_arp_mapping_is_baselined_without_an_alert(self):
        self.handler.process(ARP(psrc="192.168.50.1", pdst="192.168.50.10", hwsrc="aa:aa:aa:aa:aa:aa"))

        self.assertEqual(
            self.handler.get_arp_table(),
            [{"ip": "192.168.50.1", "mac": "aa:aa:aa:aa:aa:aa"}],
        )
        self.assertEqual(self.alerts.get_alerts(), [])

    def test_changed_mac_for_existing_ip_creates_explainable_arp_conflict_alert(self):
        self.handler.process(ARP(psrc="192.168.50.1", pdst="192.168.50.10", hwsrc="aa:aa:aa:aa:aa:aa"))
        self.handler.process(ARP(psrc="192.168.50.1", pdst="192.168.50.10", hwsrc="bb:bb:bb:bb:bb:bb"))

        alerts = self.alerts.get_alerts()
        self.assertEqual(len(alerts), 1)
        self.assertEqual(alerts[0]["alert_type"], "arp_conflict")
        self.assertEqual(alerts[0]["source_ip"], "192.168.50.1")
        self.assertIn("Expected MAC aa:aa:aa:aa:aa:aa", alerts[0]["description"])
        self.assertIn("observed MAC bb:bb:bb:bb:bb:bb", alerts[0]["description"])


if __name__ == "__main__":
    unittest.main()
