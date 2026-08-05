# Physical Lyova device prototype — procurement pending handoff

**Date:** 2026-08-05  
**Status:** paused pending purchase of starter electronics

## Scope

This checkpoint records the physical Lyova prototype that will later connect to the ManClub application.

The phone remains the planned first head/computer and user-facing screen. The removable module is intended to become the main control center, with commands later routed from the ManClub application to the floor base and future auxiliary devices.

No application code is changed by this checkpoint.

## Approved first hardware direction

- experimental wheeled floor base;
- two existing toy wheel motor-reducer modules, four wheels total;
- ESP32 as the base controller;
- phone-to-ESP32 communication through Bluetooth or Wi-Fi;
- separate motor power control through external drivers;
- temporary flat test chassis before any final Lyova body is built.

The walking dinosaur mechanism is not approved as the main locomotion system. Its mechanics may later be reused for animatronics such as head, ears, mouth or arms.

## Starter electronics to purchase

1. ESP32 DevKit / NodeMCU ESP-32E, 38 pin — 1 pc.
2. BTS7960 IBT-2 motor driver — 2 pcs.
3. LM2596S adjustable DC-DC converter — 1 pc.
4. MB-102 breadboard and Dupont MM/MF/FF wire set — 1 set.
5. DT832-class multimeter with DC current measurement up to 10 A — 1 pc if absent.
6. Inline fuse holder and 5 A fuses — 1 set.
7. Main rocker switch rated at least 5 A — 1 pc.
8. Stranded red/black power wire, JST connectors and screw terminals — 1 set.
9. USB cable matching the selected ESP32 board — 1 pc.

## Not approved for purchase yet

The final battery and charger remain blocked until the existing motors are characterized.

Do not connect the unknown toy motors directly to 7.4 V. Initial tests must begin around 2–3 V with current limiting and proceed in stages only if current and temperature are acceptable.

## Source of truth

Google Sheet: **ManClub — тело Лёвы: комплектующие прототипа**  
https://docs.google.com/spreadsheets/d/1lqUgB46n_xWk9h4tMheLLyh-jEQlqwjpGLMuzIGelkI/edit

Relevant tabs:

- **Имеющиеся детали** — physical inventory and donor toys;
- **Закупка и магазины** — product links, indicative prices, stores and Irkutsk addresses.

Knowledge checkpoint:

- `llobychev/manclub-knowledge/operations/status/2026-08-05-physical-lyova-hardware-procurement-pending-status.md`

## Resume procedure

When Alexey confirms that the parts are purchased:

1. verify the exact ESP32 board and connectors;
2. verify both BTS7960 modules and LM2596 adjustment;
3. test each wheel module with current limiting;
4. record no-load, loaded and stall current;
5. decide motor voltage and final battery architecture;
6. assemble a temporary chassis without the phone;
7. implement manual movement and emergency stop;
8. design the first phone-to-base command protocol;
9. connect the ManClub application only after basic base movement is stable.

## Current completion

- concept and architecture checkpoint: complete;
- donor inventory: complete;
- shopping list and store research: complete;
- component purchase: pending;
- electrical testing: 0%;
- base firmware: 0%;
- ManClub app integration: 0%.
