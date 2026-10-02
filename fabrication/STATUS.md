# Revision B fabrication status — ready for a first PCB prototype

**The Revision B fabrication and top-only assembly files pass the recorded checks and are ready for a first PCB prototype order. No assembled handheld has been tested.** Order the Revision B files listed below; the previous two-sided Revision A files have been replaced.

The 100 × 124 × 1.6 mm, four-layer FR4 carrier uses a complete Raspberry Pi Zero 2 W through a hand-drawn GPIO interface and mounting layout. All 60 carrier components, including hand-fitted headers, are on top. The Pi and display mount above the carrier on insulating hardware; the carrier's back has copper and through-hole solder joints but no component bodies. The Pi's existing microSD holder supplies accessible Linux boot storage. This carrier requires a custom enclosure and is not a stock G350 replacement.

The Waveshare 3.5inch Capacitive Touch LCD connects through an 18-pin, 0.5 mm FPC host connector. Its ST7796S panel is 480 × 320; FT6336U touch shares I2C with the button controller and fuel gauge. The carrier has eleven front controls, an AP2112 3.3 V display supply, BQ24074 charging/load sharing, TPS61023 5 V boost, MAX17048 monitoring and MAX98357A I2S audio. It has no analog sticks or rear buttons.

One USB-C port carries 5 V charging input and USB 2.0 data. The data path includes an imported USBLC6-2SC6 ESD part and a hand-fitted shielded data-only micro-B pigtail to the Pi. **Disconnect and insulate the pigtail's VBUS wire**: the Pi receives boosted 5 V through J8. Follow the README's wiring and continuity checks. The included Linux gadget services select USB500 only after configuration; initial installation and non-enumerating wall chargers remain at USB100. A charged battery is required for initial USB installation. The battery may discharge while playing or installing.

## Recorded checks — 2026-10-02

- Latest versions verified against npm: tscircuit 0.0.2715, tsci 0.1.2220 and capacity-autorouter 0.0.951. TypeScript, source, pin specification, netlist, schematic placement, PCB placement and routing-difficulty checks pass. PCB placement reports one advisory for the inward-facing LCD connector, deliberately oriented toward the internal display ribbon.
- The qualified CONTROLS, POWER and DISPLAY_AUDIO build passes with **zero native errors**. The actual Pipeline 9 phase routes are retained with documented manual clearance corrections and complete-input/version checks; changed inputs invoke the live autorouter. See `routing/README.txt`. All 148 vias are standard full-depth 0.3 mm drill / 0.65 mm outer diameter; no blind/buried vias are used.
- Final all-layer Gerber-mode shorts check: **no shorts detected**.
- Independent KiCad 10.0.5 check after copper-zone refill: **zero reported DRC violations, zero reported warnings and zero unconnected items**. All 157 exact local footprint templates and `fp-lib-table` are included. Library preparation preserved all 1,253 physical board records. There are no per-item DRC exclusions. KiCad's default ignored checks for missing courtyards, via endpoint centering, tuning profiles and two footprint metadata checks remain listed in `checks/kicad-drc.json`; clearance, shorts, manufacturing geometry and connectivity checks remain enabled.
- Actual exported Gerber flashes match all 226 center-based SMT pads. All 215 drill features match position, diameter and slot direction. All 689 exported tracks match circuit geometry, width and layer within 5 µm. Assembly coordinates use the same lower-left plot datum.
- JLCPCB assembly files contain **23 BOM entries and 52 SMD placements, all on top**, with supplier-verified rotations. The bottom paste Gerber has no drawn or flashed paste. The three top fiducials have explicit 2 mm solder-mask openings and no paste. Hand-fitted headers, Pi, display, cables, battery, speaker, switch and mounting hardware are listed in `bom-manual.csv`.
- USB power software simulation passes configuration permissions, all nine GPIO mode transitions, connection/disconnection binding cases, SIGTERM cleanup and Python/shell syntax. Actual USB enumeration, card flashing, suspend timing and charging are untested on hardware.

Native reference-name, unnamed-trace, schematic-sheet, missing-courtyard and width advisories remain recorded. Width advisories include deliberate 0.15 mm signal escapes and short GND contacts inside pads; filled-zone continuity is verified independently. The release requires 0.15 mm minimum track/clearance rules, standard through-vias, 0.45 mm hole separation, 0.2 mm copper-to-drill clearance and 0.5 mm copper-to-board-edge clearance.

## Order settings and files

Select four layers, 100 × 124 mm, 1.6 mm FR4, green solder mask, 1 oz outer copper, standard 0.5 oz inner copper and top-side SMT assembly. Use the supplier's standard stackup and ordinary plated through-vias. Do not request bottom assembly. Confirm the parsed outline/dimensions, part availability, rotations and polarity in the supplier's order and assembly viewers.

- `g350-rev-b-gerbers.zip`: four copper layers, masks, paste, silk, outline and separate plated/non-plated drills.
- `bom-jlcpcb.csv` and `pnp-jlcpcb.csv`: matching top-only SMD assembly files.
- `bom-manual.csv`: remaining hand-fitted and external items; these are needed for a working handheld.
- `kicad/`: independently checked, refilled board, schematic, rules, exact local footprint library and local 3D models.
- `circuit.json`, `circuit.sha256` and `SHA256SUMS`: released circuit and file integrity records.

The tscircuit registry distributes large local STEP models as lossless `.step.gz` files because of its upload limit. Run `npm run restore:models` in the downloaded project before viewing those models or checking the complete manifest. GitHub also includes the original models. Restoration verifies SHA256 values; Gerbers and assembly files are identical in both repositories.

Circuit SHA256: `c16b7eb122e9d6c722a9fe79981c7c3800c5f57502b41e4af49df3184a85ca7d`.

Checked KiCad board SHA256: `1096c2250e4b74e81be5c1aab48c0d05a665ac2f1f51517aae9764d3931ffaa6`.

## Prototype bring-up

Follow the README's current-limited bring-up sequence, beginning without Pi or display connected. Check rails and dummy-load behavior before adding the Pi, then display, controls and audio. Start with a 1 A total 5 V load ceiling, an 8 Ω speaker and restrained volume. Use a protected 1S 4.2 V cell with its specified attached NTC. Verify FFC pin-1/contact mapping and USB pigtail VBUS isolation before applying power.

Display/touch drivers, SPI refresh performance, USB signal integrity and provisioning, power ripple/load transients, charging, thermal behavior, enclosure/stacked-part fit, cable clearance and wireless performance require hardware bring-up. PCB fabrication readiness does not establish that the assembled handheld functions correctly.
