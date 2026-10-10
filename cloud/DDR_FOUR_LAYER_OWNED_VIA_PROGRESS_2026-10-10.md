# Connected G350: four-layer DDR length progress

Latest checked continuation (2026-10-10 UTC): use
`experiments/am3352-g350-full-board-four-layer-owned-via-replay.circuit.tsx` and read
`cloud/DDR_FOUR_LAYER_OWNED_VIA_PROGRESS_2026-10-10.md` plus `checks/integrated/g350-four-layer-owned-via-progress/summary.json`.
Fresh source737 / KiCad738 / Gerber739 retain all217 connections, 49DDR,
298 ground ports, 1,032 numeric ports, 280 placements and824 standard through-vias.
Native physical/manufacturing checks, all-rule DRC errors/warnings, opens,
dangling copper and all-layer shorts are zero. Byte0 passes0.574882 mm;
byte1 5.561624 mm and command/clock6.464305 mm still fail0.635 mm.
All differential pairs pass0.127 mm. Build exit1 is solely those two failures;
complete source/CAD/Gerber qualification exits0. fabricationReady=false.
Four-layer matching includes CASn's existing top/bottom route. Two owned A0
barrels move within1.5 mm; all original hole identities, dimensions, full depth,
CPU/RAM endpoints, peripheral copper, placements and source constraints remain.
Exact planned copper and hole records are reproduced by the fresh source.
Public pinned BusLanes remains the starting point and its default adapter is
retested by744. Keep all runtime pins and reviewed native checks.
Native length includes1.6 mm per transition, not qualified electrical delay.
Clock/stackup/package/via delay, impedance/coupling/returns, PDN/footprints,
Linux and measured shell fit remain open. The board is not ready to order.
Preserve source699/643/610/591/565/540/532/319 and all frozen evidence.
Short-D9 planning730 and the still-incomplete parent724 must not be promoted.
Further candidate edits require full independent qualification.

| Native group | Source699 mm | Fresh source737 mm | Limit mm |
| --- | ---: | ---: | ---: |
| Byte0 | 0.574882 | 0.574882 | 0.635 |
| Byte1 | 5.766561 | 5.561624 | 0.635 |
| Command/clock | 8.056486 | 6.464305 | 0.635 |

All217 authored connections, all49 DDR, all298 grounds and all1,032 required
numeric pads remain connected. Original standard0.4572/0.254 mm through-vias
stay824. All280 placements, RAM90, four layers and the provisional outline
remain exact. Every physical/manufacturing native check passes, as do all-rule
KiCad errors/warnings/opens/dangling copper and all-layer Gerber shorts. No
severities or exclusions are ignored. This does not establish ordering readiness.

The earlier inner-only pass skips CASn because its route uses top and bottom.
This milestone permits all four layers while requiring fresh ground after every
retained matching unit. The existing A9 Inner2 restriction protects its checked
ground corridor. Batch724's first complete round retains33 units and passes full
physical and fresh-ground checks. Its parent is paused during independent Docker
verification; immutable snapshot734 contains the exact completed candidate,
matched report/checksum, actual helper copies and paused log. The eight-round
parent is not complete, and intermediate round2 proposals are not qualified.

Selected-layer relaxation714 shortens A0 by0.045516 mm and D12 by0.104937 mm
with all original holes and peripheral records exact. The corrected best-retained
owned-via search731 further shortens A0 by0.346665 mm while moving only its
middle physical barrels pcb_via_79 and pcb_via_81. Hole identity, owner, standard
dimensions and full depth stay fixed, as do endpoint barrels and CPU/RAM pads.
Every relocation is bounded to1.5 mm and retained only after actual full physical,
manufacturing, via-count, continuity, thickness, constraint and fresh-ground
checks. An initial727 search-loop issue is preserved as diagnostic history;
729 tests a conservative correction, and final731 safely restores the previous
accepted route on rejection and retains the best valid shorter proposal.

Merge735 rejects conflicting DDR edits and checks every immutable logical,
peripheral and foreign-hole record. Owned A0 hole positions are the only declared
non-trace differences. Full physical/fresh-ground checks pass and no complete bus
regresses either input. Saving736 preserves the original49-path order so Core's
physical identities remain stable. Fresh source737 reproduces every exact planned
hole record and canonical DDR wire/via geometry; only duplicate co-located wire
points introduced by replay are ignored in that geometry comparison. All source
constraints, all unselected barrels and all terminal pad endpoints remain exact.
The existing strict planar comparators/qualification scripts are unchanged;
explicit owned-via variants define this separate, bounded preservation contract.

Fresh source737 finishes all three phases in435.260 seconds.
Its actual exit1 is precisely two pcb_bus_length_skew_error records, with no
forced timeout or signal and unchanged definitions/runtime pins. Existing LCD and
battery insertion-direction notices remain mechanical work, as in source699.
Qualification738/739 exits0. Independent refill confirms217/217 connectivity,
1,032 numeric pads and298 ground pads, every rule severity/exclusion, reconstructed
native pours, standard full-depth holes and isolated Gerbers on all four layers.

Current shortest/longest values are D9=49.323072 mm versus D8/D12/DQM1=54.884696 mm,
and CASn=45.402033 mm versus A0=51.866338 mm. All three differential pairs pass
0.127 mm. Separate layer inventory reports byte0 planar spread8 mm with2–7
transitions, byte1 planar spread6.216030 mm with2–6, and command planar spread
8.031011 mm with2–6. Native1.6 mm-per-transition accounting is not an electrical
delay model. No stackup/package/barrel/stub/coupling qualification is claimed.

Other diagnostics are preserved: real portal attempts710–712 find no planar
route;715/716 find physically legal but longer fixed-barrel paths;718–720/726
find no alternative-layer bridge;722/723 cannot create their requested combs.
Two-new-barrel trial728 finds no proposal. Short-core730 finds a physically legal
D9 path19.946551 mm with no new holes, but it regresses byte1 skew and is not
adopted. Whole-middle D12 trial732 finds no bridge;733 is longer and fails actual
via spacing. No partial, longer, ground-disconnected or rejected route is promoted.

The public Core0.0.2107 SOLVERS.BusLanesSolver adapter is regression-tested by744:
A6's historical Inner1 carrier shortens6 mm, actual child exit0, no signal/timeout,
source bytes unchanged, all native/manufacturing/fresh-ground checks pass. Optional
real portal wires never alter the rules, and their rejected proposals are retained.
Upstream HEAD is not substituted into the pinned board runtime.

Compiled source SHA256: ddf9bf33b80f43296f1b55f833d3afcc6c9cee2c27c036a5f5e9ac2d8104f685
Fresh filled source SHA256: 1cd40c9395374d3136652ce00e34b7b6949ca78454837f1e9584222716f0c2f2
Independent KiCad SHA256: f4ab6aff5ebe2a3c0da6fc190269eeaac314c8a67a836dc3e7ded3c0bea2f7da
Snapshot: dist/g350-ddr-four-layer-owned-via-verified-738/pcb-all-layers.png

Connected and diagnostic archives in `checks/integrated/g350-four-layer-owned-via-progress` use exact file hashes. Each passes
archive verification, fresh restoration, repeat restoration and in-place checks
(exit0), plus edited-evidence refusal (exit1 with the edit preserved). The active
parent724 is not archived as a finished run; snapshot734 is the checked boundary.
All25,814 frozen transfer files, hardware sources and prior fallback archives remain.
The tested Install/Start and exact12 repository refs are saved separately in the
environment draft. Saving configuration does not publish or prove new-task restore.

Complete Start746 prints child exit0 but the outer tool reports1; both outcomes are preserved. Direct exact-command repeat747 is authoritative and has actual outer exit0. It verifies Node25.6.1, Bun1.3.14, locked runtime/native patch, all11 upstream references, KiCad10.0.6/pcbnew/wx, all25,814 frozen files, old/new connected archives and four meaningful routing-geometry controls. Host routing Python is3.12.14 with NumPy2.3.5, SciPy1.17.0, Shapely2.1.2 and GEOS3.13.1. The existing646-character Install is retained.
