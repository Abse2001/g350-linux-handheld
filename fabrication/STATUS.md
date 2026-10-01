# Revision A validation status

Work in progress. **Do not order this revision yet.**

Updated on 2026-10-02 for the requested flexible display cable: Waveshare 3.5inch Capacitive Touch LCD with an 18-pin, 0.5 mm FPC host connector. The PCB is now 100 × 124 mm and includes a dedicated AP2112 3.3 V display supply. It uses a complete Pi Zero 2 W connected to a hand-drawn GPIO interface.

TypeScript, the electrical netlist, source, pin specifications, PCB placement and schematic placement checks pass for the revised source. Both signal phases have completed without routing errors. Full power routing, all-layer Gerber shorts checking, independent KiCad connectivity/DRC and final supplier assembly export are still being completed. Earlier manual-only shorts results do not qualify the complete board.

No assembled prototype has been tested. The display/touch drivers, regulator behavior under load, FFC contact orientation, enclosure fit and wireless performance require hardware bring-up. Final release files and their circuit hash will be added only after all fabrication gates pass.
