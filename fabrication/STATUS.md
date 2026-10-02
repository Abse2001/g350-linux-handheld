# Revision A validation status

Work in progress. **Do not order this revision yet.**

Updated on 2026-10-02. The selected display is Waveshare 3.5inch Capacitive Touch LCD with an 18-pin, 0.5 mm FPC host connector. The 100 × 124 mm carrier includes an AP2112 3.3 V display supply and a hand-drawn interface to a complete Pi Zero 2 W.

The design uses tscircuit 0.0.2711 and explicit CONTROLS, POWER and DISPLAY_AUDIO autorouting phases. Manual routes provide critical power/bypass connections, Pi/button-controller supplies, wide amplifier/boost input feeds, USB and battery feeds, display supply/select/reset connections, charger status and setting escapes, the battery thermistor connection, amplifier enable connections, fuel-gauge I2C branches and the I2S clocks/data. Both inner layers are ground planes. The eleven controls use GPA0–GPA6 and GPB0–GPB3; the MCP23017 output-only GPA7/GPB7 pins stay unconnected.

The complete route is still being qualified. Previous complete candidates had clearance/connectivity violations; newer candidates have needed additional routing corrections. The current manual copper geometry passes independent KiCad checks, but that does not qualify the full board. No production Gerbers or assembly release are approved. The exporter blocks ordering files until the full three-phase build, all-layer Gerber shorts check, independent KiCad connectivity/DRC and supplier assembly checks pass.

No assembled prototype has been tested. Display/touch drivers, SPI refresh performance, regulator behavior under load, FFC contact orientation, enclosure fit and wireless performance require hardware bring-up. Qualified release files and their circuit hash will be recorded here only after all fabrication gates pass.
