#include "config.h"
#include "types.h"

// EXTERNAL VARIABLES AND FUNCTIONS

// From config_handler.cpp
extern void configInit();
extern void configSave();
extern void configGet(char* json, size_t size);
extern void configUpdateFromJson(const char* json);
extern void configReset();

// From status_led.cpp
extern void ledInit();
extern void ledSetMode(LEDMode mode);
extern void ledUpdate();
extern void ledSuccess();
extern void ledError();

// From ping_flood.cpp
extern void pingFloodStart(uint16_t interval_ms);
extern void pingFloodStop();
extern bool pingFloodIsActive();
extern uint32_t pingFloodGetPacketCount();

// GLOBAL STATE

static AttackState attackState = {
    .active = false,
    .attack_type = "idle",
    .packets_sent = 0,
    .start_time_ms = 0,
    .current_interval = 500,
    .target = ""
};

static uint32_t system_start_time = 0;

// WEB SERVER HANDLERS

#include <WebServer.h>

static WebServer httpServer(HTTP_SERVER_PORT);

// ---------------------------------------------------------------------------
// GET /status - Returns current system status
// ---------------------------------------------------------------------------
void handleStatus() {
    char json[256];
    uint32_t uptime = (millis() - system_start_time) / 1000;
    
    snprintf(json, sizeof(json),
        "{\"status\":\"%s\","
        "\"attack_type\":\"%s\","
        "\"attack_running\":%s,"
        "\"packets_sent\":%u,"
        "\"uptime_sec\":%u,"
        "\"ip_address\":\"%s\","
        "\"wifi_rssi\":%d}",
        attackState.active ? "running" : "idle",
        attackState.attack_type,
        attackState.active ? "true" : "false",
        attackState.packets_sent,
        uptime,
        WiFi.localIP().toString().c_str(),
        WiFi.RSSI()
    );
    
    httpServer.send(200, "application/json", json);
}

// ---------------------------------------------------------------------------
// POST /attack/start - Start an attack
// ---------------------------------------------------------------------------
void handleAttackStart() {
    if (!httpServer.hasArg("plain")) {
        httpServer.send(400, "application/json", "{\"error\":\"No body\"}");
        return;
    }
    
    if (attackState.active) {
        httpServer.send(409, "application/json", "{\"error\":\"Attack already active\"}");
        return;
    }
    
    String body = httpServer.arg("plain");
    
    // Parse attack type from JSON
    char type[32] = "ping_flood";
    uint16_t interval = 0;
    
    // Simple parsing
    if (body.indexOf("\"ping_flood\"") >= 0 || body.indexOf("ping_flood") >= 0) {
        strcpy(type, "ping_flood");
    } else if (body.indexOf("\"port_scan\"") >= 0) {
        strcpy(type, "port_scan");
    } else if (body.indexOf("\"syn_flood\"") >= 0) {
        strcpy(type, "syn_flood");
    } else if (body.indexOf("\"arp_storm\"") >= 0) {
        strcpy(type, "arp_storm");
    }
    
    // Parse interval_ms
    int intervalIdx = body.indexOf("\"interval_ms\"");
    if (intervalIdx >= 0) {
        interval = body.substring(intervalIdx + 14).toInt();
    }
    
    // Start the attack
    if (strcmp(type, "ping_flood") == 0) {
        pingFloodStart(interval);
        strcpy(attackState.attack_type, "ping_flood");
    }
    // TODO: Add other attack types
    
    attackState.active = true;
    attackState.packets_sent = 0;
    attackState.start_time_ms = millis();
    strcpy(attackState.target, configGetTargetIP());
    
    ledSetMode(LED_ATTACKING);
    
    Serial.printf("[HTTP] Attack started: %s\n", type);
    
    char response[128];
    snprintf(response, sizeof(response), 
        "{\"status\":\"started\",\"type\":\"%s\",\"target\":\"%s\"}",
        type, attackState.target);
    httpServer.send(200, "application/json", response);
}

// ---------------------------------------------------------------------------
// POST /attack/stop - Stop current attack
// ---------------------------------------------------------------------------
void handleAttackStop() {
    pingFloodStop();
    // TODO: Stop other attacks
    
    attackState.active = false;
    strcpy(attackState.attack_type, "idle");
    attackState.packets_sent = 0;
    
    ledSetMode(LED_IDLE);
    
    Serial.println("[HTTP] Attack stopped");
    
    httpServer.send(200, "application/json", "{\"status\":\"stopped\"}");
}

// ---------------------------------------------------------------------------
// GET /config - Get current configuration
// ---------------------------------------------------------------------------
void handleConfigGet() {
    char json[512];
    configGet(json, sizeof(json));
    httpServer.send(200, "application/json", json);
}

// ---------------------------------------------------------------------------
// POST /config - Update configuration
// ---------------------------------------------------------------------------
void handleConfigPost() {
    if (!httpServer.hasArg("plain")) {
        httpServer.send(400, "application/json", "{\"error\":\"No body\"}");
        return;
    }
    
    String body = httpServer.arg("plain");
    configUpdateFromJson(body.c_str());
    configSave();
    
    ledSuccess();
    
    httpServer.send(200, "application/json", "{\"status\":\"updated\"}");
}

// ---------------------------------------------------------------------------
// POST /reset - Factory reset
// ---------------------------------------------------------------------------
void handleReset() {
    configReset();
    httpServer.send(200, "application/json", "{\"status\":\"resetting\"}");
    delay(1000);
    ESP.restart();
}

// ---------------------------------------------------------------------------
// 404 Handler
// ---------------------------------------------------------------------------
void handleNotFound() {
    httpServer.send(404, "application/json", "{\"error\":\"Not found\"}");
}

// WIFI CONNECTION

void connectWiFi() {
    ledSetMode(LED_CONNECTING);
    
    Serial.printf("[WiFi] Connecting to %s...\n", WIFI_SSID);
    
    WiFi.mode(WIFI_STA);
    
    // Configure static IP
    IPAddress espIP, espGateway, espSubnet, espDNS;
    espIP.fromString(ESP32_IP);
    espGateway.fromString(ESP32_GATEWAY);
    espSubnet.fromString(ESP32_SUBNET);
    espDNS.fromString(ESP32_DNS);
    
    WiFi.config(espIP, espGateway, espSubnet, espDNS);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    uint32_t startAttempt = millis();
    
    while (WiFi.status() != WL_CONNECTED && 
           millis() - startAttempt < WIFI_TIMEOUT_MS) {
        delay(100);
        Serial.print(".");
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
        Serial.printf("[WiFi] Signal strength: %d dBm\n", WiFi.RSSI());
        ledSetMode(LED_IDLE);
    } else {
        Serial.println("\n[WiFi] Failed to connect!");
        ledSetMode(LED_ERROR);
    }
}

// MAIN SETUP

void setup() {
    // Initialize serial
    Serial.begin(SERIAL_BAUD);
    delay(500);
    
    Serial.println("\n========================================");
    Serial.println("  ESP32 Attack Simulator v1.0");
    Serial.println("========================================\n");
    
    system_start_time = millis();
    
    // Initialize components
    ledInit();
    configInit();
    connectWiFi();
    
    // Setup web server routes
    httpServer.on("/status", HTTP_GET, handleStatus);
    httpServer.on("/attack/start", HTTP_POST, handleAttackStart);
    httpServer.on("/attack/stop", HTTP_POST, handleAttackStop);
    httpServer.on("/config", HTTP_GET, handleConfigGet);
    httpServer.on("/config", HTTP_POST, handleConfigPost);
    httpServer.on("/reset", HTTP_POST, handleReset);
    httpServer.onNotFound(handleNotFound);
    
    httpServer.begin();
    
    Serial.printf("[HTTP] Server started on port %d\n", HTTP_SERVER_PORT);
    Serial.println("\n========================================");
    Serial.println("  Ready! Endpoints:");
    Serial.println("    GET  /status");
    Serial.println("    POST /attack/start");
    Serial.println("    POST /attack/stop");
    Serial.println("    GET  /config");
    Serial.println("    POST /config");
    Serial.println("========================================\n");
}

// MAIN LOOP

void loop() {
    // Handle HTTP requests
    httpServer.handleClient();
    
    // Update LED
    ledUpdate();
    
    // Update attack state packet count
    if (attackState.active) {
        attackState.packets_sent = pingFloodGetPacketCount();
        
        // Check max duration
        uint32_t elapsed = millis() - attackState.start_time_ms;
        if (elapsed > configGetMaxDuration()) {
            Serial.println("[ATTACK] Max duration reached - auto-stopping");
            pingFloodStop();
            attackState.active = false;
            strcpy(attackState.attack_type, "idle");
            ledSetMode(LED_IDLE);
        }
    }
    
    // Small delay to prevent watchdog issues
    delay(1);
}
