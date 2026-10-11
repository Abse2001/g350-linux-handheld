## Latest checked partial result:18 outer-layer DDR channels

Trial1036 corrects the planning-only raster margin while retaining actual
0.1016 mm trace clearance,0.15 mm via copper and0.254 mm drill-edge limits.
It adds DDR_D3 to the preserved17 paths. Normalization1039 and joint physical
check1040 retain18 complete Top/Bottom channels with all16 local checks zero,
including all remaining package fanouts and42 references. The checked scene
SHA256 is `5e4abfcc38440ead3d86949b4e120cbb87cc3b6e3b2529fbe1c6d8e12c651fa5`. Fresh pinned CLI export1042 independently confirms18/49;
the unchanged numeric checker exits1 for31 missing connections. An initial
wrong solver-input path is retained as a failed call; the corrected call uses
947/placement-0/input.simple-route.json and validates all physical source pads.
The snapshot is `dist/g350-ddr-outer-only-checked18-joint-reservations-1040/checked-18-outer-ddr.png`.

Fine-grid1038 finds no additional path with17 locked. A separate rip-up
probe1041 finds6 raw missing-byte routes, proving the locked bundle affects
access, but2 overlaps and2 self-shorts reject that probe. Experimental
priority-name ordering now supports rerouting difficult signals first without
changing any physical or logical gate. Full routing remains unfinished.
Thirteen hash-indexed closed-run archives now preserve the checked18 result,
rejected plans and independent CAD diagnostics. Older17-channel results below
remain valid preserved history. No full source, matching, ground, all-rule CAD
or fabrication qualification is claimed; fabricationReady=false.

# G350 checked partial Top/Bottom DDR checkpoint

RAM is moved closer to the CPU at `(0,6)`, rotated90 degrees. The PCB remains
four layers, with every selected DDR signal wire on Top/Bottom. All hardware
sources, frozen evidence and the last connected source836/KiCad837/Gerber838
remain preserved. No new board is promoted; fabricationReady=false.

## Actual progress

Trial1027 contains17 complete CPU-to-RAM DDR channels and32 missing. Its
`physical-with-all-local-reservations.circuit.json` SHA256 is
`cdd16946e83d33d9d4a2cb4b8dd832f4d273e398aa969a27c66a853938ece1f5`.
All16 native physical/manufacturing/width/via-count/contiguity/constraint checks
are zero with all missing CPU/RAM escapes and42 real RAM reference fanouts
included as obstacles. Selected actual paths and foreign copper are preserved.
Trial1018 found four more channels beyond the previous13. Its3 self-shorts
were rejected, then normalization1025 removed them and independent selector1027
qualified the17 paths. The checked snapshot is `checked-17-outer-ddr.png` with
source/report SHA provenance. It illustrates local routing, not a finished PCB.

Pinned CLI fresh-export1028 succeeds. The unchanged numeric KiCad connectivity
checker verifies all source physical contacts and confirms17/49 DDR connections;
it exits1 for32 missing pad memberships. Raw CAD represents some vias twice;
canonical preparation1032 removes exact duplicates and retains777 unique
0.4572/0.254 mm full-depth physical holes. Four copper layers are retained.
DSN1033 audits and locks all14,475 wire edges plus777 physical vias. There are
1,032 required active source ports,1,161 source physical ports including NC,
1,165 copper land records and2 NPTH FPC guides. These counts measure different
things; no pad or missing-connection assertion is waived.

Power1022 and ground1026 recover18 power and21 ground approaches on Inner1/2
with13 complete DDR paths physically compatible. Separately,1024 recovers both
VREF approaches after a checked single-barrel move1023; that reference-only
artifact has41 external approaches but no full DDR carriers. Compatibility of
all41 references with17 DDR paths is not yet proved. ZQ and other removed
peripheral/reference branches still require reconstruction.

## Bounded failures and diagnostic limits

Public Bus Lanes1007 fails at its aggregate iteration limit. Trials1010 and1017
reach wall timeout while not solved and not failed;1017 records839,734 public
steps. No unfinished/failed solver output is accepted. The source's49 connections,
primary buses and differential-pair assertions remain intact. Manual1011 times
out after only round0 completes;1015 completes all three requested rounds but
fails physical checks. These outcomes are archived as rejected/incomplete work.

The additional official Freerouting2.5.0 planner1034 completes8 passes on the
locked17 input, restricted to Top/Bottom DDR and all other nets ignored for
routing. Its imported model reports869 existing clearances, inconsistent with
native checking; none of its output is accepted. Read-only rule/pin diagnostics
are retained. The initial DSN uses0.254 mm via copper spacing, an overconservative
interpretation of the board's independent0.254 mm drill-edge limit. Native
via copper minimum is0.15 mm. Manual1035 corrects that planning distinction,
retaining both actual limits and all checks, but finds no added channel.

All-rule/severity KiCad diagnostic1037 runs on a separate copy without pours or
library/ink reconstruction: zero copper-clearance violations,350 opens,144 dangling
vias,62 dangling tracks,4 track-to-via centering errors,199 footprint library
issues,199 silk overlaps,199 silk-over-copper issues and5 silk-edge issues.
No checks are ignored. DRC exits5. This is not full board qualification or a
fresh filled source/CAD/Gerber pass; missing branches remain intentionally open.

## Reuse and next work

Eleven archives now restore all closed work through1034, with complete file
hashes, fresh/repeat/in-place restoration and refusal to overwrite edited local
evidence. The reusable Start restores these artifacts, sources cloud/env.sh,
verifies the checked17 source hash, actual outer-layer routes and independent
numeric connectivity result, and keeps fabricationReady=false. The official
optional router/tool archives remain ignored under .cloud-tools; the tested
ensure-g350-outer-freerouting-tools.sh reconstructs or verifies them.

Keep tscircuit0.0.2819 and all reviewed core/CLI/checker/solver pins plus native
patch SHA1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc.
Do not alter the two pre-existing protected RAM90 helper changes. Source836
SHAc30da726262185a29e5a7c05009a97553ae454147c81a4d2f4c6d0632298d936
remains the fully connected fallback, with two matching failures and inner DDR.

Complete49 compatible outer channels and all references first. Promotion then
requires fresh editable source,217 connections,298 grounds,1,032 active source
ports, all native matching/physical/manufacturing assertions, every independent
KiCad rule/severity, all-layer shorts and fresh Gerbers. Electrical clock/stackup/
package/via delay, impedance/coupling/return paths, PDN, footprints, Linux and
measured shell fit are still unfinished. The board is not ready to order.
