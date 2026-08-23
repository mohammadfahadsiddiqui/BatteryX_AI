#include "wifi_manager.h"
#include "config.h"
#include <WiFi.h>

WiFiManager::WiFiManager() {}

void WiFiManager::begin() {
    Serial.println("[WiFi] Connecting to AP...");
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

bool WiFiManager::isConnected() {
    return (WiFi.status() == WL_CONNECTED);
}

void WiFiManager::maintainConnection() {
    if (!isConnected()) {
        Serial.println("[WiFi] Connection dropped. Reconnecting...");
        WiFi.reconnect();
    }
}

int WiFiManager::getRSSI() {
    return WiFi.RSSI();
}
