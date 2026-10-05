# G350 bare-panel placement

The new unrouted entry is `experiments/am3352-g350-display-placement.circuit.tsx`. It uses the same **provisional 76 × 118 mm** shaped PCB proposal and preserves the previous 233-component placement study. It adds 42 display/backlight parts; the earlier routed DDR fixtures and default entry are unchanged. The complete handheld layout is not approved for routing or fabrication.

## Selected engineering candidate

The bare **EastRising ER-TFT035-7 with no touch panel** is a 640 × 480 IPS panel with an NV3052C controller, SPI register interface and parallel RGB input. The manufacturer specifies **76.84 × 63.84 × 3.2 mm** with the flex folded, a 54-contact, 0.5 mm pitch bottom-contact connector and 0.3 mm flex. Its unfolded flex extends 55.72 ± 0.5 mm. The display body reservation is centered at (0, 26) mm; the FPC connector is at (0, 44) mm. These are placement proposals. The panel overhangs the proposed PCB by 0.42 mm on each side, and neither its folded cable path nor its height above the front-side components has been verified in the original shell.

Primary manufacturer evidence is saved under `reference/am3352/display/`: the exact panel datasheet, original initialization header/ZIP and recommended connector drawing. Sources: [panel and downloads](https://www.buydisplay.com/ips-3-5-inch-full-viewing-640x480-tft-display-capacitive-touch-screen), [panel datasheet](https://www.buydisplay.com/download/manual/ER-TFT035-7_Datasheet.pdf), [recommended connector drawing](https://www.buydisplay.com/download/connector/ER-CON54HB-1.pdf), [vendor initialization](https://www.buydisplay.com/8051/ER-TFT035-7_Initial_Tutorial.zip).

The locally imported JLCPCB connector is **BOOMELE 0.5-54PFGPZ / C30732**, imported by `tsci import --use-exact-footprint`. It has 54 contacts and two mechanical solder tabs. Its exact manufacturer's land drawing, contact numbering/orientation and mounting-pad treatment still need qualification; the EastRising connector drawing is a reference for mating requirements, not evidence that this different connector has the same land pattern. Pins 55 and 56 are intentionally electrically unconnected for this placement. The native inward-facing FPC warning remains documented; cable insertion is inside the assembly and is not an edge-access connector.

## Reviewed electrical connections

The panel datasheet p10 specifies: pins 1–2 LED cathode, 3–4 LED anode, 8 reset, 9 chip select, 10 serial clock, 11 serial input, 12–19 B0–B7, 20–27 G0–G7, 28–35 R0–R7, 36 HSYNC, 37 VSYNC, 38 pixel clock, 41 IOVCC, 42 VCI, 52 DE and 53–54 ground. Pin 7 is serial output and is unused by the write-only initialization. The unused touch/reserved contacts remain unconnected.

The AM3352 drives native 24-bit RGB. LCD_DATA0–15 use their native ZCZ balls. LCD_DATA16–23 use GPMC_AD15–8 in mux mode 1. **VDDSHV2 at P10/P11 and its three existing bypass capacitors move to IO_3V3 only in this new variant.** The original host supply assignment is preserved in all older entries. CPU-only maximum allocations become 215 mA on ANALOG_1V8 and 280 mA on IO_3V3; IO_3V3 has a 400 mA PMIC limit. The panel's logic current is not specified sufficiently to close the total rail budget, so the remaining 120 mA cannot be called qualified margin.

IOVCC and VCI share IO_3V3 with the LCD I/O bank to avoid independently switching off panel input power while the CPU drives it. Local 100 nF capacitors serve both connector supply contacts, with 1 µF bulk. The initialization interface uses SPI0 clock A17, MOSI B16 and CS1 C15; CS0 remains available for the ROM boot sequence. Reset uses D13 / GPIO3_20 and a 100 kΩ pulldown. CS1 has a 100 kΩ pullup. Backlight PWM uses **C18**, the ZCZ ECAP0_IN_PWM0_OUT ball, with a 100 kΩ pulldown. E18 is its different ZCE-package location and must not be used for this CPU.

Twenty-eight 33 Ω series footprints are included for RGB data, clock, sync and DE. Their value and placement are initial engineering choices. They require review against the final DDR escape corridors, actual CPU-to-resistor route lengths and panel/flex signal integrity before routing is approved. Native `bus_lanes` DDR phases remain in the source, followed by local controls/audio/LCD/backlight phases 7/8/9/10. No routing or fixed vias have been reused after component relocation.

## Backlight

The exact panel has **six series LEDs**, typically 18 V, up to 19.6 V at 20 mA; its operating table gives 15 mA typical and 20 mA maximum. This is different from the earlier unqualified 3 V backlight candidate.

The circuit uses the [TI TPS61165](https://www.ti.com/lit/ds/symlink/tps61165.pdf) from the existing 5 V boost, rather than relying on battery voltage to exceed the driver's 3 V minimum. LEDK connects to FB and the sense resistor, **not directly to ground**. A 15 Ω, 1% resistor sets 13.33 mA nominal; 204 mV / 14.85 Ω gives 13.74 mA with reference and initial resistor tolerances. Adding the resistor's ±100 ppm/°C over the panel's −10 to +60°C range keeps the calculated upper current below 13.8 mA. Sense dissipation is under 3 mW against its 100 mW rating. Brightness is therefore below the supplier's 15 mA operating point; no optical brightness measurement has been made.

| Function | Exact imported part | JLCPCB |
|---|---|---|
| LED boost | TI TPS61165DBVR | C58756 |
| Inductor | TDK VLCF5020T-100M1R1-1, 10 µH | C89448 |
| Rectifier | onsemi MBR0540T1G, 40 V, 0.5 A | C21353 |
| Output capacitor | Samsung CL31B475KBHNNNE, 4.7 µF, 50 V | C51205 |
| Compensation | Samsung CL10B224KA8NNNC, 220 nF, 25 V | C21120 |
| Current sense | UNI-ROYAL 0603WAF150JT5E, 15 Ω, 1% | C22810 |

The 10 µH TDK part is among TI's recommended inductors; [TDK](https://product.tdk.com/en/search/inductor/inductor/smd/info?part_no=VLCF5020T-100M1R1-1) specifies 1.13 A at 30% inductance reduction and 1.5 A at 40°C rise. At a conservatively assumed 70% efficiency, 4.75 V minimum input, 19.6 V LEDs, 13.8 mA, 8 µH minimum inductance and 1.0 MHz minimum switching, estimated average input current is about 83 mA and peak current about 0.33 A. This is a steady-state screening calculation, not measured startup/fault behavior.

The rectifier is TI's recommended type; [onsemi's exact datasheet](https://www.onsemi.com/pdf/datasheet/mbr0540t1-d.pdf) defines cathode pin 1 and anode pin 2. The 40 V rating exceeds the driver's nominal 38 V open-LED threshold, but transient ringing and open-load behavior still require measurement. The 50 V output capacitor must retain **at least 1 µF effective** at operating bias with tolerance, temperature and aging. [Samsung's exact product data](https://product.samsungsem.com/cn/mlcc/CL31B475KBHNNN.do) confirms the part's nominal rating; effective capacitance is not yet qualified. The JLC import's inductor pads also differ from the dimensions expressed in [TDK's recommended land drawing](https://product.tdk.com/system/files/dam/doc/product/inductor/inductor/smd/catalog/inductor_commercial_power_vlcf5020-1_en.pdf); the land pattern must be visually reconciled before release. A successful individual import is not footprint approval.

## Software and prototype checks remaining

Preserve the original vendor initialization header. It uses 9-bit SPI command/data words and 100 ms reset delays. Its page-1 register 0x3A is a VCOM setting, not the page-0 COLMOD register. The existing [Linux NV3052C driver](https://github.com/torvalds/linux/blob/master/drivers/gpu/drm/panel/panel-newvision-nv3052c.c) has other panel-specific tables and does not establish support for this exact EastRising panel. A specific panel description, initialization, timings, clock edge and tilcdc pixel/color format must be implemented and tested.

Before prototype fabrication: verify the connector drawing and numbering; folded flex and component-height clearance; panel power/current and startup/reset sequencing; backlight output capacitor under bias; inductor land pattern; final placement around DDR; all remaining harness/contact mechanics; then complete routing and independent checks. Prototype bring-up must measure reset/supply order, RGB timing and color patterns, backlight current ≤20 mA over input/temperature, open-panel shutdown/ringing and regulator temperature. Original-shell fit and fabrication readiness remain false.
