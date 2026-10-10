# Connected G350: larger bend groups with checked A0 restored

Continue `experiments/am3352-g350-full-board-large-group-restored-replay.circuit.tsx`.
Fresh source565 / KiCad566 / Gerber567 preserve 217/217 connections, all49 DDR,
298 ground ports, 1,032 numeric ports, 280 placements, RAM90 and four layers.
All824 standard full-depth 0.4572/0.254 mm barrels, endpoints, pad mapping,
logical constraints, placements and peripheral geometry are preserved.
Source and freshly filled native physical checks, all-rule KiCad errors/warnings,
opens, dangling tracks/vias and all-layer Gerber shorts are zero. No ignored
rules or exclusions. Complete qualification wrapper exit0. Build exit1 solely
for the two whole-bus matching failures; all three routing phases complete,
source definitions remain unchanged, and elapsed time is391.900 seconds.

| Group | Previous native spread mm | Current mm | Limit mm |
| --- | ---: | ---: | ---: |
| Byte0 | 0.574882 | 0.574882 | 0.635 |
| Byte1 | 8.033572 | 7.693572 | 0.635 |
| Command/clock | 12.450328 | 11.150328 | 0.635 |

Byte0 and all three differential pairs pass (pair limit0.127 mm). Byte1 and
command/clock remain unmatched. D9 is47.583072 mm versus D12 at55.276643 mm;
A13 is41.302033 mm versus A0 at52.452361 mm. These are native effective lengths,
including1.6 mm per transition, not electrical delays or readiness evidence.
Source-bound `layer-lengths.json` retains actual per-layer geometry.

Shortest-signal growth545 retains additional D9/A13 length. Larger contiguous
bend groups556 retain24 accepted changes in two rounds with unchanged full
physical and fresh-ground guards. Two A9 ground proposals fail with215 errors
and are rejected. Optional `G350_LENGTH_BLOCK_SIZES` supports unique integers
2–64 (at most12 groups), requires block movement, and preserves the previous
default groups2,3,4,6,8,12. The driver records the exact option in its report.
No solver/runtime pins, native patch, clearance or matching limits change.

Raw A0 shortcut548 passes planning geometry/ground checks but fresh source560
exposes one native self-short and its overlapping-trace error at the via center
(-7.2,8.225). Qualification561 exits1 before CAD; it is not promoted. Restoring
the entire checked A0 route564 retains the other accepted growth. Direct CAD557
and complete editable source565/CAD566/Gerber567 independently pass. Rejected
middle reroutes549–554 either have no legal path or increase native length.
Planning success is never substituted for fresh editable-source qualification.

Restore the450-member checked archive:

```bash
source cloud/env.sh
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-large-group-restored-progress/connected-source-565-568-manifest.json
```

Archive SHA256: `427c0736983d355a4071cec30ec904c1c0464a6eebb79207c413f4be82673a26`.
Fresh, repeated and in-place restore pass0; an edited member is refused with
exit1 and preserved. `restoration-validation.json` records the exact control.
Planning archives545–555 and556–564 retain failed runs, exact executed helpers,
input/candidate circuits and diagnostics; do not restore large planning histories
by default. Six additional compressed originals are hash-indexed and preserve
104,838,907 original bytes; archive and decompression verification pass. Frozen
25,814 files and hardware sources remain unchanged.

Compiled SHA256: `f493423c7ddf9fe603755ac71d38e919d003ce6226b9585753d8f850e8f99b7b`.
Fresh-filled SHA256: `cdaf8400397b76fde7273a14af72e7fc6bfe9374b6f72050c7e87f9fa1346636`.
Independent board SHA256: `cda0f4c1ac4a104684d5096edc9f89fbc44efe005365f7eb8b0234133b9668ff`.
Summary: `checks/integrated/g350-large-group-restored-progress/summary.json`.

Preserve the fully qualified source540/532 fallbacks and source468/443/319,
native BusLanes bootstrap and all frozen KiCad10 evidence. The failed560 shortcut
and497/515 ground-open trial are planning evidence only. Target clock, actual
manufacturer stackup, package/via/stub delay, impedance, coupling, return paths,
PDN/footprints, Linux bring-up and measured shell fit remain unfinished.
**fabricationReady=false; the board is not ready to order.**

The exact complete refreshed Start shell exits0 (repeat573), including frozen
file restoration, all pinned upstream/runtime checks, official KiCad archive
checksum/version/pcbnew APIs, isolated Python tools and four grid controls.
Runtime logs and exact code are hash-indexed in runtime-validation-572-573;
Install stays unchanged from tested revision19. The first internal shell exit
was0 but its outer tool reported1, so the complete repeat independently verifies0.
Compressed-original fresh/repeat restoration also passes0 for all six outputs.
Environment draft updates require user publication; no fresh-task restore is claimed.
