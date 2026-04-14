#ifndef TYPES_H
#define TYPES_H

#include <stdint.h>
#include <Arduino.h>

// RUNTIME CONFIG STRUCTURE

struct RuntimeConfig {
    char target_ip[16];
    uint16_t ping_interval_ms;
    uint16_t max_duration_sec;
    uint16_t max_pps;
    uint16_t port_scan_start;
    uint16_t port_scan_end;
    bool enabled;
};

// ATTACK STATE STRUCTURE

struct AttackState {
    bool active;
    char attack_type[16];       // "ping_flood", "port_scan", "syn_flood", "arp_storm"
    uint32_t packets_sent;
    uint32_t start_time_ms;
    uint16_t current_interval;
    char target[16];
};

// STATUS RESPONSE STRUCTURE

struct StatusResponse {
    char status[16];            // "idle", "running", "error"
    char attack_type[16];
    bool attack_running;
    uint32_t packets_sent;
    uint32_t uptime_sec;
    char ip_address[16];
    int8_t wifi_rssi;
};

// LED STATE ENUM

enum LEDMode {
    LED_IDLE,           // Slow blink (1s interval) - waiting
    LED_CONNECTING,     // Fast blink (100ms) - WiFi connecting
    LED_ATTACKING,      // Very fast blink (50ms) - attack active
    LED_ERROR,          // Solid on - error occurred
    LED_SUCCESS         // Double blink - success
};

#endif // TYPES_H
