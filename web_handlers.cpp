/**
 * web_handlers.cpp — обработчики HTTP и регистрация маршрутов.
 */
#ifdef WEB_SERVER

#include <Arduino.h>
#include <WebServer.h>
#include "config.h"
#include "mavlink_state.h"
#include "servo_stub.h"
#include "web_handlers.h"

static WebServer* s_server = nullptr;
extern Servo servo;
extern bool servoAttached;

static void sendJson(const String& s) {
    if (s_server) s_server->send(200, F("application/json"), s);
}

static void sendHtml(const String& html) {
    if (s_server) s_server->send(200, F("text/html; charset=utf-8"), html);
}

static void handleRoot() {
    sendHtml(F(
        "<!DOCTYPE html><html><head><meta charset='utf-8'><title>ESP32-S3-Box</title></head><body>"
        "<h1>ESP32-S3-Box Bridge</h1>"
        "<p><a href='/led/on'>LED Вкл</a> | <a href='/led/off'>LED Выкл</a></p>"
        "<p>Сервопривод: <a href='/servo?angle=0'>0°</a> <a href='/servo?angle=90'>90°</a> <a href='/servo?angle=180'>180°</a></p>"
        "<h2>MAVLink</h2>"
        "<p><a href='/api/status'>Статус (подключение, параметры, лог)</a> | "
        "<a href='/params'>Параметры SERVO</a> | <a href='/api/log'>Лог пакетов</a></p>"
        "<p><a href='/status'>Общий статус (JSON)</a></p></body></html>"
    ));
}

static void handleLedOn() {
    digitalWrite(LED_PIN, HIGH);
    if (s_server) s_server->send(200, F("text/plain"), F("OK"));
}

static void handleLedOff() {
    digitalWrite(LED_PIN, LOW);
    if (s_server) s_server->send(200, F("text/plain"), F("OK"));
}

static void handleServo() {
    if (!s_server->hasArg(F("angle"))) {
        if (s_server) s_server->send(400, F("text/plain"), F("?angle=0..180"));
        return;
    }
    int angle = constrain(s_server->arg(F("angle")).toInt(), 0, 180);
    if (!servoAttached) {
        servo.setPeriodHertz(50);
        servo.attach(SERVO_PIN, 500, 2400);
        servoAttached = true;
    }
    servo.write(angle);
    if (s_server) s_server->send(200, F("text/plain"), String(angle));
}

static void handleStatus() {
    String s;
    s += F("{\"heap\":"); s += ESP.getFreeHeap();
    s += F(",\"uptime\":"); s += (millis() / 1000);
    s += F(",\"mavlink_connected\":"); s += mavlinkConnected ? F("true") : F("false");
    s += F(",\"packets_rx\":"); s += mavlinkPacketsRx;
    s += F(",\"packets_tx\":"); s += mavlinkPacketsTx;
    s += F("}");
    sendJson(s);
}

static void handleApiStatus() {
    String s;
    s += F("{\"connected\":"); s += mavlinkConnected ? F("true") : F("false");
    s += F(",\"last_heartbeat_ms\":"); s += lastHeartbeatMs;
    s += F(",\"packets_rx\":"); s += mavlinkPacketsRx;
    s += F(",\"packets_tx\":"); s += mavlinkPacketsTx;
    s += F(",\"SERVO1_REVERS\":"); s += paramServo1Revers;
    s += F(",\"SERVO1_REVERS_known\":"); s += paramServo1ReversKnown ? F("true") : F("false");
    s += F(",\"SERVO3_TRIM\":"); s += paramServo3Trim;
    s += F(",\"SERVO3_TRIM_known\":"); s += paramServo3TrimKnown ? F("true") : F("false");
    s += F(",\"SERVO4_TRIM\":"); s += paramServo4Trim;
    s += F(",\"SERVO4_TRIM_known\":"); s += paramServo4TrimKnown ? F("true") : F("false");
    s += F(",\"log\":[");
    for (uint8_t n = 0, i = 0; n < MAVLINK_LOG_SIZE; n++) {
        uint8_t idx = (mavlinkLogHead + n) % MAVLINK_LOG_SIZE;
        if (mavlinkLog[idx][0] != '\0') {
            if (i++) s += ',';
            s += '"'; s += mavlinkLog[idx]; s += '"';
        }
    }
    s += F("]}");
    sendJson(s);
}

static void handleParamsPage() {
    String html = F(
        "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Параметры SERVO</title>"
        "<style>body{font-family:sans-serif;margin:1rem;} table{border-collapse:collapse;} th,td{border:1px solid #ccc;padding:6px;} .ok{color:green;} .no{color:red;}</style>"
        "</head><body><h1>Параметры MAVLink (SERVO)</h1>"
        "<p id='conn'></p>"
        "<p><button type='button' onclick=\"var x=new XMLHttpRequest();x.open('GET','/api/param_request');x.send();setTimeout(load,500);\">Запросить с автопилота</button></p>"
        "<form method='post' action='/api/params'>"
        "<table><tr><th>Параметр</th><th>Значение</th><th>Получен</th></tr>"
        "<tr><td>SERVO1_REVERS</td><td><input name='SERVO1_REVERS' id='v1' type='number' step='0.01'></td><td id='k1'>—</td></tr>"
        "<tr><td>SERVO3_TRIM</td><td><input name='SERVO3_TRIM' id='v2' type='number' step='0.01'></td><td id='k2'>—</td></tr>"
        "<tr><td>SERVO4_TRIM</td><td><input name='SERVO4_TRIM' id='v3' type='number' step='0.01'></td><td id='k3'>—</td></tr>"
        "</table><button type='submit'>Установить</button></form>"
        "<p><a href='/'>Назад</a> | <a href='/api/status'>Статус JSON</a> | <a href='/api/log'>Лог</a></p>"
        "<script>"
        "function load(){ var x=new XMLHttpRequest(); x.open('GET','/api/status'); x.onload=function(){"
        "var j=JSON.parse(x.responseText);"
        "document.getElementById('conn').innerHTML='Подключение: '+(j.connected?'<span class=ok>Да</span>':'<span class=no>Нет</span>')+' | RX: '+j.packets_rx+' TX: '+j.packets_tx;"
        "document.getElementById('v1').value=j.SERVO1_REVERS; document.getElementById('v2').value=j.SERVO3_TRIM; document.getElementById('v3').value=j.SERVO4_TRIM;"
        "document.getElementById('k1').textContent=j.SERVO1_REVERS_known?'да':'—'; document.getElementById('k2').textContent=j.SERVO3_TRIM_known?'да':'—'; document.getElementById('k3').textContent=j.SERVO4_TRIM_known?'да':'—';"
        "}; x.send(); }"
        "load(); setInterval(load,3000);"
        "</script></body></html>"
    );
    sendHtml(html);
}

static void handleParamsGet() {
    String s;
    s += F("{\"SERVO1_REVERS\":"); s += paramServo1Revers; s += F(",\"SERVO1_REVERS_known\":"); s += paramServo1ReversKnown ? F("true") : F("false");
    s += F(",\"SERVO3_TRIM\":"); s += paramServo3Trim; s += F(",\"SERVO3_TRIM_known\":"); s += paramServo3TrimKnown ? F("true") : F("false");
    s += F(",\"SERVO4_TRIM\":"); s += paramServo4Trim; s += F(",\"SERVO4_TRIM_known\":"); s += paramServo4TrimKnown ? F("true") : F("false");
    s += F("}");
    sendJson(s);
}

static void handleParamsSet() {
    bool sent = false;
    if (s_server->hasArg(F("SERVO1_REVERS"))) {
        mavlinkSendParamSet("SERVO1_REVERS", s_server->arg(F("SERVO1_REVERS")).toFloat());
        sent = true;
    }
    if (s_server->hasArg(F("SERVO3_TRIM"))) {
        mavlinkSendParamSet("SERVO3_TRIM", s_server->arg(F("SERVO3_TRIM")).toFloat());
        sent = true;
    }
    if (s_server->hasArg(F("SERVO4_TRIM"))) {
        mavlinkSendParamSet("SERVO4_TRIM", s_server->arg(F("SERVO4_TRIM")).toFloat());
        sent = true;
    }
    if (sent)
        sendJson(F("{\"ok\":true}"));
    else if (s_server)
        s_server->send(400, F("application/json"), F("{\"ok\":false,\"error\":\"need SERVO1_REVERS, SERVO3_TRIM or SERVO4_TRIM\"}"));
}

static void handleParamRequest() {
    mavlinkRequestServoParams();
    sendJson(F("{\"ok\":true}"));
}

static void handleLog() {
    String s = F("[");
    for (uint8_t n = 0, i = 0; n < MAVLINK_LOG_SIZE; n++) {
        uint8_t idx = (mavlinkLogHead + n) % MAVLINK_LOG_SIZE;
        if (mavlinkLog[idx][0] != '\0') {
            if (i++) s += ',';
            s += '"'; s += mavlinkLog[idx]; s += '"';
        }
    }
    s += F("]");
    sendJson(s);
}

void webSetup(WebServer& server) {
    s_server = &server;
    server.on(F("/"), handleRoot);
    server.on(F("/led/on"), handleLedOn);
    server.on(F("/led/off"), handleLedOff);
    server.on(F("/servo"), handleServo);
    server.on(F("/status"), handleStatus);
    server.on(F("/api/status"), handleApiStatus);
    server.on(F("/params"), handleParamsPage);
    server.on(F("/api/params"), HTTP_GET, handleParamsGet);
    server.on(F("/api/params"), HTTP_POST, handleParamsSet);
    server.on(F("/api/param_request"), handleParamRequest);
    server.on(F("/api/log"), handleLog);
    server.begin();
}

#endif /* WEB_SERVER */
