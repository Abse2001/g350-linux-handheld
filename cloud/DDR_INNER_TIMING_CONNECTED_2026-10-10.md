# Connected DDR inner-layer timing progress — 2026-10-10 UTC

Continue `experiments/am3352-g350-full-board-inner-timing-ground-preserved-replay.circuit.tsx`.
The source-bound summary is `checks/integrated/g350-inner-ground-timing-progress/summary.json`.
Fabrication readiness remains false.

| Whole bus | Preceding checked skew | New checked skew | Limit |
|---|---:|---:|---:|
| Byte0 | 29.148292 mm | 19.293662 mm | 0.635 mm |
| Byte1 | 33.385093 mm | 25.185093 mm | 0.635 mm |
| Command/clock | 24.480252 mm | 24.480252 mm | 0.635 mm |

All three differential pairs pass 0.127 mm. The native length calculation includes
1.6 mm per via; it is not a qualified electrical propagation-delay model.

Fresh source 209 completes all three routing phases, preserves its complete import
graph and exits 1 for three whole-bus skew failures. Native source and independent
fresh-fill checks report zero errors in every other checked category. Independent
KiCad 210 verifies 217/217 connections and all 1,032 required numeric ports,
including 49 DDR signals and 298 ground ports. DRC errors, warnings, unconnected
items, dangling tracks and dangling vias are zero, with no ignored rules or
exclusions. All-layer Gerber check 211 exits 0. The complete qualification wrapper
exits 0 and its actual exit is retained in `wrapper-exit.json`.

All 280 placements, RAM90, four copper layers and 824 standard full-depth vias
remain fixed. The strict comparison preserves logical traces/buses/nets/ports,
outline, component positions, pads, drill inventory, DDR pad endpoints and original
DDR layer transitions. Peripheral copper geometry is unchanged. Restoring checked
Top/Bottom DDR spans retains 365.293340 mm of added inner-layer DDR copper while
recovering ground connectivity. The old native bus-lanes bootstrap and frozen
25,814-file evidence remain unchanged.

## Rejected trials and ground repair

Distributed trial 184 passed physical clearance but fresh source 190/197 and
independent KiCad 201 exposed ground opens. Three actual pads were stranded:
U_RAM numeric pins 92 and 94, and C_DDR_RAM_2 numeric pin 2. Native checks flagged
215 ground ports because their whole-net assertion requires every same-net pad
in one physical copper region. This was not evidence of 215 separate KiCad opens.
The whole-net assertion remains enabled; no checker patch or limit was relaxed.

Clearing old derived pour annotations alone did not solve the opens. Planar ground
bridges and stitching-via searches found no accepted repair. Restoring checked outer
DDR spans in 207 and rebuilding native fills in 208 recovered the complete ground
net; the fresh source/KiCad/Gerber qualification above confirms that result. The pad
layer audit also verifies all 1,161 exported SMD pads remain on their authored side.
Initial failed diagnostic commands and their logs are retained.

Recovery trials 212/217/220 regain additional outer-layer length while passing
fresh native ground reconstruction, but they have not passed fresh source and
independent KiCad/Gerber qualification. They must not replace the checked entry.
CASn/A9 attempts that split ground were rejected. The planar proposal validator
checks physical geometry only; it is never sufficient evidence of fresh plane
connectivity. Fresh ground checks remain mandatory after every copper change.

## Preservation and continuation

The b70590b connected checkpoint is recorded with 17 pre-change hashes in
`cloud/CONNECTED_CHECKPOINT_BEFORE_DISTRIBUTED_2026-10-10.json`; its earlier summary
is copied into this checkpoint directory. Its source, caches, report and archive
remain available on the preceding commit. The checked-shortcut summary and all
frozen evidence are preserved. Only the mutable current-progress alias advances.

Restore the new checked evidence with:

```bash
source cloud/env.sh
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-inner-ground-timing-progress/connected-source-209-211-manifest.json
```

The separate rejected/planning and ground-recovery manifests preserve all explicitly
owned trials 181–220, including stopped and failed runs. They are diagnostic evidence;
normal startup need only restore the checked archive. Member hashes, fresh extraction,
repeat extraction, in-place verification and refusal to overwrite differing local
evidence are tested. See the restoration logs and validation JSON.

Continue whole-bus matching without breaking any of the 217 connections. Physical
routing trials with genuine additional vias require fresh source, numeric-pad,
four-layer/full-depth drill, ground-fill, clearance and Gerber qualification.
Target DDR clock and manufacturer stackup are still requested for electrical timing.
Package/via delay, impedance, coupling, return paths, PDN/footprints, Linux bring-up
and measured original-shell fit remain unqualified. Do not order or mark fabrication
ready from this routing checkpoint.

## Reusable environment validation

The exact saved Install script was executed again and exits 0, including frozen
evidence/runtime/upstream verification, TypeScript checks and KiCad Python smoke.
Startup state, all eleven upstream pins, KiCad 10.0.6, pcbnew/wx, routing-tool
positive/negative controls and the new evidence restoration are tested. An initial
startup Python check hit the Docker VFS disk limit. Removing only the obsolete
ignored `.cloud-tools/runtime-20261007/node_modules` cache freed space; its source,
manifests and lockfiles remain, and sequential KiCad/Python retries pass. Main
runtime, KiCad image/archive and frozen evidence are untouched. The environment
Install/Start configuration can be saved for reuse; saving does not publish it.
