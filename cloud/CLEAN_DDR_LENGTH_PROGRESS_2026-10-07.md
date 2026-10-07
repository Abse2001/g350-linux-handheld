# Whole-board length progress with zero DRC and shorts — 2026-10-07

Continue `experiments/am3352-g350-clean-full-board-length-progress-replay.circuit.tsx`.
Read `cloud/RUNTIME_REFRESH_2026-10-07.md` for the tested current registry runtime.
The new DDR replay cache is `lib/am3352/placement/g350-clean-full-board-length-progress-paths.json`;
the verified non-DDR cleanup cache remains unchanged. Native bus_lanes bootstrap
and all prior source/evidence are retained. No check or constraint was disabled.

The complete board still has 217/217 checked connections, all 49 DDR signals,
280 component placements, RAM at 90 degrees and four copper layers. There are
824 standard full-depth 0.4572/0.254 mm vias. D12's shorter path removes one via
and 3.190746 mm of native length; six further signals receive checked length
extensions. Source definitions, numeric pin mappings and non-DDR copper are
preserved. The provisional 76 × 118 × 1.6 mm outline remains unqualified for
measured original-shell fit. `fabricationReady` stays false.

| Bus | Previous skew | New checked skew | Limit |
|---|---:|---:|---:|
| Byte0 | 34.878647 mm | 34.278647 mm | 0.635 mm |
| Byte1 | 41.191260 mm | 37.400514 mm | 0.635 mm |
| Command/clock | 29.576845 mm | 28.530389 mm | 0.635 mm |

All three differential pairs remain matched and pass 0.127 mm. Native lengths
include the checker's fixed 1.6 mm allowance per via. Full electrical timing
needs the final target clock, manufacturer stackup, package/via delay, impedance,
class spacing, coupling, reference/return paths and power qualification; these
are not established by geometric matching or a zero-DRC export.

## Binding checks

Fresh source replay 123 completed in 522.039340 seconds without a timeout or
changed definitions. All three routing phases finished with zero phase errors.
The complete build exits 1 solely for the three remaining DDR bus-skew errors.
Full native checks on both fresh source and its exact independently filled
reconstruction have zero other errors, including source widths, contiguity,
dangling branches, placement and strict via/track manufacturing clearance.

Independent export/refill 129 checks every physical pad of all 1,032 required
numeric ports, including multipart lands and 298 ground ports. All 217 routing
connections pass. KiCad 10.0.6 reports zero errors, warnings and unconnected items;
no rule is ignored and no DRC exclusion exists. All-layer Gerber check 130 exits
0 with no shorts. The ink changes move only previously checked Silk markings to
same-side Fab; copper and placement remain protected. Actual footprint identities
are regenerated into the local library. All four reference layers are freshly
filled; stale pours never qualify changed copper.

Report: `checks/integrated/g350-clean-length-progress/summary.json`.
Snapshot: `dist/g350-clean-full-board-length-progress-verified-129/pcb-all-layers.png`.
The snapshot omits ground fills for clarity and explicitly records the remaining
timing failures. The default 11/49 board and all 25,814 original evidence files
remain frozen. Use the isolated Gerber wrapper to protect old debug artifacts.

## Trials and continuation

Runs 115–132 preserve the isolated registry upgrade, real checker negative
controls, typecheck/lock checks, D12-only fresh source/export, failed and accepted
small timing edits and rejected detours. The first broad tuner accepted legal
extensions but barely improved bus minima; removing its initial simplification
step exposed legal small increments. Full physical checks still decide every
accepted edit. The optional CLI fanout debug serializer still cannot select a
unique PCB port at some shared junctions; explicit validated replay and actual
native/independent checks qualify the source without fabricated port selections.

The old zero-skew DDR bundle was restored into a separate full-board trial 125.
Its timing remains zero, but its copper collides with existing power/peripheral
routing (845 reported physical/manufacturing errors). It is rejected as a whole
board. Fixed-DDR rest-recovery trials 127/128/133 remain separate and unqualified
while their router models have open nets; model counts never replace fresh source,
numeric KiCad pad checks, full DRC, refills or Gerber checks. Trial 131 has further
native planning improvements but no fresh-source/independent qualification yet.
Continue joint package escape planning and whole-board matching from the checked
entry above; do not replace it with a trial merely because that trial has zero
skew. The package-branch width experiment in 133 preserves wider routes outside
CPU/RAM and tests the actual declared package widths, with all native width and
manufacturing checks still required.

Restore the new hash-indexed evidence with:

```bash
source cloud/env.sh
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-clean-length-progress/runtime-and-length-progress-115-132-manifest.json
```

Run KiCad containers sequentially to avoid exhausting Docker VFS storage.
Startup must not route hardware or change fabrication readiness automatically.
