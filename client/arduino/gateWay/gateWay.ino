#include <SPI.h>
#include <LoRa.h>
#include <ArduinoJson.h>
#include <SoftwareSerial.h>

String cdata, message = "";

long frequency = 433E6;
long spreadingFactor = 7;     // defaults 7, 6 - 12
long signalBandwidth = 125E3; // defaults to 125E3, 7.8E3, 10.4E3, 15.6E3, 20.8E3, 31.25E3, 41.7E3, 62.5E3, 125E3, 250E3, and 500E3.
long codingRateDenominator = 5;
long txPower = 17; // defaults 17 2-20

int csPin = 10;
int resetPin = 9;
int irqPin = 2;

byte localAddress = 0xBB;
byte destination = 0xFF;
int msgCount = 0;

void setup()
{
  for (int i = 14; i < 18; i++)
    pinMode(i, OUTPUT);
  for (int i = 14; i < 18; i++)
  {
    digitalWrite(i, 1);
    delay(200);
  }
  for (int i = 14; i < 18; i++)
  {
    digitalWrite(i, 0);
    delay(200);
  }
  Serial.begin(9600);
  while (!Serial)
    ;
  LoRa.setPins(csPin, resetPin, irqPin);
  if (!LoRa.begin(frequency))
    while (true)
      digitalWrite(17, 1);
  Serial.println("LoRa init succeeded.");
  LoRa.onReceive(onReceive);
  LoRa.onTxDone(onTxDone);
  LoRa_rxMode();
  digitalWrite(14, 1);
}

void loop()
{
  if (Serial.available() > 0)
  {
    char rdata = Serial.read();
    if (rdata == '\n')
    {
      Serial.println(message);

      DynamicJsonDocument requires(500);
      deserializeJson(requires, message);

      String event = requires["event_name"];

      if (event == "fire_position")
      {
        LoRa_sendMessage(message);
      }

      message = "";
    }
    else
      message += rdata;
  }
}

void LoRa_rxMode()
{
  LoRa.disableInvertIQ();
  LoRa.setSpreadingFactor(spreadingFactor);
  LoRa.setSignalBandwidth(signalBandwidth);
  LoRa.setCodingRate4(codingRateDenominator);
  LoRa.receive();
}

void LoRa_txMode()
{
  LoRa.idle();
  LoRa.setTxPower(txPower);
  LoRa.setSpreadingFactor(spreadingFactor);
  LoRa.setSignalBandwidth(signalBandwidth);
  LoRa.setCodingRate4(codingRateDenominator);
  LoRa.enableInvertIQ();
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
  digitalWrite(14, 0);
  if (packetSize == 0)
    return;                          // if there's no packet, return
  byte recipient = LoRa.read();      // recipient address
  byte sender = LoRa.read();         // sender address
  byte incomingMsgId = LoRa.read();  // incoming msg ID
  byte incomingLength = LoRa.read(); // incoming msg length

  String message = "";
  while (LoRa.available())
    message += (char)LoRa.read();
  if (incomingLength != message.length())
    return;
  if (recipient != localAddress && recipient != localAddress)
    return;
//  Serial.println("Received from: 0x" + String(sender, HEX));
//  Serial.println("Sent to: 0x" + String(recipient, HEX));
//  Serial.println("Message ID: " + String(incomingMsgId));
//  Serial.println("Message length: " + String(incomingLength));
//  Serial.println("Message: " + message);
//  Serial.println("RSSI: " + String(LoRa.packetRssi()));
//  Serial.println("Snr: " + String(LoRa.packetSnr()));
//  Serial.println();


  DynamicJsonDocument requires(500);
  deserializeJson(requires, message);
  String event = requires["event_name"];
  if (event == "sensor-value") {
        Serial.println(message);
  }
  
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
