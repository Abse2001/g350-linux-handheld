# Integrated AM3352 host — 2026-10-02

The user selected **AM3352** and accepted CPU rendering for simple games. The computer must be built from individual chips on the handheld PCB. Both assembly sides and both outer routing layers are allowed. The required controls are eleven front buttons, no analog sticks and no rear buttons. The display needs an FPC connector, storage needs an onboard microSD holder, and a single USB-C connector must support charging and data/provisioning.

## Current parts

| Function | Part | JLCPCB part | Verified scope |
|---|---|---|---|
| Linux processor | AM3352BZCZ100, 1 GHz Cortex-A8, 324-ball ZCZ | C468247 | tsci import; all primary ball functions, 0.8 mm grid and 0.4 mm nominal lands checked |
| RAM | MT41K256M16TW-107:P, 4 Gb x16 DDR3L, 96-ball TW | C253882 | tsci import; full primary ball map, 0.8 mm grid and 0.42 mm nominal lands checked |
| PMIC candidate | TPS65217CRSLR | C116081 | Individual tsci import and TI AM335x sequencing/variant review; footprint and complete implementation pending |
| microSD candidate | SOFNG TF-013 | C444917 | Existing individual import; actual geometry and switch behavior still need qualification |

The memory is **512 MB**, single rank, with A0–A14. AM3352 DDR_A15 is unused with this part. Micron documents DDR3L compatibility at VDD=VDDQ=1.5 V ±0.075 V; the AM3352 DDR domain must be powered separately from its other supplies. The selected DDR3L part's higher speed grade does not raise the AM3352 controller's supported limit.

Supplier libraries are component sources, not an implementation specification. Corrections are recorded with original and corrected import hashes in `lib/am3352/*-ball-map.json`. All 420 balls remain in the circuit and routing obstacle set. Numeric pin selectors avoid ambiguous RAM aliases such as ball A3 versus address A3.

## Native DDR bootstrap

Read [tscircuit's DDR routing guide](https://docs.tscircuit.com/guides/routing-ddr). The public `bus_lanes` preset creates local dogbones for direct pad connections, connects each bus without intermediate vias, includes planar fanout lengths in matching, and couples declared differential pairs. It requires compatible endpoint layers. When it cannot route, adjust package placement, fanout directions, layers and available corridor space; add explicit manual escapes when needed.

The active fixture is `experiments/am3352-ddr-clearance-bootstrap.circuit.tsx`. It has 49 traces, byte0 and byte1 buses (11 signals each), a combined command/clock timing group (26 signals), and asynchronous reset. TI's 25 mil intra-byte/class and 5 mil differential planar skew limits are configured as 0.635 and 0.127 mm. The active trial requests a 0.12 mm differential gap; other trials use 0.127 mm. Both remain provisional until the exact stackup establishes the required impedance.

The proposed eight-layer allocation is Top/local signal, L2/GND, L3/byte0, L4/GND, L5/command+clock, L6/DDR1V5, L7/byte1, and Bottom/general. It uses through-vias rather than HDI. No reference planes or powered nets are in the current signal-only fixture. All three signal regions need continuous adjacent references on the final board; verify plane transitions, decoupling and DDR keepout. TI requires no cuts in the relevant reference region and specified routing/impedance limits. Nominal geometry is not a stackup approval.

The current best diagnostic contains the exact native first-byte routes from attempt 10: **11/49 connected signals**, **22 full-depth vias**, **0 all-layer Gerber shorts**, **0 KiCad physical violations**, and passing first-byte/DQS0 planar skew. The other 38 signals are open. The native second-phase timeout remains in the diagnostic Circuit JSON. The 0.35/0.15 mm dogbone construction removed 31 drill-clearance errors seen with the original 0.30/0.15 mm vias; it is still an unqualified fabrication process. See `AM3352_DDR_ROUTING.md` and `checks/integrated/am3352-clearance-11-check-summary.json`.

## PMIC investigation

TI's TPS65217C sequencing guide specifically addresses AM335x ZCZ. Default rails are DCDC1=1.5 V for DDR, DCDC2=1.1 V for MPU, DCDC3=1.1 V for core, LDO1=1.8 V for VDDS/RTC, LDO3/LS1=1.8 V for PLL/analog/SRAM and LDO4/LS2=3.3 V for appropriate high-voltage I/O/USB analog domains. The default MPU voltage does not qualify 1 GHz operation; firmware must select a supported voltage/OPP. Every CPU domain and decoupling requirement needs its own verified connection.

PGOOD drives CPU PWRONRSTn, LDO_PGOOD drives RTC_PWRONRSTn and PMIC_PWR_EN controls PWR_EN. PMIC nRESET is a shutdown input, not a CPU reset output. INT_LDO and BYPASS are internal bias nodes and cannot power external loads. The C variant does not support RTC-only mode. Its integrated charger is limited to 700 mA, and the three bucks to 1.2 A each; the complete handheld power and thermal budget remains to be calculated. This part is imported but not wired into the active fixture.

## Shared USB-C and Linux provisioning

AM3352 provides USB2.0 interfaces and a boot ROM; one USB-C connector can carry USB0 data and input power for a charger/power path. The circuit needs correct CC sink termination, VBUS sensing, ESD protection, differential routing, battery protection and control of reverse current. Charger/PMIC choice and integration remain unfinished.

An onboard microSD socket is required. A USB-loaded installer or a running Linux USB gadget can write that storage, but boot ROM support alone does not implement an SD installer. The boot straps, reset/recovery control, compatible SPL/U-Boot DDR configuration, installer and Linux device tree must be designed and tested for this board. Historical Pi/Rockchip flashing commands do not apply.

## Release state

`design-status.json` has `fabricationReady: false`. The active fixture omits PMIC/power sequencing, all CPU voltage domains and decoupling, VREF/VTP/ZQ/clock termination, oscillator/reset/boot straps, storage, USB, FPC display, controls and audio. It cannot boot Linux. The next release evidence is the complete powered circuit, fully routed copper, all-layer Gerber shorts, independent connectivity/DRC, stackup-aware DDR/USB qualification, matching Gerbers/drills/BOM/CPL and tested bring-up/provisioning instructions.

Historical RK3566 experiments are retained in `RK3566_HOST_RECORD.md` and `RK3566_MEMORY_EXPERIMENTS.md`. Their partial-route passes are not AM3352 evidence. Revision B is an external Pi carrier and its order files do not satisfy this integrated architecture.

## Primary sources

- [TI AM3352 product](https://www.ti.com/product/AM3352) and [SPRS717L datasheet](https://www.ti.com/lit/ds/symlink/am3352.pdf): ZCZ functions pp15–17, DDR3 routing pp170–188, ZCZ lands p261.
- [Micron selected-part datasheet](https://www.lcsc.com/datasheet/C253882.pdf): 4Gb_DDR3L Rev Q 12/17, voltage p1, x16 map p17, TW package p27.
- [tscircuit DDR guide](https://docs.tscircuit.com/guides/routing-ddr): native `bus_lanes`, fanouts, timing groups and verification.
- [TI TPS65217 datasheet](https://www.ti.com/lit/ds/symlink/tps65217.pdf), SLVSB64I, and [AM335x sequencing guide](https://www.ti.com/lit/ug/slvu551i/slvu551i.pdf), SLVU551I: candidate rails, reset connections, variant and charger limits. Full circuit and thermal qualification pending.
