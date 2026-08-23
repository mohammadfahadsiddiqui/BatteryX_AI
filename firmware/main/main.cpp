/**
 * BatteryX AI – ESP32 Edge Sensor Node Firmware (v3.0)
 *
 * SAFETY WARNING:
 * This reference firmware is intended for laboratory prototypes and low-voltage test packs (<60V).
 * Do NOT connect directly to high-voltage EV traction packs (>60V) without galvanically isolated
 * differential probes, rated high-voltage contactors, and physical BMS interlocks.
 */

#include <Arduino.h>
#include "config.h"
#include "wifi_manager.h"
#include "sensor_manager.h"
#include "telemetry_manager.h"

WiFiManager wifiManager;
SensorManager sensorManager;
TelemetryManager telemetryManager;

unsigned long lastTelemetryTime = 0;

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n==========================================");
    Serial.println(" BatteryX AI – ESP32 Edge Node v3.0");
    Serial.printf(" Device ID: %s | Target: %s\n", DEVICE_ID, BATTERY_ID);
    Serial.println("==========================================");

    pinMode(PIN_STATUS_LED, OUTPUT);
    digitalWrite(PIN_STATUS_LED, LOW);

    wifiManager.begin();
    sensorManager.begin();
}

void loop() {
    wifiManager.maintainConnection();

    unsigned long now = millis();
    if (now - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
        lastTelemetryTime = now;

        SensorReadings readings = sensorManager.readAll();
        if (readings.valid && wifiManager.isConnected()) {
            digitalWrite(PIN_STATUS_LED, HIGH);
            bool ok = telemetryManager.transmit(readings);
            digitalWrite(PIN_STATUS_LED, LOW);

            if (ok) {
                Serial.printf("[Stream] V: %.2fV | I: %.2fA | T: %.1f°C | P: %.1fW\n",
                    readings.voltage_v, readings.current_a, readings.temperature_c, readings.power_w);
            }
        }
    }

    delay(10);
}
