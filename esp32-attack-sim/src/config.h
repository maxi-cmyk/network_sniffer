#ifndef CONFIG_H
#define CONFIG_H

// CONFIG

// WiFi Network - FILL IN YOUR NETWORK
#define WIFI_SSID        "YourNetworkName"       // <-- Your WiFi SSID
#define WIFI_PASSWORD    "YourPassword123"       // <-- Your WiFi password

// ESP32 Static IP (choose any unused IP in your subnet)
#define ESP32_IP         "192.168.1.50"
#define ESP32_GATEWAY    "192.168.1.1"
#define ESP32_SUBNET     "255.255.255.0"
#define ESP32_DNS        "8.8.8.8"

// Target (Your Laptop) - FILL IN AFTER RUNNING ifconfig
#define TARGET_IP        "192.168.1.100"          // <-- Your laptop's IP

// Attack Defaults
#define DEFAULT_PING_INTERVAL_MS  500    // 2 pings/sec - detectable, not destructive
#define MAX_ATTACK_DURATION_MS    60000  // 60 seconds max per session
#define MAX_PPS                    20     // Rate limit cap

// Safety Limits
#define EMERGENCY_STOP_PIN        0      // GPIO0 for hardware kill switch
#define MAX_CONCURRENT_ATTACKS    1      // Only one attack at a time

// Debug
#define SERIAL_BAUD        115200
#define DEBUG_MODE         true

// NETWORK CONFIGURATION

// WiFi channel (0 = auto)
#define WIFI_CHANNEL       0

// Connection timeout (ms)
#define WIFI_TIMEOUT_MS    10000

// HTTP SERVER CONFIG

#define HTTP_SERVER_PORT   80

#endif // CONFIG_H