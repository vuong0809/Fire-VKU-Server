#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <DHT_U.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <LoRa.h>
#include "SharpGP2Y10.h"

DynamicJsonDocument data(100);

long frequency = 433E6; // LoRa Frequency
int csPin = 10;         // LoRa radio chip select
int resetPin = 9;       // LoRa radio reset
int irqPin = 2;         // change for your board; must be a hardware interrupt pin

byte localAddress = 0xFF; // address of this device
byte destination = 0xBB;  // destination to send
byte msgCount = 0;        // count of outgoing messages

int voPin = A0;
int ledPin = 4;
SharpGP2Y10 dustSensor(voPin, ledPin);

int pin_AL = 5;

#define DHTPIN 3
#define DHTTYPE DHT21
DHT_Unified dht(DHTPIN, DHTTYPE);

void setup()
{
  Serial.begin(9600);
  pinMode(pin_AL, OUTPUT);
  digitalWrite(pin_AL, 0);
  dht.begin();
  while (!Serial)
    ;
  LoRa.setPins(csPin, resetPin, irqPin);
  if (!LoRa.begin(frequency))
  {
    Serial.println("LoRa init failed. Check your connections.");
    while (true)
      ;
  }
  Serial.println("LoRa init succeeded.");
  LoRa.onReceive(onReceive);
  LoRa.onTxDone(onTxDone);
  LoRa_rxMode();
}

void loop()
{
  delay(2000);
  read_sensor();
}

void read_sensor()
{
  float temp, humi, mois, smoke;
  mois = 0.26;
  sensors_event_t event;
  dht.temperature().getEvent(&event);
  if (!isnan(event.temperature))
  {
    temp = event.temperature;
  }

  dht.humidity().getEvent(&event);
  if (!isnan(event.relative_humidity))
  {
    humi = event.relative_humidity;
  }
  smoke = dustSensor.getDustDensity();

  data["event_name"] = "sensor-value";
  data["body"][0] = temp;
  data["body"][1] = humi;
  data["body"][2] = mois;
  data["body"][3] = round(smoke);

  String dataJson;
  serializeJson(data, dataJson);
  Serial.println(dataJson);

  LoRa_sendMessage(dataJson);
}

void LoRa_rxMode()
{
  LoRa.enableInvertIQ(); // active invert I and Q signals
  LoRa.receive();        // set receive mode
}

void LoRa_txMode()
{
  LoRa.idle();            // set standby mode
  LoRa.disableInvertIQ(); // normal mode
}

void LoRa_sendMessage(String message)
{
  LoRa_txMode();                // set tx mode
  LoRa.beginPacket();           // start packet
  LoRa.write(destination);      // add destination address
  LoRa.write(localAddress);     // add sender address
  LoRa.write(msgCount);         // add message ID
  LoRa.write(message.length()); // add payload length
  LoRa.print(message);          // add payload
  LoRa.endPacket(true);         // finish packet and send it
  msgCount++;
}

void onReceive(int packetSize)
{
  digitalWrite(3, 1);
  if (packetSize == 0)
    return;                          // if there's no packet, return
                                     // read packet header bytes:
  int recipient = LoRa.read();       // recipient address
  byte sender = LoRa.read();         // sender address
  byte incomingMsgId = LoRa.read();  // incoming msg ID
  byte incomingLength = LoRa.read(); // incoming msg length

  String message = "";
  while (LoRa.available())
  {
    message += (char)LoRa.read();
  }
  if (incomingLength != message.length())
  { // check length for error
    Serial.println("error: message length does not match length");
    return; // skip rest of function
  }
  if (recipient != localAddress && recipient != localAddress)
  {
    Serial.println("This message is not for me.");
    return; // skip rest of function
  }
  Serial.println("Received from: 0x" + String(sender, HEX));
  Serial.println("Sent to: 0x" + String(recipient, HEX));
  Serial.println("Message ID: " + String(incomingMsgId));
  Serial.println("Message length: " + String(incomingLength));
  Serial.println("Message: " + message);
  Serial.println("RSSI: " + String(LoRa.packetRssi()));
  Serial.println("Snr: " + String(LoRa.packetSnr()));
  Serial.println();

  DynamicJsonDocument requires(500);
  deserializeJson(requires, message);

  String A_l = requires["body"]["alarm"];
  int Al = A_l.toInt();
  digitalWrite(pin_AL, Al);
}

void onTxDone()
{
  Serial.println("TxDone");
  LoRa_rxMode();
}

boolean runEvery(unsigned long interval)
{
  static unsigned long previousMillis = 0;
  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval)
  {
    previousMillis = currentMillis;
    return true;
  }
  return false;
}

String getValue(String data, char separator, int index)
{
  int found = 0;
  int strIndex[] = {0, -1};
  int maxIndex = data.length() - 1;
  for (int i = 0; i <= maxIndex && found <= index; i++)
  {
    if (data.charAt(i) == separator || i == maxIndex)
    {
      found++;
      strIndex[0] = strIndex[1] + 1;
      strIndex[1] = (i == maxIndex) ? i + 1 : i;
    }
  }
  return found > index ? data.substring(strIndex[0], strIndex[1]) : "";
}
