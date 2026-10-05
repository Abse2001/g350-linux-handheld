# Current shaped-board DDR routing

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
