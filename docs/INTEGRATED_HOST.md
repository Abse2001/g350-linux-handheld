# Integrated Linux host requirement — 2026-10-02

The handheld must contain the Linux computer directly on its main PCB. The existing Revision B source and Gerbers use an external Raspberry Pi Zero 2 W through J_PI and a data pigtail; they do not meet this requirement. Their successful fabrication checks are not evidence that an integrated host has been designed or checked.

The requested redesign retains top-only component assembly, eleven front buttons, no analog sticks or rear buttons, a display with a flexible-cable connector, a microSD holder on the main PCB, and one USB-C port for charging and data/provisioning. It must be authored in tscircuit with verified component footprints, phased autorouting and manual critical routes. New routing, shorts, independent manufacturing/connectivity checks and matching fabrication exports are required after the architecture changes.

## Exact Pi Zero 2 W silicon

[Raspberry Pi's processor documentation](https://www.raspberrypi.com/documentation/computers/processors.html) identifies RP3A0 as a system-in-package containing BCM2710A1 silicon and 512 MB LPDDR2. The [published Zero 2 W schematic](https://datasheets.raspberrypi.com/rpizero2/raspberry-pi-zero-2-w-reduced-schematics.pdf) is reduced, rather than a complete design package. It does not supply the complete processor power/ground ball map, SD/USB host circuitry, RF design or all implementation constraints needed for a verified clone.

No standard bare-RP3A0 JLCPCB/LCSC part number or complete manufacturer implementation package has been verified in this investigation. This is an unresolved sourcing/documentation condition, not a claim that such a chip could never be used.

The primary author of the [RP3A0 reverse-engineering project](https://github.com/jonny12375/rp3a0) reports a booting bare-chip proof of concept and supplies reconstructed design information. Its documented assembly method harvests and reballs an RP3A0 from a donor Zero 2 W. That is an experimental donor-chip assembly path; it does not establish standard JLCPCB sourcing, equivalent Wi-Fi integration or fabrication readiness for this handheld. The author notes that their prototype has no Wi-Fi.

## Architecture decision

The user's earlier authorization to select another Linux/GPU chip and request to try routing are being applied to a bare RK3566 architecture. This is chip-level integration; no processor module or complete SBC is substituted. The processor and RAM footprints have been imported and real routing experiments are underway. Existing Pi software, device trees and flashing instructions cannot automatically be reused.

[Compute Module Zero](https://www.raspberrypi.com/products/compute-module-zero/) is a documented RP3A0 option that solders directly onto a PCB using castellated pads. It remains a prebuilt module, so it must not be silently substituted for the requested chip-level integration. Its Lite variant exposes SDIO for a carrier microSD holder.

## Selected components and verification scope

| Function | Candidate | JLCPCB part | Evidence / current scope |
|---|---|---|---|
| Linux/GPU SoC | RK3566, FCCSP565 | C2943786 | Imported; 565 ball labels, 67 memory functions and both nominal pitch grids checked against Rockchip documents |
| RAM | H9HCNNN8KUMLHR-NME, 1 GB LPDDR4 | C2912103 | Imported 200-ball footprint; manufacturer single-rank ballout checked; 18 off-grid pad centres corrected |
| PMIC | RK817-5 | C5179490 | All 69 imported pin aliases checked; regulator/charger integration and complete footprint geometry pending |
| CPU buck | RK860-0 | C19188628 | Imported 20-ball footprint; manufacturer functions checked; separate from the RK817's four bucks |
| 24 MHz crystal | SX32Y024000BC1T | C271629 | Imported; drive resistor, feedback and load capacitors must be designed from actual load/parasitics |
| Top microSD | SOFNG TF-013 | C444917 | Imported; signal and shell/contact aliases corrected; full geometry and switch behavior pending |

The RAM has one rank and two 16-bit channels. Hynix A8 is NC, not the second ZQ of some other 200-ball packages. CS1/CKE1 must not be connected. A5 ZQ0 needs its termination to VDDQ; processor DDR_RZQ needs a separate 120-ohm 1% pull-up to the DDR rail. These terminations and power rails are absent from the signal-only fixture.

## Routing experiments

The 67 memory signals are 32 DQ, eight DQS, four DMI/DM, twelve CA, four clock lines, two CKE, two CS, two ODT and reset. Direct routing timed out at 120 seconds during clock/strobe length matching. A longer retry was interrupted during task continuation; process absence was checked before restarting work.

The manual experiment uses 134 full-depth escapes with 0.15mm drills. All 765 pads remain obstacles; components stay on top. The first manual-escape attempt completed clocks/strobes but timed out at 241.5 seconds on its combined 36-signal data group. The byte-group retry completed clocks/strobes but the router rejected an invalid layer jump on DQ4_A. Its aborted final render contains no traces/vias: its no-shorts result does not demonstrate routed connectivity. Later retries use a fresh installed Pipeline 9 solver per phase with earlier copper frozen as obstacles, rejecting missing routes and layer transitions without a represented via. Traversal of an existing same-net via is checked explicitly.

The staggered eight-phase trial routed 39/67 signals, then timed out at 226.8 seconds on channel B's second byte group. That trial's fine-pitch lands subsequently failed the drill-clearance review. Three-signal retries reached the port planner's iteration limit. The current six-layer trial routes the 24 inner-array signals first, then twelve clocks/strobes and 31 individual outer signals: 37 signal phases plus two manual fanout stages. Inner1/Inner4 are reserved for future reference planes. A four-layer routing model maps back to the four physical signal layers because the current solver ignored the bus's allowedLayers. The manufacturing export still describes six layers, with full-depth via obstacles.

The fine-pitch review found 0.30mm lands at 0.40mm pitch left only 0.175mm from a neighboring 0.15mm drill to copper, below the 0.20mm requirement. Twenty-five predefined processor escapes now use 0.25mm lands, nominal-grid drill centres and alternating 10µm offsets within their BGA pads. Other manual escapes and ordinary autorouted vias use 0.30mm lands. The corrected manual geometry passes its independent analytical precheck: 0.200500mm minimum drill-to-foreign-copper and 0.250500mm drill-to-drill. These tight nominal limits still need verification on exported copper and manufacturer review. All-layer shorts, full connectivity and KiCad DRC remain separate checks.

The inner-first run completed 24/67 signals, then stopped on an overly strict same-net via-traversal validator. The validator now accounts for finite trace width. A separate diagnostic export reconstructs the exact saved copper and keeps every native error. Gerber shorts checks and KiCad independently found two real shorts. KiCad also reports drill-clearance violations and 43 unconnected signals; this diagnostic must not be ordered. The KiCad conversion is checked against declared Circuit JSON via diameters and full physical spans, including duplicate route-transition vias.

New autorouted vias are now checked against all six physical layers before a phase is accepted, including other routes in that same phase. The check catches both known shorts and six additional invalid via sites in the old copper. Rejected drill sites become nonconductive local keepouts and the actual autorouter reruns the phase. This does not relax manufacturing rules or invent a passing route. The first completed phases of this retry are recorded in `checks/integrated/phase-via-validation.json`; final Gerber/independent DRC remains required.

Eight bounded local via adjustments and one 10µm wire dogleg repair the actual 24-signal diagnostic. Re-exported Gerber shorts checks find zero shorts. Independent KiCad checks find zero copper/drill clearance errors and retain 43 opens, 91 dangling-via warnings and one silk/edge warning on the incomplete fixture. The default source retains these real Pipeline9 routes only when the complete physical-input fingerprint and package versions match, and rechecks their copper/drill geometry. Other signals still use the live autorouter. Reports: `repaired-check-summary.json`, `repaired-kicad-drc.json`, `repaired-shorts.log`, and `phase-via-validation.json` under `checks/integrated/`.

The clock/strobe retry timed out at 482.2 seconds after rejecting each physically invalid candidate. The next experiment makes only verified full-depth breakout-via terminals accessible on every signal layer; SMT pads stay on top. That retry completes the 12 clock/strobe signals, reaching 36/67 with physical phase checks passing; its actual diagnostic subsequently passes Gerber shorts and independent KiCad copper/drill checks. Manual-via obstacles are circular, matching their actual physical lands/drills.

The fixture has no host power, decoupling, PMIC, crystal, microSD, USB, display, audio or buttons. It cannot boot Linux. A board image or completed signal routes cannot establish a complete computer.

Rockchip's [RK3566 hardware guide](https://dl.xkwy2018.com/downloads/RK3568/RK356X/Hardware/Rockchip_RK3566_Hardware_Design_Guide_V1.1_EN.pdf), section 2.1.9, prohibits LPDDR4 DQ/CA swaps and recommends an approved DDR template or consultation for custom layouts. The manufacturer [RK3568 high-speed guide](https://github.com/hqnicolas/RK3568-hardware-design/blob/main/01_Common%20Document/Rockchip_RK3568_High_Speed_PCB_Design_Guide_V10_EN_2021-4-12.pdf), table 33, is useful supporting information; RK3566-specific package timing and constraints remain unqualified. Its length guidance includes package and electrical via lengths. In-plane lengths alone do not qualify DDR.

## USB-C and Linux provisioning

One USB-C connector can carry USB 2.0 data to RK3566 OTG and supply a charging/power-path circuit. It needs CC sink termination/current handling, ESD protection, VBUS detection, controlled differential routing and protection against backfeeding the computer. The Pi pigtail is removed in the integrated architecture. This integrated USB circuit has not yet been routed.

The onboard microSD holder is selected. Provisioning from a blank/unbootable card needs a documented Maskrom path, a RAM loader compatible with the selected RAM and a tested way to write that card through the same connector. [Radxa's RK3566 USB-tool documentation](https://docs.radxa.com/en/zero/zero3/low-level-dev/rkdeveloptool) does not establish arbitrary storage selection with rkdeveloptool. Do not promise a generic `wl` command flashes this custom board's SD slot. An SD-capable recovery loader or USB-loaded RAM installer remains required.

The seven-signal outer-data phase reached the port planner's iteration limit at 138 seconds. The 36-signal diagnostic is re-exported and passes Gerber shorts and independent KiCad copper/drill checks; 31 opens and incomplete-fixture warnings remain. The latest source retains the six checked phases under their full physical-input fingerprints, then attempts the remaining 31 signals in individual live-autorouting phases.

## Remaining release work

The target remains the complete integrated handheld: power sequencing/decoupling; clock/reset/straps; microSD and USB recovery; FPC display; eleven front buttons and audio; top-only placement; DDR/USB constraints and continuous returns; phased routing/manual critical paths; all-layer shorts and independent DRC/connectivity; matching BOM/CPL/Gerbers/drills; Linux configuration and bring-up instructions. `design-status.json` records the release requirements and blocks the historical fabrication exporter while integration is incomplete.

No integrated-host pinout has been invented, and no integrated-host order bundle is represented as complete.

## Primary reference documents

- [Rockchip RK3566 datasheet Rev1.2](https://wiki.friendlyelec.com/wiki/images/8/89/Rockchip_RK3566_Datasheet_V1.2-20220930.pdf), package drawings and ball table.
- [Hynix RAM datasheet](https://datasheet.lcsc.com/datasheet/pdf/8c6bc79fc4ddd7e4f398b954dcc5c828.pdf?productCode=C2912103), page 6 ballout.
- [Rockchip RK817 datasheet](https://datasheet.lcsc.com/datasheet/pdf/6e7101f379724d9d81189bd12b0f2a10.pdf?productCode=C5179490).
- [Rockchip RK860 datasheet](https://datasheet.lcsc.com/datasheet/pdf/62ee1e0e01dad0c63ac0887e8961f700.pdf?productCode=C19188628), page 4 ball functions and application circuit.
- [SOFNG TF-013 drawing](https://datasheet.lcsc.com/datasheet/pdf/39f1cd9ef11c8e978307af2d313df3b6.pdf?productCode=C444917), page 2 contacts and copper.
- [Radxa Zero 3W V1.12 schematic](https://dl2.radxa.com/zero3/docs/hw/3w/radxa_zero_3w_v1.12_schematic.pdf), independently drawn reference circuitry; no PCB imported.

The individual-phase attempt stopped on DQ0_A after 120.1 seconds. A reviewed explicit trace with six points bypasses that planner stall. Five further explicit traces were generated with a supplementary constant-layer grid search, and DQ4_A uses a grid-planned detour with one added full-depth via. These seven outer phases bring the fixture to **43/67 signals**. The full input fingerprint, endpoint-via checks, layer continuity, physical wire checks and all-layer new-via checks guard every reused coordinate route. The six initial phases still contain actual Pipeline 9 autorouting and subsequent unmatched phases still invoke the live Pipeline 9 solver.

The actual 43-signal diagnostic has zero Gerber shorts and zero independent KiCad copper/drill error violations. Its separate connectivity graph confirms 43 signals; 24 opens and 61 dangling-via warnings remain. Native failure records are preserved in the diagnostic. DQ8_A times out at 134.4 seconds. Bounded single-layer, one-via and two-via grid searches have not found an accepted continuation. No fabrication rules were relaxed. The current source has 37 signal phases plus two manual fanout stages. Reports are `memory-43-check-summary.json`, `memory-43-kicad-drc.json`, `memory-43-phase-validation.json` and `memory-43-connectivity.json` under `checks/integrated/`.

An aborted native render with no copper is never accepted as a shorts/connectivity pass. The fixture remains unpowered and cannot boot Linux; complete DDR timing and return-path qualification remain required even after all signal connectivity is achieved.
