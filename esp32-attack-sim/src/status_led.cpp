#include "config.h"
#include "types.h"
#include <driver/gpio.h>

// LED STATUS INDICATOR

static const int LED_PIN = 2;  // Built-in LED on most ESP32 boards (GPIO2)

static uint32_t led_last_toggle = 0;
static bool led_state = false;
static LEDMode current_led_mode = LED_IDLE;

void ledInit() {
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);
    led_last_toggle = millis();
}

void ledSetMode(LEDMode mode) {
    current_led_mode = mode;
}

void ledUpdate() {
    uint32_t now = millis();
    uint32_t interval;
    bool solid = false;
    
    switch (current_led_mode) {
        case LED_IDLE:
            interval = 1000;  // 1 second - slow blink
            break;
        case LED_CONNECTING:
            interval = 100;   // 100ms - fast blink
            break;
        case LED_ATTACKING:
            interval = 50;    // 50ms - very fast blink
            break;
        case LED_ERROR:
            solid = true;     // Solid on
            interval = 0;
            break;
        case LED_SUCCESS:
            // Double blink pattern handled separately
            interval = 0;
            return;
    }
    
    if (solid) {
        digitalWrite(LED_PIN, HIGH);
        led_state = true;
        return;
    }
    
    if (now - led_last_toggle > interval) {
        led_state = !led_state;
        digitalWrite(LED_PIN, led_state ? HIGH : LOW);
        led_last_toggle = now;
    }
}

void ledSuccess() {
    // Double blink to indicate success
    for (int i = 0; i < 2; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(100);
        digitalWrite(LED_PIN, LOW);
        delay(100);
    }
}

void ledError() {
    digitalWrite(LED_PIN, HIGH);
}

// Get current LED mode for status reporting
LEDMode ledGetMode() {
    return current_led_mode;
}
