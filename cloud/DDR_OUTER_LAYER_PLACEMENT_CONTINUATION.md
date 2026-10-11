Latest partial result: RAM `(0,6)`, rotation270; trial1054 checks22/49 Top/Bottom DDR channels and fresh KiCad1055 confirms22. Read cloud/DDR_OUTER_LAYER_22_CHANNELS_2026-10-11.md.27 remain missing; references/timing/full-board qualification are open. Earlier90-degree proofs are history. fabricationReady=false.

Latest partial checkpoint: trial1040 checks18/49 Top/Bottom DDR channels,31 missing. Fresh KiCad1042 confirms18. Read the latest section of cloud/DDR_OUTER_LAYER_17_CHANNELS_2026-10-11.md; prior17-channel notes below are preserved history. All board/timing qualification remains open; fabricationReady=false.

Latest partial interconnect result: read cloud/DDR_OUTER_LAYER_17_CHANNELS_2026-10-11.md. Trial1027 qualifies17 local Top/Bottom channels;32 remain missing. Older milestones below are preserved history.

# G350 Top/Bottom DDR placement and escape continuation

This is experimental routing work. No new board is promoted and
`fabricationReady=false`. The board remains four layers; the 49 DDR bus signals
must use Top/Bottom. Power, ground and the VTP calibration reference may use
the inner layers.

## Preserve the connected fallback

The checked entry remains
`experiments/am3352-g350-full-board-ground-preserving-clean-corners-replay.circuit.tsx`.
Source836 has SHA256
`c30da726262185a29e5a7c05009a97553ae454147c81a4d2f4c6d0632298d936`;
KiCad837 and Gerber838 remain unchanged. That checkpoint has 217 connections,
49 DDR signals, 298 grounds, 1,032 numeric pads, 280 placements and four layers.
Its byte1 and command matching still fail, and only four of its DDR signals
already use outer layers exclusively. It does not satisfy the current request.

The pre-existing changes in `prepare-g350-ram90-four-layer.mjs` and
`tune-g350-ram90-native-lengths.mjs` remain protected. Their combined diff hash
is `349912589330f6030862a7c26f22a5d8a8a9b8bbe09f9a04fc74a28bdbd21fb8`.

## Positive planning results

- The expanded placement screen957 tested 9,596 poses and found 650 with no
  modeled pad/copper/body collision. This is geometric screening, not exact
  package, courtyard or shell validation.
- Open host946 moves only RAM to `(14,1.2)`, rotation0. Host963 tests
  `(-16,37.2)`, rotation90. Both pass the 11 native physical/manufacturing
  preflight checks. Each removes 49 DDR carriers and 36 RAM reference traces
  for planning; those connections must be rebuilt before promotion.
- ZQ repair949 reconnects RAM's ZQ reference at the right-side pose and passes
  16 native physical/contiguity checks. The northwest ZQ trial965 times out;
  that host remains incomplete.
- VTP repair964 replaces only three Bottom calibration-reference pieces with
  one Bottom/Inner1 route and one standard 0.4572/0.254 mm full-depth via.
  All 16 planning checks pass; other copper and component placements remain
  exact relative to the open right-side host. This opens a CPU escape corridor.
- Trial966 then routes A1 and CSn0 on Top/Bottom with all 16 planning checks
  zero. These are two local successes, not 49 connected signals. Locking their
  provisional corridors blocks D8 in trial968; preserve the successful units
  without treating them as a completed bundle.
- Public native dogbones970 solve 49 local CPU escapes, but full native
  checking971 rejects two placements against existing ground/DDR power copper.
  Unqualified mixes974/977 also fail. Copper-obstacle trial978 reports no
  complete local assignment.
- Hybrid screen979 reverts conflicting escape chains to the original checked
  CPU stubs. Native980 retains 40 fresh escapes and nine original escapes.
  Every physical, manufacturing, width, via-count and routing-constraint check
  passes. The unchanged whole-connection checker reports **49 missing RAM
  endpoints**, as expected for a CPU-only fanout artifact. This is not a
  connected board or complete DDR routing.

Native checks run on isolated copies because they attach bookkeeping and may
annotate endpoints. Real pads remain hard obstacles, including conservative
bounding boxes for polygon pads. Standard full-depth via assertions and the
reviewed native checker hash remain in force.

## Bus Lanes input corrections

Only public `step()` and solved `getOutput()` are used. No failed or unfinished
solver's partial routing is accepted.

Trials959/961/967 stop at explicit public-step limits; those outcomes establish
neither solver failure nor success. Full-budget trial969 reaches the actual
`unsupported_outline` failure at step252004. The pinned solver rejects custom
outlines. Trial976 supplies a rectangular routing region inside the unchanged
mechanical outline; the checked minimum separation is18 mm. Actual source and
CAD must retain and validate the real outline.

Trial976 then exposes overlapping pair-bus declarations in the strict lane
input: `Missing or duplicated bus member source_trace_15`. Trial981 maps the
source constraints to four disjoint buses and three differential pairs. Every
pair's membership and0.127 mm tolerance are asserted equal to the source pair
bus. The three main buses retain0.635 mm maximum skew, and pair gap0.12 mm is
retained. The source bus declarations and native checks are unchanged.

## Current local milestone and continuation

Trial1005 jointly checks all49 CPU escapes and all91 connected RAM-ball escapes
at RAM `(0,6)`, rotation90. Native physical, manufacturing, width, via-count,
routing-constraint and board-edge checks are all zero. These140 local fanouts
are **not49 connected CPU-to-RAM carriers**. Their42 RAM supply/reference fanouts
still need external connections. Other removed reference/peripheral branches
must also be rebuilt. No fresh editable-source, KiCad or Gerber qualification
has been run for this pose.

The near-CPU pose previously rejected in942 has no component-body collision.
Its collisions come from old RAM/reference copper. Trial991 removes the seven
remaining RAM metadata/edge branches plus documented reference branches;
it still fails two pad-to-trace clearances. Trial992 additionally opens that
specific ground branch and passes all11 open-host physical/manufacturing checks.
Trial994 repeats the VTP corridor repair and passes all16 planning checks.

The original retained ODT Top approach runs through the new RAM footprint.
Strict CPU preflights995/996 refuse it. Four guessed local barrels998 fail;
999 refuses an unsupported layer in the new geometry adapter. Corrected guarded
repair1000 replaces only ODT's CPU approach and passes every local native
physical/manufacturing check for all49 CPU fanouts. The checker patch and its
limits remain unchanged. Inner copper still blocks drilling full-depth holes.

Uniform joint-fanout trial997 identifies four additional conflicting branches:
two DDR power branches, one ground branch and LCD_DATA4. The initial name-based
selector1003 refuses the unnamed LCD trace; corrected1004 verifies its actual
LCD_DATA4 source net before opening those four branches. Their exact removed
records are retained and must be reconstructed. Trial1005 then reserves all91
connected RAM balls together with the checked49 CPU fanouts and passes.

The current open routing input is
`dist/g350-ddr-outer-only-joint-ram-clearance-ripup-1004/incomplete-routing-input.circuit.json`.
Its49 old DDR middle sections are placeholders and must be removed for planning.
Use CPU reference
`dist/g350-ddr-outer-only-near-cpu-odt-guarded-1000/physical-only-cpu-escapes.circuit.json`
and joint RAM reference
`dist/g350-ddr-outer-only-joint-ram-checked-escape-plan-1005/physical-only-joint-escapes.circuit.json`.
The joint reference includes91 RAM fanouts,49 of which belong to DDR.

The extended planning adapters reserve the42 other RAM fanouts as hard copper
and include them in the native physical/manufacturing checks. Manual trial1006
finds49 carriers but is rejected for327 overlap reports,12 via-to-trace errors,
18 self-shorts,3 via-spacing errors and134 manufacturing-clearance reports.
Its full-source/reference/ground/timing/CAD checks remain unqualified.
Public dual-package Bus Lanes1007 is running with four disjoint buses and three
unchanged differential-pair constraints. Trial1008 directs fanouts toward the
RAM's central aisle and also passes every local physical/manufacturing gate.
Manual1009 finds49 paths, but native checking rejects306 overlap reports,
9 via-to-trace errors,17 self-shorts,1 via-spacing error and139 manufacturing
clearance reports. Global warm trial1011 tests stronger congestion penalties and
the whole routing window; it remains experimental until actual checks pass. Public1010 uses them with the solver's own
visibility/dense search defaults: the earlier helper's blanket20,000 expansion
cap was much smaller than its dense-search default1,000,000. No geometry or
matching limit changes. Read actual execution reports; running/failed/partial
outputs are not qualifying routes. Source `cloud/env.sh` in the existing checkout;
wrapper0.0.2819 and every reviewed Core/checker/solver pin remain unchanged.

## Other completed experiments

Corrected public trial981 fails at589140 steps with
`_BusLanesSolver ran out of iterations`; it is an actual solver failure, not the
800010 public-step cap. Trial1002 fails local dogbone assignment at step4.
Their full reports and inputs are retained.

Right-side manual982 finds49 paths but fails physical checks. Warm planning983
completes two negative rounds; overlap reports fall388→288→263, but22 via-to-trace,
14 self-short and12 via-spacing errors remain in its second completed round.
It was terminated during round2 to prioritize the closer pose; do not call the
requested six-round parent complete. Cleanup984 reduces self-shorts10→1.
Canonical interior coordinates987 change by at most4.18e-10 mm and reduce
self-shorts to zero without changing checker code, endpoints or constraints;
378 overlap reports and143 manufacturing-clearance reports remain.

At the right-side pose, VREF repair986 rebuilds both RAM VREF approaches and
passes physical/manufacturing and VREF net-contiguity checks. Power repair988
rebuilds18 RAM power approaches and passes the corresponding checks. Ground
trials989/990 stage18 of21 ground approaches with physical checks zero, but
three ground pads have no qualifying escape. Their strict21-approach acceptance
fails even though the broad net-contiguity checker reports no ground error.
These local reference repairs are not whole-board or filled-ground proof.

## Qualification and archived evidence

Promotion requires all49 real CPU/RAM channels on Top/Bottom, all217 board
connections and298 grounds, all1032 numeric pads, native matching, a fresh
editable-source replay, every independent KiCad rule/severity and all-layer
Gerber shorts checks. Reconstruct every removed reference/peripheral branch;
keep the mechanical outline and recheck the assembly envelope. Electrical
clock/stackup/package/via delay, impedance, returns, PDN, footprints, Linux and
measured shell fit remain open. `fabricationReady=false` throughout.

Eight closed-run archives under
`checks/integrated/g350-outer-ddr-placement-continuation` cover933–1009, excluding live1007.
Every archive passes hash verification, fresh, repeated and in-place restoration,
and refuses an edited fixture while preserving its edited bytes. No live1007/1010/1011 run is archived as complete. The connected source836/KiCad837/Gerber838
fallback and all earlier hardware sources remain unchanged.
