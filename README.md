# G350-style Linux handheld

Custom tscircuit handheld PCB, revision A. A complete Raspberry Pi Zero 2 W is the Linux/GPU host, connected through a **hand-drawn J8 interface and mechanical layout** in `lib/PiZero2W.tsx`. The Pi's proprietary computer circuitry is not recreated here. No complete SBC PCB design is imported.

The four-layer, 100 × 124 mm carrier includes eleven front switches, an MCP23017, a MAX98357A speaker amplifier, a BQ24074 battery charger with load sharing, a TPS61023 5 V boost supply, and a MAX17048 fuel gauge, and an AP2112 3.3 V display regulator. It has no analog sticks or rear buttons. J_LCD faces the left edge for ribbon insertion. Individual active devices, switches, the USB-C connector, and the inductor were imported using `tsci import --use-exact-footprint` from JLCPCB.

This is a G350-inspired custom handheld, **not a replacement PCB that fits the stock G350 shell**. The selected SPI display is 480 × 320 in landscape, rather than the stock G350's 640 × 480 display. The Raspberry Pi provides its CPU, GPU, RAM, Wi-Fi and microSD boot storage.

## Build and checks

The project pins the latest tscircuit version found on 2026-10-02: **0.0.2709**. Always use the local CLI:

```sh
npm ci
npm run typecheck
npx --no-install tsci check netlist index.circuit.tsx
npx --no-install tsci check schematic-placement index.circuit.tsx
npx --no-install tsci check placement index.circuit.tsx
npx --no-install tsci check routing-difficulty index.circuit.tsx
npx --no-install tsci build index.circuit.tsx --autorouter-debug --autorouter-dump-srj all --pcb-png --schematic-png --kicad-project
npx --no-install tsci check shorts dist/index/circuit.json
```

The four copper layers support signal and power routing, with ground pours on top, inner1 and bottom. Routing uses the local tscircuit autorouter with explicit CONTROLS, DISPLAY_AUDIO and POWER phases. The switching-node route, charger exposed-pad ground connection and host-to-gauge I2C clock branch are drawn manually. Check results and release limitations are recorded in `checks/` and `fabrication/STATUS.md`.

`lib/PhasedAutorouter.ts` uses the installed tscircuit package's latest local solver to route the power nets around completed signal phases. Ground returns use filled zones and stitching vias. The helper rejects failed routes; final connectivity and shorts checks qualify the resulting copper. Both assembly sides have three fiducials with copper keepouts around their mask openings. Component reference text is retained in the assembly data; the PCB silk uses clear connector and control labels. The USB connector silk outline is inset from the routed board edge; its imported copper footprint is unchanged.

## Assembly

- Raspberry Pi Zero 2 W with populated GPIO header; use a numbered, straight-through 40-wire GPIO ribbon. Do not use a cable that swaps pin rows. J_PI numbering is interleaved exactly like J8.
- Waveshare **3.5inch Capacitive Touch LCD**, ST7796S + FT6336U, with its **18-pin, 0.5 mm FPC host port**. This is a different product from RPi LCD (G). J_LCD is an imported XUNPU FPC-05F-18PH20 bottom-contact connector (C2856802). Use an 18-conductor, 0.5 mm, 0.3 mm-thick FFC; verify continuity pin 1 to pin 1 before applying power. Cable contact-side selection depends on the module connector orientation; do not infer it from the ribbon color.
- Protected 1S 4.2 V Li-ion/LiPo battery with a **10 kΩ 103AT-2-compatible NTC attached to the cell**. J_BAT pin 1 is battery positive, pin 2 is negative and pin 3 is NTC. NTC returns to battery negative. Unprotected cells and 4.35 V charge-voltage cells are unsuitable.
- 8 Ω speaker rated at least 1 W between J_SPEAKER pins 1 and 2. Both pins are driven; neither is ground.
- External slide switch across J_OFF: closing it disables the boost output. Shut Linux down before moving this switch to OFF.
- Hand-fit the through-hole harness headers. Imported SMD components may be assembled by JLCPCB subject to availability. Verify the supplier's placement viewer, rotations and polarity before submitting an assembly order.

The LCD needs at least 4 mm clearance above the component side. The rear Pi mounting pattern is 58 × 23 mm, with four 2.75 mm holes. Use a GPIO ribbon and sufficient rear standoff height to clear connectors; **the enclosure and antenna performance require a physical fit check**. Keep battery wiring short and use wire rated for at least 3 A.

## Display ribbon

The selected module is 92.44 × 61 mm in landscape, with a 480 × 320 active display. The carrier width is 100 mm to accommodate it. Its host supply is a separate 3.3 V rail from AP2112; this keeps the module's input logic and I2C pull-ups at Pi-compatible levels. Typical manufacturer-stated module current is about 63 mA; the LDO dissipates about 0.11 W at that load. This does not qualify the enclosure's thermal behavior.

| J_LCD FPC pin | Module signal | Pi BCM GPIO / connection |
|---|---|---|
| 1 | VCC | V_LCD3V3, 3.3 V only |
| 2 | LCD_BL | 23 |
| 3 | GND | GND |
| 4 | SCLK | 11 |
| 5 | MOSI | 10 |
| 6 | MISO | 9 |
| 7 | LCD_D/C | 22 |
| 8 | LCD_RST | 27 |
| 9 | LCD_CS | 8 |
| 10 | SD_CS | 3.3 V, unused card deselected |
| 11 | NC | Open |
| 12 | TP_RST | 24 |
| 13 | TP_SCL | 3 / shared I2C |
| 14 | TP_SDA | 2 / shared I2C |
| 15 | TP_INT | 25 |
| 16–18 | NC | Open |
| Connector anchors | Mechanical shell | GND |

Do not use a stock display setup that assigns backlight to GPIO18: this design uses GPIO18 for I2S BCLK. Install a display driver supporting ST7796S and the above custom pin assignments. FT6336U touch shares the I2C bus at address 0x38; the button and battery daemon does not implement touch. Display and touch driver bring-up have not been tested on hardware. The module's microSD slot is not used; boot storage remains on the Pi.

## Linux interfaces

Enable I2C and I2S on the Pi. MCP23017 uses address `0x20`, MAX17048 uses `0x36`. Pi J8 already provides I2C pull-ups to 3.3 V. `software/handheld.py` provides a Linux uinput gamepad from the eleven front controls; it also reads battery voltage and charge state. Run it as a system service only after initial bring-up. Do not enable a competing kernel MCP23017 driver while using this daemon.

I2S: GPIO18 BCLK, GPIO19 LRCLK, GPIO21 data output. GPIO26 enables the amplifier; the amplifier uses its left channel at 6 dB gain. `software/asound.conf` mixes both input channels equally into the left output. Copy it only after identifying the I2S ALSA device on the Pi.

## Power limits and prototype bring-up

USB-C is a 5 V charging input. The two 5.1 kΩ CC resistors are separate. No USB data or PD negotiation is provided. The input limit is 500 mA; charge current is nominally 270 mA, with a nominal 9.07-hour timer. Heavy gameplay can consume more than the USB input supplies, so the battery may discharge while plugged in. Use a dedicated USB-C power source and avoid USB host ports that require enumeration.

The boost target is 4.992 V (0.6 × (1 + 732k/100k)). Begin with a 1 A total 5 V load ceiling, an 8 Ω speaker and restrained volume. Validate regulator ripple, load transients, temperature, charging behavior and battery protection before increasing loads. The fuel gauge is a monitor; the battery pack must provide hardware over-discharge/over-current protection.

Bring up with a current-limited bench supply and no Pi or LCD connected. Check for resistance between rails, verify 5 V and charge current, then test a dummy load and OFF control. Connect the Pi next, verify 3.3 V and I2C addresses, then add display, buttons and speaker. No assembled prototype has been tested.

## References

- [Raspberry Pi Zero 2 W documents](https://pip.raspberrypi.com/categories/584)
- [Waveshare FPC LCD pinout and specifications](https://www.waveshare.com/wiki/3.5inch_Capacitive_Touch_LCD)
- [Waveshare 18-pin host schematic](https://files.waveshare.com/wiki/3.5inch%20Capacitive%20Touch%20LCD/3.5inch_Capacitive_Touch_LCD_Schematic.pdf)
- [AP2112 regulator datasheet](https://www.diodes.com/datasheet/download/AP2112.pdf)
- [BQ24074 datasheet](https://www.ti.com/lit/ds/symlink/bq24074.pdf)
- [TPS61023 datasheet](https://www.ti.com/lit/ds/symlink/tps61023.pdf)
- [MAX98357A datasheet](https://www.analog.com/media/en/technical-documentation/data-sheets/MAX98357A-MAX98357B.pdf)
- [MAX17048 datasheet](https://www.analog.com/media/en/technical-documentation/data-sheets/MAX17048-MAX17049.pdf)
- [MCP23017 datasheet](https://ww1.microchip.com/downloads/en/DeviceDoc/20001952C.pdf)

Original project source is MIT licensed. Vendor component models and drawings retain their respective rights.
