#ifndef BATTERYX_WIFI_MANAGER_H
#define BATTERYX_WIFI_MANAGER_H

#include <Arduino.h>

class WiFiManager {
public:
    WiFiManager();
    void begin();
    bool isConnected();
    void maintainConnection();
    int getRSSI();
};

#endif
