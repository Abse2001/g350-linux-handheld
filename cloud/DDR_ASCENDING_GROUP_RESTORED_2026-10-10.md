# Connected G350: further DDR length progress with checked A9 restored

Continue `experiments/am3352-g350-full-board-ascending-group-restored-replay.circuit.tsx`. Fresh source591 / KiCad592 / Gerber593 preserve
217/217 authored connections, all49 DDR, 298 ground ports and1,032 numeric ports.
All280 placements, RAM90, four layers and824 standard full-depth0.4572/0.254 mm
vias are preserved. Original barrels, terminal pads, logical constraints,
placements and peripheral copper remain unchanged. Native physical/manufacturing
checks, all-rule KiCad errors/warnings/opens/dangling copper and all-layer
Gerber shorts are zero. No ignored rules or exclusions. Qualification exits0.

| Group | Previous native spread mm | Current mm | Limit mm |
| --- | ---: | ---: | ---: |
| Byte0 | 0.574882 | 0.574882 | 0.635 |
| Byte1 | 7.693572 | 7.373572 | 0.635 |
| Command/clock | 11.150328 | 10.350328 | 0.635 |

Byte0 and all differential pairs pass (pair limit0.127 mm). Two whole buses
remain unmatched. Build exit1 is solely for those two failures; all three
routing phases complete, definitions remain unchanged, no timeout/signal is
hidden, and elapsed time is460.591 seconds.

Ascending bend-group search575 retains three shortest-signal rounds. The broader
batch586 proposes17 accepted units but fails fresh native ground with215 errors;
it is rolled back and never promoted. Recomposition588 restores the checked A9
route while retaining18 other route changes from that batch. Complete physical
and fresh ground checks pass0. Its BA1 top geometry, including the independently
checked RAM ground neck, is unchanged. Full source591/CAD592/Gerber593 then
independently confirm all217 connections. New work adjusts bends from the
preserved native BusLanes bootstrap; it does not change runtime/checker pins,
the reviewed patch, nominal limits or guard assertions.

Trials576–579 find no clearance-preserving alternate-layer path through the
existing barrels. Larger window combs580/581 reject47,680/45,082 proposals.
Fine-grid four-layer trials582–585 fail self-short/via-spacing checks, find no
path, or produce longer channels; none is retained. D12 shortcut587 gains only
0.001428 mm, below its0.005 mm retention threshold, and exits1. Generator exit0
is never treated as qualification when its result says no accepted candidate.

Native length includes1.6 mm per transition, not electrical delay. Source-bound
`layer-lengths.json` records planar geometry: byte0 spread8 mm (2–7 transitions),
byte1 spread5.011838 mm (2–6), command/clock spread8.485113 mm (2–6). Actual
DDR clock, manufacturer stackup, package/via/stub delay, impedance, coupling,
return paths, PDN/footprints, Linux bring-up and measured shell fit remain
unqualified. **fabricationReady=false; the board is not ready to order.**

Summary: `checks/integrated/g350-ascending-group-restored-progress/summary.json`.
Compiled SHA256: `5ad6e093dccdbcbc5f27902a01030d1fe20db0eae21c3bbb7e5be56473727540`.
Fresh-filled SHA256: `cbd48abb14e647f87424d332cecdaf861ab59aa479a32ed23bca703e92e380ab`.

```bash
source cloud/env.sh
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-ascending-group-restored-progress/connected-source-589-593-manifest.json
```

The450-member checked archive SHA256 is`030bd5ba55e17bf5be68b7016af5f11556ff842499f76a7f8e341d5aa56be9f9`.
Archive verification, fresh/repeated/in-place restoration pass0; edited-file
refusal passes with exit1 and preserves the edit. The first control asserted
the wrong refusal-message text; a fresh complete repeat verifies the actual
preservation behavior. Exact refreshed Start commands pass0, including frozen
25,814 hashes, all eleven upstream/runtime pins, official KiCad archive/version/
pcbnew APIs and four geometry controls. Logs are indexed in runtime-and-recovery-
595-599. Install stays unchanged from tested revision19.

Planning archives575–585 and586–590 retain failed runs, exact executed helpers
and diagnostics. Hash-verified archives plus independent fresh restoration
preserve607,749,921 bytes of redundant generated planning JSON reclaimed for
VFS disk space. Frozen files, live hardware sources and checked fallbacks are
untouched. Recovery indexes590/595 list each original hash and source archive;
do not restore large planning histories during ordinary startup.

Preserve source565/540/532/468/443/319 and frozen KiCad10 evidence. Failed560 A0
and497/515 ground-open trials remain rejected. Saved connection observations
are in ASCENDING_CONNECTION_OBSERVED_2026-10-10.json. Environment draft updates
require publication; current-instance checks do not establish new-task restoration.
