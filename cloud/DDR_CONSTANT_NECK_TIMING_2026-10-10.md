# Connected G350 with improved DDR matching and RAM ground neck

Continue `experiments/am3352-g350-full-board-constant-neck-timing-replay.circuit.tsx`.
Fresh source 540, KiCad 541 and Gerber 542 qualify the latest improvement.
All 217 connections, 49 DDR signals, 298 ground ports and 1,032 numeric ports
remain connected. All 280 placements, RAM90, four layers and 824 standard
full-depth 0.4572/0.254 mm vias are preserved. Native physical/manufacturing
checks, all-rule KiCad errors/warnings/opens/dangling copper and all-layer
Gerber shorts are zero, without ignored rules or exclusions. Wrapper exit is 0.

| Group | Previous native spread mm | Current mm | Limit mm |
| --- | ---: | ---: | ---: |
| Byte 0 | 0.574882 | 0.574882 | 0.635 |
| Byte 1 | 15.221372 | 8.033572 | 0.635 |
| Command/clock | 24.150328 | 12.450328 | 0.635 |

Byte0 and all three differential pairs pass (pairs: 0.127 mm). Two whole buses
remain unmatched. Source build exits 1 solely for those two failures; all three
routing phases finish, definitions remain unchanged, and no timeout or signal
is hidden. Actual source build elapsed 482.003 seconds.

Joint growth and block translation retain 0.7 mm of additional D9 length.
The earlier source497/CAD515 exposed two stranded RAM ground pads (92/94),
despite passing native ground fill. That result is rejected. A conservative
same-layer bridge and standard via search found no usable ground connection.
Restoring one BA1 span qualifies source532 as a fallback, but loses 7.2 mm of
matching. The new repair moves one BA1 top bend by 0.09118 mm while preserving
its 41.352033 mm native length. No vias, endpoints, pads, placement, peripheral
copper or logical constraints change. Direct CAD538 and the complete fresh
source540/CAD541/Gerber542 independently confirm the ground connection.

The isolated ground-fill worker owns a fresh Manifold heap for each fill;
normal/isolated outputs match exactly, and a known disconnected-ground control
still fails (215 errors). It does not change pinned solvers or assertions.
Optional contiguous-bend translation runs the same full physical and ground
checks. Failed proposals and the Manifold abort remain preserved; they are not
successful iterations. The CAD diagnostic ignores only derived endpoint pour
ownership annotations, retaining strict numeric endpoint and copper guards.

Native length counts 1.6 mm per transition, not electrical delay. Byte0 planar
spread is 8.000 mm (2–7 transitions), byte1 5.011838 mm (2–6), command/clock
8.511354 mm (2–6). Source-bound `layer-lengths.json` records actual per-layer
geometry. Target clock, stackup/dielectrics, package/via/stub delays, impedance,
coupling and return paths remain unqualified. PDN/footprints, Linux bring-up
and measured shell fit also remain unfinished. **fabricationReady=false; do not order.**

Summary: `checks/integrated/g350-constant-neck-timing-progress/summary.json`.

```bash
source cloud/env.sh
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-constant-neck-timing-progress/connected-source-539-542-manifest.json
```

Preserve the checked source532 fallback and all previous source468/443/319 and
frozen KiCad10 evidence. Planning archives under integrated-byte1-progress and
integrated-ground-safe-progress preserve trials, model geometry and compressed
original bytes; do not restore their large histories during ordinary startup.

Source SHA256: `906b46891ca2e47d927a5c643f2443868ed7ca156b63ef0a9f012fa0dc0e6c27`.
Fresh-filled SHA256: `44cf9e8e71bff61766e2452adfe7f73272bea428358a8010af91ffaed88951e7`.

The450-member archive verifies and passes fresh/repeat/in-place restoration,
refusing to overwrite an edited member. The exact refreshed Start commands
exit0, including all frozen files, pinned upstream/runtime checks, official
KiCad archive checksum/version/pcbnew APIs and geometry controls. Runtime
logs are hash-indexed in runtime-validation-544. See LINUX_VALIDATION.md for
the reversible low-disk wrapper changes; Install19 remains unchanged. Saved
connection observations are in TIMING_CONNECTION_OBSERVED_2026-10-10.json.
The refreshed draft requires user publication; no new-task restore is claimed.
