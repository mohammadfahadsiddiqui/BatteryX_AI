#ifndef BATTERYX_TELEMETRY_MANAGER_H
#define BATTERYX_TELEMETRY_MANAGER_H

#include <Arduino.h>
#include "sensor_manager.h"

class TelemetryManager {
public:
    TelemetryManager();
    bool transmit(const SensorReadings& readings);

private:
    String buildJsonPayload(const SensorReadings& readings);
};

#endif
