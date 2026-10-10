# G350 connected board: RAM-end DDR length progress

Latest checked continuation (2026-10-10): use
`experiments/am3352-g350-full-board-reverse-window-replay.circuit.tsx`
and read `cloud/DDR_REVERSE_WINDOW_PROGRESS_2026-10-10.md` plus
`checks/integrated/g350-reverse-window-progress/summary.json`.
Fresh source643 / KiCad644 / Gerber645 retain all217 connections, 49DDR,
298 ground ports, 1,032 numeric ports, 280 placements and824 standard through-vias.
Native physical checks, all-rule DRC errors/warnings, opens, dangling copper and
all-layer shorts are zero. Byte0 passes0.574882 mm; byte1 6.973572 mm and
command/clock8.600328 mm still fail0.635 mm. All differential pairs pass.
Build exit1 is solely those two failures; full qualification exits0.
Inner-layer tuning now scans bend/block windows from the RAM end, preserving
original barrels/endpoints, outer-layer wire points, peripheral copper and logic.
All pins, minimum clearances, physical and fresh-ground assertions stay fixed.
Native length includes1.6 mm per transition; electrical timing, stackup,
PDN/footprints, Linux and measured shell fit remain unqualified.
Preserve source610/591/565/540/532/319, BusLanes bootstrap and frozen evidence.
Rejected631/635/639 lose215 ground ports; do not promote those candidates.
Keep fabricationReady=false. The board is not ready to order.

| Native group | Previous source610 mm | Source643 mm | Limit mm |
| --- | ---: | ---: | ---: |
| Byte0 | 0.574882 | 0.574882 | 0.635 |
| Byte1 | 7.333572 | 6.973572 | 0.635 |
| Command/clock | 9.650328 | 8.600328 | 0.635 |

All49 DDR and217 authored board connections remain present. Full-depth
0.4572/0.254 mm vias stay824; all280 placements and original terminal/barrel
coordinates are exact. RAM stays90 degrees and four physical copper layers remain.
The peripheral copper and original native constraints are unchanged. Byte0 and
all three differential pairs pass their existing limits. Two complete buses fail;
these are geometric lengths, not qualified electrical delay.

The tuner adds optional `G350_LENGTH_WINDOW_ORDER=reverse`, examining the same
rectangular bends, blocks and individual bends from the RAM end. Default `forward`
retains the previous order. No clearance, manufacturing, native length, layer,
terminal, via, immutable-geometry or fresh-ground assertion is changed. CLI641
rejects `sideways` before any proposal, actual exit1, with unchanged source bytes.
Syntax checks pass. Positive640 performs two rounds with fresh ground checked
for every accepted unit and batch; all retained checks are zero. It starts from
connected inner-only626 and large-block638, preserving A9's protected layers.

The broader631 search did not check ground per edit and produced215 actual GND
port errors in stable snapshot635. It was stopped with actual signal exit143;
this is retained failure evidence, not a completed qualification. Restoring A9
alone in639 still leaves215 errors. Ground-guarded636 refuses that baseline with
exit1 before proposals. None of these candidates is promoted. D12 partial-span
reconstructions633/634 pass physical checks but lengthen D12 from55.276643 to
56.637558 mm and are rejected;632 finds no path. Earlier627–630 reconstruction
attempts also find no clearance-preserving path. Original frozen hardware evidence
and pre-existing user edits remain unchanged.

Fresh editable-source643 completes all three phases in516.901
seconds, actual exit1 for exactly two bus-skew failures, no timeout or signal.
Original definitions, reviewed checks hash and lockfile pins are verified.
Independent644 checks numeric-pad connectivity, all298 grounds, all1,032 ports,
every KiCad rule/severity and exclusions; all errors, warnings, opens, dangling
tracks/vias and slivers are zero. Gerber645 checks all four layers for shorts,
actual exit0. The full qualification wrapper exits0.

Compiled SHA256: `216050a945c4f790c0c7cf34883fbf851db42e2ce2f7f36ed27ae7ab5fec84f6`.
Fresh-filled SHA256: `cea5fddea907c75c3a668493c6520ce3379932d4c3f8bcb880c0ecfb06af0967`.
Summary: `checks/integrated/g350-reverse-window-progress/summary.json`.

```bash
source cloud/env.sh
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-reverse-window-progress/connected-source-642-645-manifest.json
```

Archive: 450 exact-hash members, 16362394 bytes,
SHA256 `2567c78fa48e5c46f646212208ca6e0c63f11770c7248667ae3fc4675a63f8d2`. Archive verification, fresh, repeat and in-place
restoration pass0. Edited-file refusal exits1 and preserves the edit; see
`checks/integrated/g350-reverse-window-progress/restoration-proof.json`.
Planning archives preserve all executed options/helpers and actual failed trials.
The refreshed complete Start shell passes0 (runtime647), verifying all25,814 frozen
files, all11 upstream/runtime pins, KiCad10.0.6 archive/Python and geometry controls.
It retains the unchanged
tested Install script, all12 repositories and package-manager preset plus10 domains.
Saving a draft requires user review/save/publication and does not prove a fresh task.

Next work must close remaining native length spread while preserving complete
ground connectivity. The pinned BusLanes refinement API validates planar wire-only
lanes; feeding these full multilayer/via routes directly is unsupported. Preserve
its native bootstrap and use layer-aware proposals with full independent checks.
Obtain target DDR clock and manufacturer stackup to qualify actual package,
via/stub delay, impedance, coupling and return paths. PDN/footprints, Linux bring-up
and measured original-shell fit remain unfinished. **Not ready to order.**
