# Current shaped-board DDR routing

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
