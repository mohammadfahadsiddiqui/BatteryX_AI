/**
 * BatteryX AI – ESP32 Firmware Configuration Template
 * Copy this file to firmware/main/config.h and update with your network credentials.
 */

#ifndef BATTERYX_CONFIG_H
#define BATTERYX_CONFIG_H

// ── Wi-Fi Configuration ───────────────────────────────────────────────────────
#define WIFI_SSID       "YOUR_WIFI_SSID"
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"

// ── BatteryX API Endpoint ─────────────────────────────────────────────────────
#define SERVER_HOST     "http://192.168.1.100:8000"
#define TELEMETRY_URL   SERVER_HOST "/api/v1/telemetry"
#define AUTH_URL        SERVER_HOST "/api/v1/hardware/devices/authenticate"

// ── Hardware Identification ───────────────────────────────────────────────────
#define DEVICE_ID       "ESP32-LAB-NODE-01"
#define BATTERY_ID      "BX-2026-00124"
#define FIRMWARE_VER    "v3.0.0-esp32"

// ── Sampling & Telemetry Rates ────────────────────────────────────────────────
#define TELEMETRY_INTERVAL_MS   1000     // 1 Hz transmission interval
#define SENSOR_SAMPLE_INTERVAL  100      // 10 Hz internal oversampling

// ── Sensor Pin Definitions (Low Voltage Bench Setup Only) ─────────────────────
#define PIN_DS18B20_ONEWIRE     4        // GPIO4 for Dallas temperature bus
#define PIN_VOLTAGE_DIVIDER     34       // ADC1 CH6 (Analog voltage sense)
#define PIN_STATUS_LED          2        // On-board blue LED indicator
#define PIN_I2C_SDA             21       // Default ESP32 I2C SDA
#define PIN_I2C_SCL             22       // Default ESP32 I2C SCL

// ── Calibration Constants (Bench Divider: 100k / 10k ratio) ───────────────────
#define VOLTAGE_DIVIDER_RATIO   11.0f
#define ADC_REF_VOLTAGE         3.3f
#define ADC_RESOLUTION          4095.0f

#endif // BATTERYX_CONFIG_H
