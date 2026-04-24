#include "config.h"
#include "types.h"
#include <Preferences.h>

// CONFIGURATION HANDLER - Runtime config via HTTP + Flash storage

static Preferences prefs;

// Default runtime config
static RuntimeConfig runtimeConfig = {
    .target_ip = "192.168.1.100",
    .ping_interval_ms = 500,
    .max_duration_sec = 60,
    .max_pps = 20,
    .port_scan_start = 1,
    .port_scan_end = 100,
    .enabled = true
};

void configInit() {
    prefs.begin("attack-sim", true);  // Read-only mode first
    
    // Load from flash or use defaults
    String ip = prefs.getString("target_ip", "192.168.1.100");
    strncpy(runtimeConfig.target_ip, ip.c_str(), sizeof(runtimeConfig.target_ip) - 1);
    
    runtimeConfig.ping_interval_ms = prefs.getUShort("ping_interval", 500);
    runtimeConfig.max_duration_sec = prefs.getUShort("max_duration", 60);
    runtimeConfig.max_pps = prefs.getUShort("max_pps", 20);
    runtimeConfig.port_scan_start = prefs.getUShort("port_scan_start", 1);
    runtimeConfig.port_scan_end = prefs.getUShort("port_scan_end", 100);
    runtimeConfig.enabled = prefs.getBool("enabled", true);
    
    prefs.end();
    
    Serial.println("[CONFIG] Loaded from flash:");
    Serial.printf("  Target IP: %s\n", runtimeConfig.target_ip);
    Serial.printf("  Ping interval: %d ms\n", runtimeConfig.ping_interval_ms);
    Serial.printf("  Max duration: %d sec\n", runtimeConfig.max_duration_sec);
    Serial.printf("  Max PPS: %d\n", runtimeConfig.max_pps);
}

void configSave() {
    prefs.begin("attack-sim", false);  // Read-write mode
    
    prefs.putString("target_ip", runtimeConfig.target_ip);
    prefs.putUShort("ping_interval", runtimeConfig.ping_interval_ms);
    prefs.putUShort("max_duration", runtimeConfig.max_duration_sec);
    prefs.putUShort("max_pps", runtimeConfig.max_pps);
    prefs.putUShort("port_scan_start", runtimeConfig.port_scan_start);
    prefs.putUShort("port_scan_end", runtimeConfig.port_scan_end);
    prefs.putBool("enabled", runtimeConfig.enabled);
    
    prefs.end();
    
    Serial.println("[CONFIG] Saved to flash");
}

void configReset() {
    prefs.begin("attack-sim", false);
    prefs.clear();
    prefs.end();
    Serial.println("[CONFIG] Flash cleared");
}

void configGet(char* jsonBuffer, size_t bufferSize) {
    snprintf(jsonBuffer, bufferSize,
        "{\"target_ip\":\"%s\","
        "\"ping_interval_ms\":%d,"
        "\"max_duration_sec\":%d,"
        "\"max_pps\":%d,"
        "\"port_scan_start\":%d,"
        "\"port_scan_end\":%d,"
        "\"enabled\":%s}",
        runtimeConfig.target_ip,
        runtimeConfig.ping_interval_ms,
        runtimeConfig.max_duration_sec,
        runtimeConfig.max_pps,
        runtimeConfig.port_scan_start,
        runtimeConfig.port_scan_end,
        runtimeConfig.enabled ? "true" : "false"
    );
}

void configUpdateFromJson(const char* json) {
    // Simple JSON parsing - look for key:value pairs
    // In production, use ArduinoJson library
    
    char key[32];
    char value[32];
    
    // Parse target_ip
    if (extractJsonValue(json, "target_ip", value, sizeof(value))) {
        strncpy(runtimeConfig.target_ip, value, sizeof(runtimeConfig.target_ip) - 1);
    }
    
    // Parse ping_interval_ms
    if (extractJsonValue(json, "ping_interval_ms", value, sizeof(value))) {
        runtimeConfig.ping_interval_ms = atoi(value);
    }
    
    // Parse max_duration_sec
    if (extractJsonValue(json, "max_duration_sec", value, sizeof(value))) {
        runtimeConfig.max_duration_sec = atoi(value);
    }
    
    // Parse max_pps
    if (extractJsonValue(json, "max_pps", value, sizeof(value))) {
        runtimeConfig.max_pps = atoi(value);
    }
    
    // Parse port_scan_start
    if (extractJsonValue(json, "port_scan_start", value, sizeof(value))) {
        runtimeConfig.port_scan_start = atoi(value);
    }
    
    // Parse port_scan_end
    if (extractJsonValue(json, "port_scan_end", value, sizeof(value))) {
        runtimeConfig.port_scan_end = atoi(value);
    }
    
    // Parse enabled
    if (extractJsonValue(json, "enabled", value, sizeof(value))) {
        runtimeConfig.enabled = (strcmp(value, "true") == 0);
    }
}

// Simple JSON value extractor (basic implementation)
bool extractJsonValue(const char* json, const char* key, char* value, size_t valueSize) {
    char searchKey[64];
    snprintf(searchKey, sizeof(searchKey), "\"%s\":", key);
    
    char* found = strstr(json, searchKey);
    if (!found) return false;
    
    found += strlen(searchKey);
    
    // Skip whitespace
    while (*found == ' ' || *found == '\t') found++;
    
    // Check for string value
    if (*found == '"') {
        found++;
        char* end = strchr(found, '"');
        if (end && (size_t)(end - found) < valueSize) {
            strncpy(value, found, end - found);
            value[end - found] = '\0';
            return true;
        }
    }
    // Check for number/boolean value
    else if (*found == '-' || (*found >= '0' && *found <= '9') || *found == 't' || *found == 'f') {
        char* end = found;
        while (*end && *end != ',' && *end != '}' && *end != ' ' && (size_t)(end - found) < valueSize - 1) {
            end++;
        }
        strncpy(value, found, end - found);
        value[end - found] = '\0';
        return true;
    }
    
    return false;
}

// Getters
const char* configGetTargetIP() {
    return runtimeConfig.target_ip;
}

uint16_t configGetPingInterval() {
    return runtimeConfig.ping_interval_ms;
}

uint32_t configGetMaxDuration() {
    return (uint32_t)runtimeConfig.max_duration_sec * 1000;  // Convert to ms
}

uint16_t configGetMaxPPS() {
    return runtimeConfig.max_pps;
}
