# Revision A fabrication status

**Ready for prototype fabrication. Automated fabrication checks passed on 2026-10-02.** No assembled prototype has been tested.

The 100 × 124 × 1.6 mm, four-layer FR4 carrier uses a complete Raspberry Pi Zero 2 W through a hand-drawn GPIO interface and mounting layout. The selected display is Waveshare 3.5inch Capacitive Touch LCD, with an 18-pin, 0.5 mm FPC host connector. Its ST7796S panel is 480 × 320; FT6336U touch shares I2C with the button controller and fuel gauge. The board includes a separate AP2112 3.3 V display supply, eleven front controls, battery charging/load sharing, a 5 V boost supply and I2S audio. It has no analog sticks or rear buttons. This carrier requires a custom enclosure.

## Recorded checks

- Latest versions verified against npm on 2026-10-02: tscircuit 0.0.2715, tsci 0.1.2220 and capacity-autorouter 0.0.951. TypeScript, source, pin specification, netlist, schematic placement, PCB placement and routing-difficulty checks passed.
- Full CONTROLS, POWER and DISPLAY_AUDIO routing build passed with zero native errors. Manual critical paths and fixed earlier-phase copper are preserved. All 123 vias have standard 0.3 mm drills and 0.65 mm outer diameters through all four copper layers; no blind/buried vias are used.
- Final Gerber-mode shorts check passed on every copper layer: **no shorts detected**.
- Independent KiCad checks, with refilled copper zones: **zero geometry issues and zero unconnected items**. The 141 recorded warnings are exclusively comparisons against the unavailable external `tscircuit` footprint library; the supplier footprints are embedded in the exported board.
- The actual exported Gerber positions match all 217 center-based SMT pads. All 187 drill features match their positions, diameters and slot directions. All 619 exported tracks match their circuit geometry, widths and layers within 5 µm. Assembly coordinates use the same lower-left plot datum.
- JLCPCB assembly data contains 22 BOM entries and 48 components: 39 on top and 9 on bottom, with supplier-verified rotations. Through-hole headers, Pi, display, cables, battery, speaker, switch and mounting hardware are listed separately in `bom-manual.csv`.

Native metadata warnings about reference names, unnamed traces, the schematic sheet and absent courtyards on J_PI and the three testpoints remain recorded in the build log. Width warnings include deliberate 0.15 mm signal escapes and short GND contacts inside pads; physical ground continuity is verified through the filled zones in KiCad. The release enforces 0.15 mm minimum track/clearance rules, standard through-vias, 0.45 mm hole separation, 0.2 mm copper-to-drill clearance and 0.5 mm copper-to-board-edge clearance. Target green solder mask, 1 oz outer and 0.5 oz inner copper.

## Ordering files

- `g350-rev-a-gerbers.zip`: four copper layers, masks, paste, silk, outline and separate plated/non-plated drills.
- `bom-jlcpcb.csv` and `pnp-jlcpcb.csv`: SMD assembly files.
- `bom-manual.csv`: hand-fitted and external items.
- `kicad/`: independently checked, refilled board, schematic, rules and local 3D models.
- `circuit.json`, `circuit.sha256` and `SHA256SUMS`: released circuit and file integrity records.

Circuit SHA256: `c9d54168f7ca03b0a7f376d0a7121c59fb74694853312247e5164e4793d5c2be`.

Checked KiCad board SHA256: `d4c442e840242bfe02c5cc0832b7d02f8dc1cd65d552f2badb18e70116162723`.

## Prototype bring-up

No assembled prototype has been tested. Display/touch drivers, SPI refresh performance, power ripple and load transients, charging behavior, thermal behavior, FFC contact orientation, enclosure fit and wireless performance require hardware bring-up. Follow the current-limited bring-up sequence in the README, beginning without Pi or display connected. Start with a 1 A total 5 V load ceiling, an 8 Ω speaker and restrained volume. Use a protected 1S 4.2 V cell with the specified attached NTC. Confirm the FFC pin-1 mapping and supplier placement viewer before assembly.
