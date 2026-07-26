"""Tests for the local-only ARP conflict dashboard simulation."""

import unittest

from app.services.alerts import AlertService
from app.services.sniffer import SnifferService


class SafeARPConflictSimulationTests(unittest.TestCase):
    def test_simulation_creates_a_baseline_conflict_alert_without_network_capture(self):
        alerts = AlertService()
        sniffer = SnifferService(alert_service=alerts)

        result = sniffer.simulate_arp_conflict("192.168.56.1")

        self.assertTrue(result["triggered"])
        self.assertEqual(result["type"], "arp_conflict")
        self.assertEqual(result["mode"], "local_simulation")
        self.assertEqual(
            sniffer.get_arp_table(),
            [{"ip": "192.168.56.1", "mac": "02:00:00:00:00:02"}],
        )
        created_alerts = alerts.get_alerts()
        self.assertEqual(len(created_alerts), 1)
        self.assertEqual(created_alerts[0]["alert_type"], "arp_conflict")
        self.assertIn("02:00:00:00:00:01", created_alerts[0]["description"])
        self.assertIn("02:00:00:00:00:02", created_alerts[0]["description"])


if __name__ == "__main__":
    unittest.main()
