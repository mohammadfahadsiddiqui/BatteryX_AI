#include "sensor_manager.h"
#include "config.h"

SensorManager::SensorManager() : oneWire(PIN_DS18B20_ONEWIRE), sensors(&oneWire) {}

void SensorManager::begin() {
    pinMode(PIN_VOLTAGE_DIVIDER, INPUT);
    analogReadResolution(12); // 12-bit ADC (0-4095)

    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
    
    if (!ina219.begin()) {
        Serial.println("[Sensor] Failed to find INA219 chip");
    }

    sensors.begin();
}

float SensorManager::readVoltage() {
    // Read load voltage from INA219
    float busVoltage = ina219.getBusVoltage_V();
    // Fallback or secondary voltage reading using the voltage divider
    // int raw = analogRead(PIN_VOLTAGE_DIVIDER);
    // float pinVoltage = (raw / ADC_RESOLUTION) * ADC_REF_VOLTAGE;
    // return pinVoltage * VOLTAGE_DIVIDER_RATIO;
    return busVoltage;
}

float SensorManager::readCurrent() {
    // INA219 returns mA, convert to A
    float current_mA = ina219.getCurrent_mA();
    return current_mA / 1000.0f;
}

float SensorManager::readTemperature() {
    sensors.requestTemperatures();
    float temp = sensors.getTempCByIndex(0);
    if (temp == DEVICE_DISCONNECTED_C) {
        return 0.0f; // Sensor not found, return 0 or an error value
    }
    return temp;
}

SensorReadings SensorManager::readAll() {
    SensorReadings r;
    r.voltage_v = readVoltage();
    r.current_a = readCurrent();
    r.temperature_c = readTemperature();
    r.power_w = r.voltage_v * r.current_a;
    r.valid = (r.voltage_v >= 0.0f && r.voltage_v <= 1500.0f);
    return r;
}
