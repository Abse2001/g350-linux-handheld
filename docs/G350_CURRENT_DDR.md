# Current shaped-board DDR routing

Latest checked continuation (2026-10-10): use
`experiments/am3352-g350-full-board-protected-layer-replay.circuit.tsx`
and read `cloud/DDR_PROTECTED_LAYER_PROGRESS_2026-10-10.md` plus
`checks/integrated/g350-protected-layer-progress/summary.json`.
Fresh source610 / KiCad621 / Gerber622 retain all217 connections, 49DDR,
298 ground ports, 1,032 numeric ports, 280 placements and824 standard through-vias.
Native physical checks, all-rule DRC errors/warnings, opens, dangling copper and
all-layer shorts are zero. Byte0 passes0.574882 mm; byte1 7.333572 mm and
command/clock9.650328 mm still fail0.635 mm. All differential pairs pass.
Build exit1 is solely those two failures; full qualification exits0.
A9 gains3 mm on Inner2 while its other-layer geometry remains exact. Original
barrels/endpoints, peripheral copper, logical constraints and all pins/guards stay
fixed. Native length includes1.6 mm per transition; electrical timing, stackup,
PDN/footprints, Linux and measured shell fit remain unqualified.
Preserve source591/565/540/532/319, BusLanes bootstrap and all frozen evidence.
Read cloud/LINUX_VALIDATION.md for tested VFS space preflight and Xvfb socket fixes.
Keep fabricationReady=false. The board is not ready to order.

## Previous ascending-group checkpoint (preserved history)

Latest checked continuation (2026-10-10): use
`experiments/am3352-g350-full-board-ascending-group-restored-replay.circuit.tsx`
and read `cloud/DDR_ASCENDING_GROUP_RESTORED_2026-10-10.md` plus
`checks/integrated/g350-ascending-group-restored-progress/summary.json`.
Fresh source 591 / KiCad 592 / Gerber 593 preserve all 217 connections, 49 DDR,
298 ground ports, 1,032 numeric ports, 280 placements and 824 standard through-vias.
Native physical checks, all-rule DRC errors/warnings, opens, dangling copper and
all-layer shorts are zero. Byte0 passes native matching at 0.574882 mm; byte1
7.373572 mm and command/clock 10.350328 mm still fail 0.635 mm. All pairs pass.
Build exit is 1 for exactly those two failures; qualification wrapper exit is 0.
Native length counts 1.6 mm per transition, not electrical delay. The broader
batch586 fails native ground with215 errors and is rolled back. Restoring the
checked A9 route retains other growth and passes complete qualification591–593.
Preserve source565/540/532/319, the BusLanes bootstrap and all frozen evidence.
Further tuning requires complete qualification. Keep fabricationReady=false.

## Previous larger-group checkpoint (preserved history)

Previous checked continuation (2026-10-10): use
`experiments/am3352-g350-full-board-large-group-restored-replay.circuit.tsx`
and read `cloud/DDR_LARGE_GROUP_RESTORED_2026-10-10.md` plus
`checks/integrated/g350-large-group-restored-progress/summary.json`.
Fresh source 565 / KiCad 566 / Gerber 567 preserve all 217 connections, 49 DDR,
298 ground ports, 1,032 numeric ports, 280 placements and 824 standard through-vias.
Native physical checks, all-rule DRC errors/warnings, opens, dangling copper and
all-layer shorts are zero. Byte0 passes native matching at 0.574882 mm; byte1
7.693572 mm and command/clock 11.150328 mm still fail 0.635 mm. All pairs pass.
Build exit is 1 for exactly those two failures; qualification wrapper exit is 0.
Native length counts 1.6 mm per transition, not electrical delay. Keep all
original barrels/endpoints, source540/532/319 and frozen evidence. The A0
shortcut in source560 creates a native self-short and is rejected; source565
restores the entire checked A0 route while retaining accepted growth elsewhere.
Further tuning requires complete qualification. Keep fabricationReady=false.

## Previous constant-neck checkpoint (preserved history)

Previous checked continuation (2026-10-10): use
`experiments/am3352-g350-full-board-constant-neck-timing-replay.circuit.tsx`
and read `cloud/DDR_CONSTANT_NECK_TIMING_2026-10-10.md` plus
`checks/integrated/g350-constant-neck-timing-progress/summary.json`.
Fresh source 540 / KiCad 541 / Gerber 542 preserve all 217 connections, 49 DDR,
298 ground ports, 1,032 numeric ports, 280 placements and 824 standard through-vias.
Native physical checks, all-rule DRC errors/warnings, opens, dangling copper and
all-layer shorts are zero. Byte0 passes native matching at 0.574882 mm; byte1
8.033572 mm and command/clock 12.450328 mm still fail 0.635 mm. All pairs pass.
Build exit is 1 for exactly those two failures; qualification wrapper exit is 0.
Native length counts 1.6 mm per transition; byte0's planar spread is 8 mm with
2–7 transitions. This is not electrical delay qualification. Preserve source532
as a qualified ground-safe fallback, preceding81078ba/ac0dcaf, source319 and all
frozen evidence. Trial497/515 has a ground open and must not be promoted.
Further tuning requires complete qualification. Keep fabricationReady=false.

## Previous connected byte1 checkpoint (preserved history)

Previous checked continuation (2026-10-10): use
`experiments/am3352-g350-full-board-byte1-integrated-clean-replay.circuit.tsx`
and read `cloud/DDR_BYTE1_INTEGRATED_2026-10-10.md` plus
`checks/integrated/g350-integrated-byte1-progress/summary.json`.
Fresh source 468 / KiCad 472 / Gerber 473 preserve all 217 connections, 49 DDR,
298 ground ports, 1,032 numeric ports, 280 placements and 824 standard through-vias.
Native physical checks, all-rule DRC errors/warnings, opens, dangling copper and
all-layer shorts are zero. Byte0 passes native matching at 0.574882 mm; byte1
15.221372 mm and command/clock 24.150328 mm still fail 0.635 mm. All pairs pass.
Build exit is 1 for exactly those two failures; qualification wrapper exit is 0.
Native length counts 1.6 mm per transition; byte0's planar spread is 8 mm with
2–7 transitions. This is not electrical delay qualification. Preserve preceding
ac0dcaf / source 443, source319 and all frozen evidence. Further byte1/command combinations
are unqualified; joint tuner464 and rerouting trials require complete qualification. Keep fabricationReady=false.


## Latest connected inner-layer timing checkpoint (2026-10-10 UTC)

Continue `experiments/am3352-g350-full-board-inner-timing-ground-preserved-replay.circuit.tsx`.
Read `cloud/DDR_INNER_TIMING_CONNECTED_2026-10-10.md` and
`checks/integrated/g350-inner-ground-timing-progress/summary.json`. Fresh source 209,
independent fresh-fill KiCad 210 and Gerber 211 retain 217/217 connections, all 49 DDR
signals, 298 ground ports and 1,032 required numeric ports. All 280 placements, RAM90,
four layers and 824 full-depth vias are preserved. DRC errors/warnings/opens/dangling
copper and shorts are zero. Source/fresh-filled native checks pass except three
bus-skew failures: 19.293662 / 25.185093 / 24.480252 mm versus 0.635 mm. Pairs pass.
The build exits 1 for matching; the qualification wrapper exits 0. The b70590b
checkpoint and frozen evidence remain. Distributed growth trials that broke ground
are rejected; 215 native ground errors reflected the whole-net assertion, while
KiCad identified three stranded pads. Checked outer spans were restored while
retaining inner-layer tuning. Further recovery 212/217/220 is unqualified and must
not replace the checked entry. Preserve native whole-net assertions and runtime pins;
fresh numeric/ground/Gerber checks remain mandatory. Electrical clock/stackup/timing,
PDN, Linux and measured shell fit remain unfinished. Keep fabricationReady false.


## Latest checked DDR shortcuts and runtime (2026-10-09 UTC)

Continue `experiments/am3352-g350-clean-full-board-checked-shortcuts-replay.circuit.tsx`.
Read `cloud/DDR_CHECKED_SHORTCUT_PROGRESS_2026-10-09.md`,
`cloud/RUNTIME_REFRESH_2026-10-09.md` and
`checks/integrated/g350-checked-shortcut-progress/summary.json`. Fresh source 178,
independent refill/export 179 and Gerber 180 retain 217/217 connections, 49 DDR
signals, 280 placements, RAM90, four layers and 824 standard full-depth vias.
DRC errors/warnings, opens, dangling copper and shorts are zero. All native checks
pass except three bus-skew failures: 29.148292 / 33.385093 / 24.480252 mm versus
0.635 mm; differential pairs pass. Only D2/D12/A0 copper changes. Other DDR and
peripheral geometry, logical constraints, pads, placements and vias are preserved.
The new tscircuit 0.0.2803 wrapper is source-tested with unchanged reviewed
Core/CLI/checker/solver pins. The preceding connected 7b08fba checkpoint and frozen
evidence remain. A separate exit-bound final artifact verifier passes; the initial
combined wrapper's exit 1 is retained and explained in the report. GitHub
authentication briefly failed, then recovered; a fresh fetch confirms the same
7b08fba parent. Preserve any newer transfer records before pushing. Matching and electrical
clock/stackup/package/via/impedance/return-path qualification remain unfinished.
Keep fabricationReady false. Older sections describe preserved checkpoints.

## Latest checked DDR bend progress (2026-10-09)

Continue `experiments/am3352-g350-clean-full-board-bend-timing-replay.circuit.tsx`.
Read `cloud/DDR_BEND_TIMING_PROGRESS_2026-10-09.md` and
`checks/integrated/g350-bend-timing-progress/summary.json`. Fresh source 166,
independent refill/export 167 and isolated Gerber 168 retain 217/217 connections,
49 DDR signals, all 280 placements, RAM90 and four layers. DRC errors/warnings,
opens, dangling copper and shorts are zero. All native checks pass except three
bus-skew failures: 30.621477 / 34.678381 / 24.692716 mm versus 0.635 mm.
Differential pairs pass. Non-DDR copper geometry, logical constraints and all
824 standard through-vias are unchanged; derived pour annotations renumber.
The preceding connected checkpoint and all new trials are hash-indexed and
retained. Runtime/checker/solver pins stay fixed. Whole-bus matching is unfinished;
target DDR clock and manufacturer stackup are still needed for electrical timing.
Keep fabricationReady false. Older sections describe preserved checkpoints.

The editable default reexports `experiments/am3352-g350-byte0-complete-bus.circuit.tsx`. It retains all 280 placed parts on the provisional 76 × 118 × 1.6 mm outline and four copper layers. The CPU is AM3352BZCZ100; memory is MT41K256M16TW-107:P, x16, 512 MiB. Original-shell fit and fabrication release remain unverified.

The first complete byte has eleven connected signals: D0–D7, DQM0 and DQS0/DQSn0. Seven data carriers originated in a saved native `bus_lanes` partial solution; the remaining two carriers and length repairs are manual. This is not a successful native solve of all nine data carriers. Native bootstrap waypoints remain in order. The source restores the complete eleven-member byte bus and permits Top/Bottom signal routing; the two inner layers remain GND and DDR power references.

The complete-bus self-short check exposed a D3 tuning bend too near its incoming diagonal. Its tuning section was moved down 0.2 mm without changing planar length. The RAM via's 4.4e-16 mm coordinate roundoff was also normalized to zero, removing a microscopic reversed handoff segment inserted during replay. No check was disabled. The fresh source has zero native physical errors; its 818 open-port and 108 missing-trace errors remain.

| Current scoped check | Result |
|---|---|
| Numeric CPU/RAM signal connectivity | 11 / 49; 38 open |
| Whole byte0 planar skew | 0.207792 mm; limit 0.635 mm |
| DQS0 pair planar skew | Approximately zero; limit 0.127 mm |
| Package ground/DDR power connectivity | All 101 terminals through 97 physical vias |
| Total copper | 112 traces, 119 standard through-vias, two continuous filled reference planes |
| All-layer Gerber shorts | Zero |
| Independent physical copper/drill errors | Zero |
| Presentation / unfinished board | 403 silkscreen warnings; 499 reported KiCad opens, possibly capped |

The source-bound evidence is `checks/integrated/g350-byte0-complete-bus/check-summary.json`. Its independent board, reports, checker snapshots and Top/Bottom renders are in the same directory. `core-upgrade-and-bus-check.json` verifies the latest-core source preserves every other non-metadata record outside the reviewed D3 repair. The native run is frozen under `dist/g350-current-index-byte0-handoff-fixed`.

Registry versions checked on 2026-10-05: tscircuit 0.0.2744, core 0.0.2088, props 0.0.687, checks 0.0.239, tsci CLI 0.1.2237 and capacity-autorouter 0.0.958. Both dependency locks are synchronized. The checked via-pad and zero-length-contact fixes remain enabled in checks 0.0.239.

Use the local CLI. A fresh selected-phase rebuild is:

```sh
node_modules/.bin/tsci build index.circuit.tsx --disable-parts-engine --autorouter-phase G350_BYTE0_MATCHED --autorouter-timeout 180s
npm run check:shorts
npm run check:memory-connectivity
```

The first command still exits with whole-board unfinished-connection errors. The full memory check still fails on 38 open signals. Only the selected routing phase and the checks in the table pass; these commands do not approve the complete board. The default source-freshness gate compares all non-metadata records to the independently checked source before running shorts checks.

## Next routing work

Byte1 has eleven signals, command/clock has 26, and reset has one. `experiments/am3352-g350-byte1-bootstrap.circuit.tsx` adds a native `bus_lanes` phase with all 119 fixed through-vias explicitly reserved. A rectangular computational search region is used for that diagnostic only; accepted routes must be replayed on the actual shaped outline and rechecked.

The initial byte1 phase failed local dogbone assignment. A separate 22-endpoint dogbone diagnostic and individual-port solves identify all eleven RAM and three CPU local escapes as unresolved. Individual successful escapes are not combined or qualified routes. `checks/integrated/g350-ddr-bootstrap/byte1-package-access-findings.json` records the evidence. Review the actual blocking copper/pads before choosing extended fanouts or changing fixed power-via reservations; do not weaken the manufacturing rules to force a result.

Complete DDR electrical timing, package/via delay, class spacing, stackup impedance, return paths and bypass loops remain unqualified. The remainder of the handheld needs power/peripheral routing, Linux bring-up, footprint/stencil qualification, silkscreen cleanup and measured original-shell geometry. Nothing from this update has been pushed or released for ordering.

The [tscircuit DDR guide](https://docs.tscircuit.com/guides/routing-ddr) describes separate fanouts, byte buses and phased bus-lane routing. Its example geometry is illustrative; the current board's checks and constraints use the reviewed TI and fabrication requirements recorded in this project.

## Rotated-RAM timing repair (2026-10-06)

Continue `experiments/am3352-g350-ram90-three-pairs-safe-replay.circuit.tsx`
from `cloud/DDR_TIMING_REPAIR_2026-10-06.md`. Its fresh editable source retains
49/49 DDR connectivity and all 280 component placements. All three differential
pairs pass; native skew failures decreased from six to three whole-bus failures.
Native physical checks, all-layer shorts, manufacturing clearance and independent
KiCad connectivity pass. The default and the prior 49/49 evidence remain frozen.
Power/reference copper, peripheral routing, electrical timing and shell fit remain
unfinished. `fabricationReady` is false. The earlier three-pairs entry without
`safe` was rejected for manufacturing clearance and must not be promoted.

## DDR native skew cleared (2026-10-06)

The latest checked continuation is
`experiments/am3352-g350-ram90-zero-skew-replay.circuit.tsx`.
Read `cloud/DDR_ZERO_SKEW_2026-10-06.md` and
`checks/integrated/g350-ram90-zero-skew/summary.json`.
Fresh editable-source replay has 49/49 DDR connections, zero native length/skew
violations, zero physical/manufacturing errors and zero all-layer shorts.
Independent KiCad verifies all 49 connections with no ignored checks/exclusions.
All 280 placements, RAM at 90 degrees and four layers are retained; about 60% of
planar DDR copper uses Inner1/Inner2. Native pair bootstrap and checked manual
repairs are archived. The old default and all older evidence remain frozen.
This clears the native skew milestone, not full electrical timing or fabrication:
power/reference copper, nominal/package/via timing, impedance/return paths,
peripherals, Linux and measured original-shell fit remain unqualified.
`fabricationReady` stays false. Continue this newest checked entry; older timing
sections describe preserved historical checkpoints.
