#ifndef BATTERYX_SENSOR_MANAGER_H
#define BATTERYX_SENSOR_MANAGER_H

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_INA219.h>
#include <OneWire.h>
#include <DallasTemperature.h>

struct SensorReadings {
    float voltage_v;
    float current_a;
    float temperature_c;
    float power_w;
    bool valid;
};

class SensorManager {
public:
    SensorManager();
    void begin();
    SensorReadings readAll();

private:
    float readVoltage();
    float readCurrent();
    float readTemperature();

    Adafruit_INA219 ina219;
    OneWire oneWire;
    DallasTemperature sensors;
};

#endif // BATTERYX_SENSOR_MANAGER_H
