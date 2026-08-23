#include "telemetry_manager.h"
#include "config.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

TelemetryManager::TelemetryManager() {}

String TelemetryManager::buildJsonPayload(const SensorReadings& r) {
    JsonDocument doc;
    doc["device_id"] = DEVICE_ID;
    doc["battery_id"] = BATTERY_ID;
    doc["voltage_v"] = r.voltage_v;
    doc["current_a"] = r.current_a;
    doc["power_w"] = r.power_w;
    doc["temperature_c"] = r.temperature_c;
    doc["source"] = "esp32";
    doc["firmware_version"] = FIRMWARE_VER;
    doc["is_demo"] = false;

    String output;
    serializeJson(doc, output);
    return output;
}

bool TelemetryManager::transmit(const SensorReadings& r) {
    if (WiFi.status() != WL_CONNECTED) return false;

    HTTPClient http;
    http.begin(TELEMETRY_URL);
    http.addHeader("Content-Type", "application/json");

    String payload = buildJsonPayload(r);
    int httpCode = http.POST(payload);

    bool success = (httpCode >= 200 && httpCode < 300);
    if (!success) {
        Serial.printf("[Telemetry] POST failed with code %d: %s\n", httpCode, http.getString().c_str());
    }

    http.end();
    return success;
}
