# G350 board continuation

Read `docs/CLOUD_HANDOFF.md`, `design-status.json`, and `docs/G350_CURRENT_DDR.md`
before editing hardware. The complete recorded user-visible conversation is in
`docs/CHAT_CONTEXT.md`. Newer user decisions supersede older ones.

The current design is a bare AM3352 + 512 MiB x16 DDR3L Linux handheld, authored
in tscircuit with individually imported JLCPCB parts. It must fit the original
G350 shell, use at most four copper layers, have eleven front membrane buttons,
an FPC display, microSD and one USB-C connector for charging and data. Both
assembly sides are permitted. No analog sticks or rear buttons. Do not return
to a Pi carrier, preassembled SBC or the historical RK3566 design.

`index.circuit.tsx` is the current 280-component, provisional 76 × 118 × 1.6 mm
shaped board. Its checked byte0 subset has 11/49 DDR signals connected. The
historical DDR42 and other larger layouts do not qualify this shell layout.
`fabricationReady` must stay false until all documented release gates pass.

Use `bash scripts/setup-cloud.sh` in the Linux cloud environment, then
`source cloud/env.sh` in each new shell. Use the project `node_modules/.bin/tsci`,
never a global tsci. Restore ignored evidence using
`python3 scripts/restore-cloud-evidence.py`. Keep lockfiles and the reviewed
native checks patch. Verify versions after dependency changes; do not silently
replace pinned solvers with newer code or disable native/independent checks.
The verified cloud host is Debian 13 with isolated official KiCad 10.0.6 tools;
read `cloud/LINUX_VALIDATION.md` for container restoration and Python compatibility.

Layout all components before routing. Bootstrap DDR with native `bus_lanes`
phases, then repair geometry as needed. Preserve both complete byte buses and
their 0.635 mm limits, and the 0.127 mm differential-pair limits. Partial solver
outputs and pad-to-via escapes are not complete CPU-to-RAM channels. Use new
experiment/output directories; preserve failed runs and frozen evidence.

Validate actual editable-source replay, numeric pad mapping and connectivity,
all-layer Gerber shorts, four-layer full-depth vias, filled references, and
independent KiCad clearance/drill checks. Check all KiCad rule severities and
exclusions. Full DDR timing also needs package/via delay, nominal length,
impedance and return-path qualification; planar skew alone is insufficient.
Recheck the shared mechanical outline and assembly envelope after edits.

The user requested this GitHub/cloud handoff. After that, push additional board
work only on meaningful verified breakthroughs, as previously requested. Do
not place an order or claim fabrication readiness from partial routing evidence.

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

## Whole-board routing trial (2026-10-07)

The user subsequently requested the rest of the board routed. Continue
`experiments/am3352-g350-full-board-ground-joined-replay.circuit.tsx` and read
`cloud/FULL_BOARD_CONNECTED_2026-10-07.md` plus
`checks/integrated/g350-full-board-progress/summary.json`. Fresh editable source
and independent fresh-fill numeric checks now verify 217/217 connections,
49/49 DDR signals and all 298 ground ports. Source and fresh-filled native
checks report only three whole-DDR-bus skew failures; all other native checks
are zero. KiCad has zero clearance errors and unconnected items, with no ignored
rules or exclusions; all-layer Gerber shorts are zero. The full build still
exits 1 for DDR matching, and warnings/electrical/mechanical gates remain open.
The entry and caches are experiments, not a fabrication release or a replacement
for the preserved zero-skew DDR-only entry or the frozen default. Restore the
latest evidence with `scripts/restore-g350-routing-evidence.py` and the manifest
named in the new report; the prior progress document preserves rejected trials.
Run `bash scripts/setup-g350-routing-tools.sh` after `source cloud/env.sh` to
reconstruct the hash-pinned isolated geometry tools and verified grid engine.
Use fresh fills and numeric pad checks; a stale filled-plane router model does
not establish final ground connectivity. Keep `fabricationReady` false.

## Latest runtime and whole-board shortcut checkpoint (2026-10-07)

Continue `experiments/am3352-g350-full-board-ddr-shortcut-replay.circuit.tsx`
and read `cloud/RUNTIME_UPGRADE_2026-10-07.md`,
`cloud/DDR_SHORTCUT_PROGRESS_2026-10-07.md` and the full-board summary.
Latest tested tscircuit is 0.0.2757; reviewed checks 0.0.242 hash is
1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc.
Fresh source and independent checks retain 217/217 connections and 49 DDR signals,
with zero physical errors/opens/shorts and exactly three native bus-skew failures.
The checked ink cleanup export has zero library/silkscreen warnings, with 157
dangling-copper warnings remaining. D12's finer reroute is an unqualified separate
trial. Use `bash scripts/check-g350-shorts-isolated.sh INPUT NEW_OUTPUT_DIRECTORY`
so failed checks cannot overwrite restored frozen debug files. Keep all old
evidence, actual checker assertions and fabricationReady=false.

## Latest dangling-copper cleanup (2026-10-07)

Continue `experiments/am3352-g350-full-board-dangling-clean-replay.circuit.tsx`.
Read `cloud/DANGLING_COPPER_CLEANUP_2026-10-07.md` and its integrated summary.
Fresh source 111, independent fresh-fill/export 113 and isolated Gerber check 114
verify all 217 connections / 49 DDR signals, zero physical/native manufacturing
errors, zero KiCad errors/warnings/opens/dangling copper and zero shorts. 119
unused vias and 135.834855 mm of non-DDR planar copper were removed; all DDR
copper and 280 component placements are exactly preserved. There are 825 standard
full-depth vias. The complete build still exits 1 for three DDR bus-skew errors:
34.878647 / 41.191260 / 29.576845 mm versus 0.635 mm. All differential pairs pass.
Restore the final source archive, retain old checked checkpoints and failed trials,
and keep fabricationReady false until timing/electrical/mechanical gates pass.
Run KiCad containers sequentially: concurrent VFS containers can exhaust disk.
Compressed archived routing rasters need not be restored during normal startup.
