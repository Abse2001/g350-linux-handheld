# Connected board with byte 0 native matching

Use `experiments/am3352-g350-full-board-byte0-matched-corner-clean-replay.circuit.tsx`. Fresh source 443, independent KiCad 444 and Gerber 445 preserve
217/217 connections, all 49 DDR signals, 298 ground pads and 1,032 unique numeric
ports. All 280 placements, RAM90, four layers and 824 standard full-depth
0.4572/0.254 mm vias are preserved. The outline remains provisional 76 × 118 mm.
Native physical/manufacturing checks, all-rule DRC errors/warnings, opens,
dangling copper and all-layer shorts are zero. There are no ignored rules or
exclusions. The full qualification wrapper exits 0.

| Bus | Native spread (mm) | Limit (mm) | Result |
| --- | ---: | ---: | --- |
| Byte 0 | 0.574882 | 0.635 | Pass |
| Byte 1 | 21.213572 | 0.635 | Unmatched |
| Command/clock | 24.150328 | 0.635 | Unmatched |

All differential pairs pass 0.127 mm. Actual source build exits 1 solely for the
two unmatched buses, down from three at the preceding 7165c90 checkpoint.
It completes three phases in 544.345 seconds without a
forced stop, with its complete source graph, runtime pins and reviewed native
checks hash verified. Source SHA256 is `85376c9e696221df8208f10525d1965e58c7c59ee72733d5755f30ada658ad69`.
Fresh filled SHA256 is `069943851afcd409f9e63dd3bf3d524f33b901089127956653e51cfd61838856`.

The guarded tuner adds real planar geometry and preserves every existing hole,
pad, terminal endpoint, transition and foreign copper. Each retained batch runs
complete physical checks and a fresh locked ground fill. Strict cache ordering
preserves all physical IDs in source replay. Source 433 and diagnostic 438 were
rejected for an acute DDR_D6 corner. Repair 440 opens that corner to 24.412°,
reducing D6 by 0.273262 mm while preserving byte0 matching. Checked local D9
fold geometry recovers the earlier sliver. The final source is rebuilt from
cache 442; diagnostic CAD alone was not promoted.

The CAD qualification now bundles the identical ground preparation, full DRC,
ink/library preparation, numeric pad check and filled-polygon export into one
official KiCad container. It retains every flag and assertion and avoids
repeated VFS image copies. Runtime remains Node 25.6.1, Bun 1.3.14, tscircuit
0.0.2803, Core 0.0.2107, CLI 0.1.2258 and reviewed checks 0.0.242. KiCad is 10.0.6.
Upstream inspection sources and solver pins remain unchanged.

Native length adds 1.6 mm for every transition, not electrical propagation
delay. Byte0 actually has an 8.000 mm planar spread and 2–7 transitions. The
source-bound `layer-lengths.json` records every physical layer length and
transition. Target DDR clock, manufacturer layer depths/dielectrics, package
and via/stub models, impedance, coupling and return paths remain necessary.
PDN/footprints, Linux bring-up and measured original-shell fit also remain
unfinished. **fabricationReady is false; do not order this board.**

The summary binds source, filled board, native results, independent numeric
connectivity, full DRC, Gerber input and snapshot hashes. Restore checked
outputs with:

```bash
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-byte0-matched-progress/connected-source-443-445-manifest.json
```

Preserve source 319/320/321 and all original frozen evidence. Separate verified
archives retain owned failed/planning trials 329–432, with selective restorers
for compressed exact circuit bytes. Further bus combinations are unqualified:
447 has three overlaps and repair 448 fails to eliminate them. The active
connection, twelve repository refs and ten domains are recorded in
`cloud/TIMING_CONNECTION_WORKING_2026-10-10.json`.

The exact refreshed Start commands exit 0. Checked archive controls verify all
449 members, fresh/repeat/in-place restoration and edited-file refusal. The
Install script is unchanged from its tested revision 19. Updated reusable Start
instructions follow this checked source; publishing the environment and
restoring it in a new task remain separate product actions.
