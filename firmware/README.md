# BatteryX AI — ESP32 Edge Sensor Node Reference Architecture

This directory contains the reference firmware, schematic guidelines, and API communication definitions for deploying ESP32 microcontrollers as edge battery telemetry nodes.

---

## Safety Disclaimer & Hardware Interlocks

> [!WARNING]
> **ELECTRICAL SAFETY MANDATE**:
> This reference firmware is strictly intended for **low-voltage lab test setups (<60V DC)**.
> **DO NOT** connect the ESP32 ADC directly to high-voltage EV traction batteries (>60V DC).
> For high-voltage packs, connect the ESP32 via an **isolated CAN transceiver** (e.g. SN65HVD230 / ISO1050) listening to an automotive-grade certified physical BMS.

---

## Architecture Overview

```
[ Battery Pack / BMS ]
        │
    (CAN / ADC / NTC)
        ▼
   [ ESP32 Node ]
        │
   (HTTPS / WSS JSON)
        ▼
[ BatteryX AI Backend ]
        │
   (WebSocket Broadcast)
        ▼
[ React Live Monitor ]
```

---

## Hardware Pinout (Bench Prototype)

| Component | ESP32 Pin | Description |
|---|---|---|
| Voltage Divider Input | GPIO 34 (ADC1_CH6) | Scaled pack potential (0–3.3V max at pin) |
| DS18B20 Temp Bus | GPIO 4 | 1-Wire thermal bus with 4.7kΩ pull-up |
| Status LED | GPIO 2 | Transmission heartbeat indicator |
| Serial Monitor | TX0 / RX0 | 115200 baud diagnostic output |

---

## Getting Started

1. Install [PlatformIO IDE](https://platformio.org/) in VS Code.
2. Copy `config_example.h` to `main/config.h`:
   ```bash
   cp config_example.h main/config.h
   ```
3. Update `WIFI_SSID`, `WIFI_PASSWORD`, and `SERVER_HOST` with your local network settings.
4. Connect ESP32 via USB and build/upload:
   ```bash
   pio run --target upload
   ```
5. Open the serial monitor (`pio device monitor`) to verify registration and transmission.
