# G350 connected board: BusLanes and guarded length progress

Latest checked continuation (2026-10-10 UTC): use
`experiments/am3352-g350-full-board-bus-lanes-smoothed-replay.circuit.tsx` and read
`cloud/DDR_BUS_LANES_SMOOTHED_PROGRESS_2026-10-10.md` plus `checks/integrated/g350-bus-lanes-timing-progress/summary.json`.
Fresh source699 / KiCad700 / Gerber701 retain all217 connections, 49DDR,
298 ground ports, 1,032 numeric ports, 280 placements and824 standard through-vias.
Native physical/manufacturing checks, all-rule DRC errors/warnings, opens,
dangling copper and all-layer shorts are zero. Byte0 passes0.574882 mm;
byte1 5.766561 mm and command/clock8.056486 mm still fail0.635 mm.
All differential pairs pass0.127 mm. Build exit1 is solely those two failures;
complete source/CAD/Gerber qualification exits0. fabricationReady=false.
Pinned public BusLanes shortens A6's Inner1 carrier by6 mm; guarded smoothing
and matching preserve every original barrel, endpoint, outer-layer wire,
peripheral trace, placement and logical constraint. Keep all runtime pins and
reviewed native checks. Native length includes1.6 mm per transition, not
qualified electrical delay. Target clock, stackup, package/via delay, impedance,
coupling, return paths, PDN/footprints, Linux and measured shell fit remain open.
Preserve source643/610/591/565/540/532/319 and frozen evidence. The board is not
ready to order. Further candidate edits require full independent qualification.

| Native group | Previous source643 mm | Fresh source699 mm | Limit mm |
| --- | ---: | ---: | ---: |
| Byte0 | 0.574882 | 0.574882 | 0.635 |
| Byte1 | 6.973572 | 5.766561 | 0.635 |
| Command/clock | 8.600328 | 8.056486 | 0.635 |

All217 authored connections, all49 DDR, all298 grounds and all1,032 required
numeric pads remain connected. Original0.4572/0.254 mm through-vias stay824;
all280 placements, RAM90, four layers and the provisional outline remain exact.
There are no native physical/manufacturing errors, KiCad violations/warnings,
opens, dangling tracks/vias, ignored severities/exclusions or all-layer shorts.
Twenty-five DDR routes change from the immediate planning baseline662. The
strict source comparison also binds source699 to the checked whole-board319:
original physical holes, all DDR terminal/barrel points, peripheral copper,
source definitions and all native constraints remain exact.

The installed Core0.0.2107 public `SOLVERS.BusLanesSolver` is used directly;
upstream HEAD is never substituted into the board runtime. Positive652 shortens
A6's existing Inner1 span by6 mm with unchanged endpoints/holes and fresh-ground0.
Controls666 and final702 exercise strict carrier selection, endpoint/exact-length
assertions, complete native/manufacturing checks, genuine via counts, contiguity,
constraints and fresh-ground0. Foreign copper and all824 standard holes are hard
obstacles. The computational rectangle is proved inside the unchanged physical
outline; native/source/KiCad checks use the actual shaped board.

The adapter compensates the API's fixed portal-copper contribution and selects
the generated carrier with `findLast`. Rejected664 accidentally selected an
input fixed segment during adapter development; unchanged guards catch4 overlap
and2 manufacturing errors, actual exit3, before ground or promotion. The corrected
controls solve and pass with actual exit0. Invalid top-layer requests663/703 are
refused before planning, actual exit1, with unchanged inputs. Diagnostic bottom,
Inner1/Inner2 access changes and explicit owned boundary-hole removal never yield
an accepted source in this milestone; all original physical/route barrels remain.

New `relax-g350-ddr-longest-paths.mjs` tries short chords and vertex relaxation,
requires25-degree new bends, unchanged complete physical checks, exact non-trace,
foreign/outer-layer/barrel/endpoint records, fresh ground and nonregressing complete
buses. A per-bus minimum prevents over-shortening a signal into a new outlier.
Older674 rejects physically legal/fresh-ground D15 and A5 reductions because they
regress bus skew. Bounded678 is retained as planning-only space exploration; it
is not included in source699. Bounded679 shortens nine long command signals.

Run691 finishes five guarded units, then exits1 on pre-existing acute CKE bends;
CKE is not edited. Recovery693 revalidates the exact completed checkpoint with
complete physical/fresh-ground checks, actual exit0. Final helper preflights every
selected baseline angle before any unit. Control694 selects A9 and CKE and proves
actual child exit1 before any candidate/unit, with unchanged source. This extra
planning angle guard is not a newly reported native or KiCad violation.

The twelve-round670 pass retains every unit/batch only after fresh-ground0.
`merge-g350-ddr-planar-candidates.mjs` rejects conflicting edits, asserts exact
foreign/non-trace/outer/barrel/endpoint geometry, requires full physical/fresh-ground
checks and no bus regression relative to either input. Final695 merges25 changes
with all these assertions passing. All paired strobe/clock limits remain0.127 mm.
D9 becomes49.223072 mm; D12 shortens to54.989633 mm. A0 remains longest command
at52.258519 mm; CASn is shortest at44.202033 mm. A6 is44.465806 mm after BusLanes
and smoothing. These are geometric values with1.6 mm per transition.

Other bounded attempts are preserved and rejected:649/650 cannot refine/match
D9,651/654 and680/697 cannot shorten D12, and653/656–661/667/668/689/690/692/696
cannot produce the requested A0/D15 carrier. Barrel reconstructions671–673,
682–684 find no legal bridge. Physically legal676/677/685 are longer;686 has an
actual overlap and self-short. Planner exit0 is not acceptance or qualification.
No failed, longer, ground-disconnected or conflicting route is promoted.

Fresh editable source699 completes all three phases in518.362
seconds, actual exit1 for exactly two unchanged bus-skew failures, with no timeout
or signal and unchanged definitions. Locked Node/Bun/tscircuit/solver/checker pins
and reviewed checks SHA256 remain fixed. Qualification700/701 exits0: numeric
pad mappings/connectivity, all four refilled layers, every KiCad rule severity,
exclusions, native reconstructed fills and isolated all-layer Gerbers pass.

Layer inventory `dist/g350-ddr-bus-lanes-smoothed-verified-700/layer-lengths.json`
separately shows byte0 planar spread8 mm and2–7 transitions; byte1 planar spread
5.244406 mm and2–6 transitions; command planar spread8.056480 mm and2–6 transitions.
No package, dielectric, layer-specific propagation, barrel/stub or coupling delay
model is supplied. Geometric matching cannot establish electrical timing.

Connected restoration is hash-indexed in
`checks/integrated/g350-bus-lanes-timing-progress/connected-source-698-701-manifest.json`.
Planning archives preserve actual helpers/options/inputs/logs/failed controls.
Verify exact archive hashes, fresh/repeat/in-place restore and refusal to replace
edited evidence. Frozen25814 files and pre-existing user edits are preserved.
Continue from source699, preserve all older checked fallbacks, and never treat
this checkpoint as fabrication or ordering readiness.

The complete reusable Start commands are persisted in
`cloud/START_BUS_LANES_SMOOTHED_CHECKED_2026-10-10.sh`. Direct repeat708 has
actual execution-tool exit0 and verifies Node/Bun/native pins, all eleven
upstream references, KiCad/pcbnew/wx, frozen25814 files, all checked restoration
archives and four meaningful geometry controls. Initial707 also records Start
subprocess0, but its outer execution session reports1; this discrepancy is
preserved and the direct complete708 result is used. Startup evidence is archived
and passes all five restoration controls. Install revision19 remains unchanged.

`cloud/BUS_LANES_CONNECTION_OBSERVED_2026-10-10.json` records this connected
running environment, spec4, all twelve observed repositories and ten additional
domains. Network-policy observation is unknown; saving a draft does not activate
a policy, publish an environment or prove restoration in a new task.
