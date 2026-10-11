# G350 checked22-channel Top/Bottom DDR placement

The RAM is now tested at `(0,6)`, rotation270 degrees, the opposite side
orientation. The PCB remains four layers. This placement improves the checked
local result from18 to22 of49 complete CPU-to-RAM DDR channels, with27 missing.
All selected DDR wires use Top/Bottom and all physical barrels remain standard
0.4572/0.254 mm full-depth vias. No board is promoted; fabricationReady=false.

Reversible preparation1049 changes only RAM physical orientation and its exact
numeric pad positions on an explicitly open input. Logical nets, all other
placements, foreign copper, source bus/pair constraints and hardware sources
remain unchanged. Joint fanouts1050 reserve49 CPU plus91 RAM escapes and pass
all local physical checks. Manual1051 finds22 paths but has5 self-short/overlap
reports; those raw paths are rejected. Normalization1053 removes the backtracks,
and independent selection1054 qualifies all22 against remaining CPU/RAM escapes
and42 real RAM reference reservations. All16 native physical/manufacturing/width/
via-count/contiguity/constraint/edge checks are zero. Scene SHA256:
`5c34ae674ce0c6aedf66a8e4736f3bbff72dfaa806af9e66be6cae529a882ca0`.

Fresh pinned CLI export1055 succeeds. The unchanged numeric KiCad checker
verifies every physical source contact and independently confirms22 DDR
connections with27 missing, correctly exiting1. The snapshot
`dist/g350-ddr-outer-only-ram270-checked22-joint-1054/checked-22-outer-ddr.png`
plots actual checked copper and derives its270-degree label from the source.
No all-rule filled CAD, all-layer Gerber shorts or new editable whole-board
source replay is claimed for this partial plan.

Public Bus Lanes1052 reserves the same140 fanouts and49 primary-bus members,
retains0.635 mm bus and0.127 mm pair limits, and reaches its200,010 public-step
cap while neither solved nor failed. No partial output is accepted. The manual
checkpoint is experimental; this bounded solver outcome does not prove hardware
unroutability. Earlier25-curve exact selection at RAM90 retains at most18 under
that particular conflict graph. Both checked90-degree18-channel alternatives
and source836/KiCad837/Gerber838 remain preserved.

Power/ground/VREF reconnection proofs1022/1026/1024 apply to RAM90 only. They
must not be combined with22 RAM270 channels into a claimed connected board.
All27 missing DDR channels, the external RAM references and removed calibration/
power/ground/LCD/peripheral branches still require reconstruction. Complete
qualification then needs fresh editable source,217 board connections,298 grounds,
1,032 required active source ports, all native matching/physical/manufacturing
checks, every KiCad rule/severity and isolated all-layer Gerbers/shorts. There
are1,161 physical source ports including NC,1,165 copper lands and2 NPTH guides.
Electrical clock/stackup/package/via delay, impedance/returns/PDN/footprints,
Linux and measured shell fit remain unfinished. The board is not ready to order.

Runtime tscircuit0.0.2821 is installed and verified by full source1044, typecheck
and Linux verification; all345 other npm lock records and the reviewed native
patch remain. Read cloud/RUNTIME_REFRESH_2026-10-11_2821.md. Sixteen closed-run
archives restore every completed checkpoint with file hashes, fresh/repeat/
in-place controls and edited-file refusal. Start sources cloud/env.sh and
verifies the latest wrapper, frozen fallback and checked22-channel source/CAD
proofs. Save/publish the prepared environment separately from board fabrication.
