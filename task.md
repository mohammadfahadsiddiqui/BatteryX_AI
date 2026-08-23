# BatteryX AI v3.0 — Task Tracker

## Phase 1 — Backend: New API Routers
- [x] hardware.py
- [x] telemetry.py
- [x] diagnostics.py
- [x] alerts.py
- [x] lifecycle.py
- [x] fleet.py
- [x] bms.py

## Phase 2 — Backend: WebSocket
- [x] websocket/manager.py
- [x] main.py update (register routers + WS endpoint)

## Phase 3 — Backend: Demo Generator
- [x] services/demo/generator.py (11 scenarios)

## Phase 4 — Backend: Certificate Enhancement
- [x] certificates.py (listing + revoke + public verify)

## Phase 5 — BMS/CAN Adapter Architecture
- [x] services/bms/adapter_base.py
- [x] services/bms/generic_can_adapter.py
- [x] services/bms/telemetry_normalizer.py
- [x] services/bms/fault_decoder.py

## Phase 6 — Frontend: Types
- [x] types/index.ts (expanded)

## Phase 7 — Frontend: Services
- [x] services/api.ts (expanded to 12 namespaces)
- [x] services/websocket.ts (reconnection + heartbeat)

## Phase 8 — Frontend: Components
- [x] components/ui/DataSourceBadge.tsx
- [x] components/ui/StatusBadge.tsx
- [x] components/ui/LiveIndicator.tsx
- [x] components/charts/LiveChart.tsx
- [x] components/charts/CellVoltageGrid.tsx
- [x] components/ui/AlertBanner.tsx

## Phase 9 — Frontend: New Pages
- [x] pages/LiveMonitorPage.tsx
- [x] pages/hardware/HardwareCenterPage.tsx
- [x] pages/hardware/HardwareDeviceDetailPage.tsx
- [x] pages/diagnostics/DiagnosticsPage.tsx
- [x] pages/diagnostics/NewDiagnosticPage.tsx
- [x] pages/bms/BMSManagerPage.tsx
- [x] pages/alerts/AlertsPage.tsx
- [x] pages/lifecycle/LifecyclePage.tsx
- [x] pages/fleet/FleetPage.tsx
- [x] pages/certificates/CertificatesPage.tsx
- [x] pages/ai/AIIntelligencePage.tsx
- [x] pages/maintenance/MaintenancePage.tsx
- [x] pages/batteries/BatteryComparisonPage.tsx

## Phase 10 — Frontend: Sidebar + Routes
- [x] AppLayout.tsx (expanded sidebar)
- [x] App.tsx (all 12 new routes registered)

## Phase 11 — Frontend: Battery Details & Dashboard Enhancement
- [x] BatteryDetailsPage.tsx (extended tabs & shortcuts)
- [x] DashboardPage.tsx (quick actions & live links)

## Phase 12 — ESP32 Reference Firmware
- [x] firmware/platformio.ini
- [x] firmware/README.md
- [x] firmware/config_example.h
- [x] firmware/main/config.h
- [x] firmware/main/main.cpp
- [x] firmware/main/sensor_manager.h/.cpp
- [x] firmware/main/telemetry_manager.h/.cpp
- [x] firmware/main/wifi_manager.h/.cpp
- [x] firmware/payload_examples/telemetry.json
