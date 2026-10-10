## Latest checked larger-group timing progress (2026-10-10 UTC)

Latest checked continuation (2026-10-10): use
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

## Latest checked ground-preserving byte growth (2026-10-10 UTC)

Continue `experiments/am3352-g350-full-board-ground-safe-byte-growth-stable-replay.circuit.tsx`.
Read `cloud/DDR_GROUND_SAFE_BYTE_GROWTH_2026-10-10.md` and
`checks/integrated/g350-ground-safe-byte-growth-progress/summary.json`.
Source 319, KiCad 320 and Gerber 321 preserve all 217 connections, 49 DDR,
298 ground ports, placements and 824 standard through-vias, with zero DRC
warnings/errors, opens, dangling copper and shorts. Native bus skews are
15.124882 / 23.748074 / 24.300328 mm against 0.635 mm; pairs pass. Build still
exits 1 for matching. Preserve prior 8284474 and all frozen evidence, retain
runtime/checker pins, and keep fabricationReady false. See the working report
for unqualified small gains, rejected ground interactions and cache-order fixes.

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

## Latest checked middle-shortcut continuation (2026-10-07)

Continue `experiments/am3352-g350-clean-full-board-middle-shortcut-replay.circuit.tsx`.
Read `cloud/DDR_MIDDLE_SHORTCUT_PROGRESS_2026-10-07.md` and
`checks/integrated/g350-middle-shortcut-progress/summary.json` first. Fresh source
144 / independent refill 145 / isolated Gerber 146 retain all 217 connections,
49 DDR signals, 280 placements, RAM90 and four layers. DRC errors/warnings,
opens, dangling copper and shorts are zero. All native checks pass except three
bus-skew failures: 33.771477 / 36.800514 / 27.930389 mm versus 0.635 mm.
All differential pairs pass. Runtime pins remain tscircuit 0.0.2759 / Core
0.0.2107 / CLI 0.1.2258 with unchanged reviewed checks and solvers. Core 0.0.2108
was tested in isolation and did not change any non-metadata source record;
it is not silently substituted into the board runtime. Preserve the rejected
recovery/physical-via bypass trials and restore their rasters only if needed.
Target DDR clock and manufacturer's stackup remain unspecified; full electrical
timing and measured shell fit are unqualified. Keep fabricationReady false.
Older entries below preserve historical checked checkpoints.

## Latest checked clean whole-board length progress (2026-10-07)

Continue `experiments/am3352-g350-clean-full-board-length-progress-replay.circuit.tsx`.
Read `cloud/CLEAN_DDR_LENGTH_PROGRESS_2026-10-07.md`, its integrated summary and
`cloud/RUNTIME_REFRESH_2026-10-07.md` first. Source 123 / independent 129 / Gerber
130 retain 217/217 connections and 49 DDR signals, with zero KiCad errors,
warnings, opens, dangling copper and shorts. All 280 placements remain fixed.
Three bus-skew failures remain: 34.278647 / 37.400514 / 28.530389 mm versus
0.635 mm. All differential pairs pass. Runtime is tscircuit 0.0.2759, Core
0.0.2107 and CLI 0.1.2258; checker/solver pins and reviewed patch remain intact.
Keep fabricationReady false. Matched-DDR rest-recovery and later tuning trials
are unqualified until fresh source and independent checks pass. Older sections
below are historical checked checkpoints.

## Latest checked whole-board continuation (2026-10-07)

Use `experiments/am3352-g350-full-board-dangling-clean-replay.circuit.tsx`.
Read `cloud/DANGLING_COPPER_CLEANUP_2026-10-07.md`,
`checks/integrated/g350-dangling-copper-cleanup/summary.json` and
`cloud/RUNTIME_UPGRADE_2026-10-07.md` before the historical sections below.
All 217 connections and 49 DDR signals are independently checked. KiCad errors,
warnings, dangling tracks/vias, opens and all-layer Gerber shorts are zero.
119 unused vias and 135.834855 mm of non-DDR planar copper were removed.
All DDR copper and component placements are exactly preserved. Three bus-skew
failures remain: Byte0 34.878647 mm, Byte1 41.191260 mm, command/clock 29.576845 mm
against 0.635 mm. All three differential pairs pass their 0.127 mm limits.
Keep fabricationReady false: full electrical timing and measured shell fit remain
unfinished. Restore only the final source archive during normal startup; large
compressed scratch rasters are preservation evidence, not startup dependencies.
Use the isolated Gerber wrapper, run KiCad containers sequentially and preserve
all original evidence. Older entries below are historical checkpoints.

# Latest whole-board continuation (2026-10-07)

The user requested the rest of the rotated-RAM board routed. The newest checked
entry is `experiments/am3352-g350-full-board-ground-joined-replay.circuit.tsx`.
Read `cloud/FULL_BOARD_CONNECTED_2026-10-07.md` and
`checks/integrated/g350-full-board-progress/summary.json` first. Fresh source and
independent checks verify 217/217 connections, all 49 DDR signals and 298 ground
ports; native connectivity/physical checks and all-rule KiCad error categories
are zero. All-layer shorts are zero. Three whole-DDR-bus skew failures still
make the complete build exit 1. Restore its hash-indexed archive as documented;
keep the default, DDR-only zero-skew evidence and failed trials frozen. Continue
whole-board DDR matching and remaining electrical, mechanical and release gates.
`fabricationReady` stays false. Older instructions below are historical context.

# Continue the G350 board in cloud

Read `AGENTS.md`, `docs/CLOUD_HANDOFF.md`, `design-status.json` and the original
user-visible conversation in `docs/CHAT_CONTEXT.md`. Continue the same bare-AM3352
Linux handheld toward fabrication readiness. Preserve all accepted requirements:
original G350 shell, maximum four copper layers, both assembly sides, eleven
front membrane buttons, FPC display, microSD, one USB-C for charging and data,
no analog sticks or rear buttons, individual JLCPCB components, tsci, native
bus_lanes DDR bootstrap phases and checked manual repairs.

Verify the environment and pinned native solver first. Complete pending byte1
independent checks and the generated KiCad ignore-rule audit without weakening
checks. Repair/restructure the native byte1 carrier phase, replay actual editable
source and qualify combined copper. Preserve checked byte0 and power planes,
complete full DDR/peripheral routing, Linux boot/USB provisioning and release
checks. Do not merge routes from incompatible historical placements. Preserve
failed runs and only push meaningful verified breakthroughs after this transfer.

Keep fabricationReady false until every electrical, mechanical and manufacturing
gate passes; the user wants an order-ready prototype, not a partial routing image.
Shell measurements remain missing, so continue independently useful electronics
work while clearly recording the remaining physical-fit evidence needed.

## Latest rotated-RAM DDR candidate

The user requested RAM rotated 90 degrees and four-layer routing with inner
layer priority. The new source-verified candidate connects all 49 DDR signals
with zero native physical errors and zero Gerber shorts. Read
`cloud/DDR49_ROTATED_RAM_2026-10-06.md` and its evidence before continuing.
Six native length/skew failures, power/reference copper and peripheral routing
remain unfinished. The default 11/49 layout is unchanged; preserve its evidence,
but continue the user-requested rotated candidate rather than mixing placements.
`fabricationReady` stays false.

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
