## Latest checked whole-board continuation (2026-10-07)

Use `experiments/am3352-g350-full-board-ddr-shortcut-replay.circuit.tsx`.
Read `cloud/DDR_SHORTCUT_PROGRESS_2026-10-07.md` and
`cloud/RUNTIME_UPGRADE_2026-10-07.md` before the historical sections below.
All 217 connections and 49 DDR signals are checked; three bus-skew failures and
157 dangling-copper warnings remain. Package/via timing, impedance, return paths,
electrical qualification and measured shell fit remain unfinished.
Use the isolated Gerber wrapper and preserve every original evidence file.

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
