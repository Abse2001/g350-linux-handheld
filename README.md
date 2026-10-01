# G350-style Linux handheld

Custom tscircuit handheld PCB, revision A. A complete Raspberry Pi Zero 2 W is the Linux/GPU host, connected through a **hand-drawn J8 interface and mechanical layout** in `lib/PiZero2W.tsx`. The Pi's proprietary computer circuitry is not recreated here. No complete SBC PCB design is imported.

The four-layer, 86 × 124 mm carrier includes eleven front switches, an MCP23017, a MAX98357A speaker amplifier, a BQ24074 battery charger with load sharing, a TPS61023 5 V boost supply, and a MAX17048 fuel gauge. It has no analog sticks or rear buttons. Individual active devices, switches, the USB-C connector, and the inductor were imported using `tsci import --use-exact-footprint` from JLCPCB.

This is a G350-inspired custom handheld, **not a replacement PCB that fits the stock G350 shell**. The selected SPI display is 480 × 320 in landscape, rather than the stock G350's 640 × 480 display. The Raspberry Pi provides its CPU, GPU, RAM, Wi-Fi and microSD boot storage.

## Build and checks

The project pins the latest tscircuit version found on 2026-10-01: **0.0.2706**. Always use the local CLI:

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

The stack is top signal/components, inner1 ground, inner2 signal/power and bottom signal/components. Routing uses the local autorouter with explicit POWER, DISPLAY_AUDIO and CONTROLS phases. The switching-node route and charger exposed-pad ground connection are drawn manually. The autorouter completes the remaining connections. Check results and release limitations are recorded in `checks/` and `fabrication/STATUS.md`.

## Assembly

- Raspberry Pi Zero 2 W with populated GPIO header; use a numbered, straight-through 40-wire GPIO ribbon. Do not use a cable that swaps pin rows. J_PI numbering is interleaved exactly like J8.
- Waveshare 3.5-inch RPi LCD (G), ST7796S. Connect its 11-wire harness to J_LCD using the pin map below. It requires a custom mount; do not plug its Pi-sized header directly into this board.
- Protected 1S 4.2 V Li-ion/LiPo battery with a **10 kΩ 103AT-2-compatible NTC attached to the cell**. J_BAT pin 1 is battery positive, pin 2 is negative and pin 3 is NTC. NTC returns to battery negative. Unprotected cells and 4.35 V charge-voltage cells are unsuitable.
- 8 Ω speaker rated at least 1 W between J_SPEAKER pins 1 and 2. Both pins are driven; neither is ground.
- External slide switch across J_OFF: closing it disables the boost output. Shut Linux down before moving this switch to OFF.
- Hand-fit the through-hole harness headers. Imported SMD components may be assembled by JLCPCB subject to availability. Verify the supplier's placement viewer, rotations and polarity before submitting an assembly order.

The LCD needs at least 4 mm clearance above the component side. The rear Pi mounting pattern is 58 × 23 mm, with four 2.75 mm holes. Use a GPIO ribbon and sufficient rear standoff height to clear connectors; **the enclosure and antenna performance require a physical fit check**. Keep battery wiring short and use wire rated for at least 3 A.

## Display harness

| J_LCD pin | Display pin / signal | Pi BCM GPIO |
|---|---|---|
| 1 | TP_IRQ, left open | — |
| 2 | TP_CS | 7 |
| 3 | LCD_BL logic control | 23 |
| 4 | LCD_RST | 27 |
| 5 | LCD_DC | 22 |
| 6 | LCD_CS | 8 |
| 7 | SCLK | 11 |
| 8 | MOSI | 10 |
| 9 | MISO | 9 |
| 10 | GND | — |
| 11 | 5 V | — |

Do not use a stock display setup that assigns backlight to GPIO18: this design uses GPIO18 for I2S BCLK. Install a display driver supporting ST7796S and the above custom pin assignments. Display-driver bring-up has not been tested on hardware.

## Linux interfaces

Enable I2C and I2S on the Pi. MCP23017 uses address `0x20`, MAX17048 uses `0x36`. Pi J8 already provides I2C pull-ups to 3.3 V. `software/handheld.py` provides a Linux uinput gamepad from the eleven front controls; it also reads battery voltage and charge state. Run it as a system service only after initial bring-up. Do not enable a competing kernel MCP23017 driver while using this daemon.

I2S: GPIO18 BCLK, GPIO19 LRCLK, GPIO21 data output. GPIO26 enables the amplifier; the amplifier uses its left channel at 6 dB gain. `software/asound.conf` mixes both input channels equally into the left output. Copy it only after identifying the I2S ALSA device on the Pi.

## Power limits and prototype bring-up

USB-C is a 5 V charging input. The two 5.1 kΩ CC resistors are separate. No USB data or PD negotiation is provided. The input limit is 500 mA; charge current is nominally 270 mA, with a nominal 9.07-hour timer. Heavy gameplay can consume more than the USB input supplies, so the battery may discharge while plugged in. Use a dedicated USB-C power source and avoid USB host ports that require enumeration.

The boost target is 4.992 V (0.6 × (1 + 732k/100k)). Begin with a 1 A total 5 V load ceiling, an 8 Ω speaker and restrained volume. Validate regulator ripple, load transients, temperature, charging behavior and battery protection before increasing loads. The fuel gauge is a monitor; the battery pack must provide hardware over-discharge/over-current protection.

Bring up with a current-limited bench supply and no Pi or LCD connected. Check for resistance between rails, verify 5 V and charge current, then test a dummy load and OFF control. Connect the Pi next, verify 3.3 V and I2C addresses, then add display, buttons and speaker. No assembled prototype has been tested.

## References

- [Raspberry Pi Zero 2 W documents](https://pip.raspberrypi.com/categories/584)
- [Waveshare LCD G pinout](https://www.waveshare.com/wiki/3.5inch_RPi_LCD_%28G%29)
- [BQ24074 datasheet](https://www.ti.com/lit/ds/symlink/bq24074.pdf)
- [TPS61023 datasheet](https://www.ti.com/lit/ds/symlink/tps61023.pdf)
- [MAX98357A datasheet](https://www.analog.com/media/en/technical-documentation/data-sheets/MAX98357A-MAX98357B.pdf)
- [MAX17048 datasheet](https://www.analog.com/media/en/technical-documentation/data-sheets/MAX17048-MAX17049.pdf)
- [MCP23017 datasheet](https://ww1.microchip.com/downloads/en/DeviceDoc/20001952C.pdf)

Original project source is MIT licensed. Vendor component models and drawings retain their respective rights.
