# G350 DDR native skew cleared — 2026-10-06

The new checked entry is `experiments/am3352-g350-ram90-zero-skew-replay.circuit.tsx`.
Its fresh editable-source replay connects **49/49 DDR signals** with **zero native
length/skew violations**, zero native physical errors, zero manufacturing
via/track clearance errors and zero all-layer Gerber shorts. Independent KiCad
10.0.6 confirms all 49 numeric CPU/RAM pad connections and zero manufacturing
errors, with **no ignored checks and no per-item exclusions**.

All 280 component placements are identical to the checked rotated-RAM reference.
RAM stays at 90 degrees. There are exactly four copper layers and 104 standard
full-depth vias: 0.4572 mm land, 0.254 mm drill. Trace width and copper clearance
remain 0.1016 mm. About 59.96% of planar DDR copper is on Inner1/Inner2.
The unchanged default and all previous evidence remain preserved.

| Group | Members | Native skew mm | Unchanged limit mm |
| --- | ---: | ---: | ---: |
| DDR_BYTE0 | 11 | approximately zero | 0.635 |
| DDR_BYTE1 | 11 | approximately zero | 0.635 |
| DDR_COMMAND_CLOCK | 26 | 0.133194 | 0.635 |
| DQS0 / DQSn0 | 2 | approximately zero | 0.127 |
| DQS1 / DQSn1 | 2 | approximately zero | 0.127 |
| CK / CKn | 2 | approximately zero | 0.127 |

Byte0 and byte1 native lengths are 34.0 mm. Command/clock lengths span
37.066806–37.200000 mm. These are the pinned native checker's geometry lengths,
including 1.6 mm per actual through-via; they do not establish electrical delay.
Zero here means **zero violations**, not zero absolute command-bus skew.

## Routing and checking

The pinned native `bus_lanes` solver solved all six differential-pair carriers
in a separate bootstrap. Its inputs, completed output, execution and worker
snapshots are retained. The complete 11/11/26-member source buses and all six
pair members stayed intact throughout final replay and qualification.
The other carriers and subsequent length repairs use checked manual four-layer
routing. This is not a native global solve of all 49 signals.

Planning reserves BGA escape regions during early tuning, and validates every
accepted path against all ten native physical checks plus a manufacturing
via/track guard. Tiny terminal staircase repairs are accepted only when those
unchanged checks pass. The final missing A10 channel needed a new pad escape;
CASn needed DQM1 and A5 to be removed and rerouted around its corridor. All three
were then restored, matched and checked together. No partial escapes are counted
as CPU-to-RAM connections.

A fresh source rebuild completed the saved 49-path phase in a 366.97-second run.
Its compiled source SHA-256 is:

`cff9b16ea1e265a304765a74b2a930412fcaf867654512e3405c18c12c175a17`

The complete build correctly exits 1 with 881 open-port and 70 missing-trace
errors elsewhere on the board; it has no DDR skew errors. KiCad reports 602
warnings and 499 reported/capped unconnected items. Its five default-ignored
checks were enabled in a new trial project: track centering and tuning geometry
are errors, and footprint metadata checks are warnings. Final ignored checks and
per-item exclusions are both zero. Frozen KiCad 10.0.5 evidence was not edited.

**Fabrication readiness remains false.** Filled power/reference copper,
package/via delay, nominal lengths of every signal, impedance, class spacing,
coupling and return paths remain unqualified. Peripheral and power routing,
footprint/stencil qualification, Linux bring-up and exact original-shell fit
also remain unfinished. Do not order this board based on these scoped results.

## Evidence and replay

`checks/integrated/g350-ram90-zero-skew/summary.json` records the checks and hashes.
The directory contains native qualification, independent KiCad connectivity,
DRC/rule audit, all-layer shorts log, the actual four-layer image, checker
snapshots and two archives. `source-replay-evidence.tar.gz` retains the exact
compiled source, KiCad board/project/rules and frozen source import graph;
`routing-trials.tar.gz` retains the native bootstrap, selected failed runs,
manual checkpoints and exact winning paths. Other unsuccessful trials remain
preserved in the prepared ignored filesystem.

Replay using the local pinned runtime and a fresh output directory:

```bash
source cloud/env.sh
node scripts/run-g350-ddr-phase.mjs experiments/am3352-g350-ram90-zero-skew-replay.circuit.tsx dist/g350-ram90-zero-skew-next G350_RAM90_ZERO_SKEW_REPLAY 180 four-ddr 700
node scripts/qualify-g350-ram90-ddr-native.mjs dist/g350-ram90-zero-skew-next/compiled.circuit.json dist/g350-ram90-zero-skew-next/native-qualification.json dist/g350-ram90-three-pairs-safe-source-01/compiled.circuit.json
```

After a fresh clone, restore the prior checked reference from
`checks/integrated/g350-ram90-timing/source-replay-evidence.tar.gz` and the new
archives into the repository's ignored `dist` paths with `tar -xzf`, preserving
existing files (`--keep-old-files`) and verifying archive hashes in the summaries.
New source replay, KiCad export/adapter, all-rule DRC, numeric connectivity and
all-layer Gerber checks are required after any copper change.
