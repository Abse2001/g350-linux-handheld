# Whole-board routing progress — not a fabrication release

The checked DDR-only continuation remains
`experiments/am3352-g350-ram90-zero-skew-replay.circuit.tsx`. Its frozen 49/49
connections and zero native skew evidence are unchanged. The user subsequently
requested routing the rest of the board. `fabricationReady` remains false.

The whole-board trial retains 280 components, RAM rotated 90 degrees and four
76 × 118 × 1.6 mm provisional copper layers. The clock layout moves C_XTAL_IN
to (9.5, 23) and R_XTAL_DAMP to (16, 18); R_XTAL_BIAS_DNP remains at its original
(12, 16.4). Authoritative routing-disabled source definitions are saved in
`dist/g350-clock-cluster-source-verification-08/compiled.circuit.json`.

## Independently checked checkpoint

`dist/g350-full-board-clock-complete-01/candidate.circuit.json` has:

- Zero errors in all ten native copper checks, pad/pad clearance, the strict
  manufacturing via/track check, source trace widths, routing constraints,
  trace length/via limits, component placement and board/keepout checks.
- Independent KiCad 10.0.6 connectivity of 216/217 authored connections:
  all 49 DDR channels and every signal and power net pass. Ground remains
  disconnected, with 87 pad memberships outside the first pad's component.
  That count is not the number of ground islands.
- Zero independent manufacturing errors, no ignored checks and no DRC
  exclusions. Numeric pad identities are checked for every connection.
- Three native port-metadata errors and three native whole-DDR-bus skew
  errors. These failures are retained, not waived. USB coupling/skew and
  full electrical timing are not qualified.

Reports are in `dist/g350-full-board-clock-complete-01/native.json` and
`dist/g350-full-board-clock-complete-01-kicad/filled/`. The default board and
all older evidence are unchanged. This checkpoint is not promoted as a
fully checked whole-board design.

## Ground repair in progress

The dense signal fanouts left insufficient legal standard via sites for ground.
The current `dist/g350-full-board-ground-rematch-01/` trial permits reversible
signal rip-up, routes ground first, and then protects its copper while recovering
signals. Its model joined all 296 required ground pads after 31 bridges; 47
signal nets were displaced. Completion requires the final connectivity model,
fresh numeric KiCad connectivity and manufacturing checks after plane refill.
Historical successful events alone do not demonstrate final connectivity.

## Reproducible routing tools

Run `source cloud/env.sh`, then `bash scripts/setup-g350-routing-tools.sh`.
Official wheel hashes pin isolated NumPy 2.3.5, SciPy 1.17.0 and Shapely 2.1.2.
The C++17 grid engine is compiled from source. Installation and reinstallation
passed real planar-path, forbidden-corner and layer-change checks; exact tested
versions and hashes are in `cloud/ROUTING_TOOLS_VALIDATION.json`.

Node/Bun/tscircuit lockfiles and the reviewed native checks patch are unchanged.
Grid routing does not replace native or independent validation. A router clock
length estimate was corrected to sum actual centerlines instead of buffered
segment area, whose rounded caps incorrectly inflated length. The declared
10 mm clock constraints and native checks remain enforced.

Fresh independent exports omit provisional core ground-fill records and rebuild
ground zones around the exact routed copper. KiCad ground-layer flags are CLI
arguments, because the isolated KiCad wrapper does not forward arbitrary host
environment variables. An all-four-layer ground-fill diagnostic did not resolve
the trapped package pads and is not promoted as the source stackup.

Package/via delay, nominal DDR lengths, impedance, return paths, PDN, USB signal
integrity, Linux bring-up, measured original-shell fit and assembly/release gates
remain unfinished. Do not order fabrication from these trials.

## Overnight recovery update (2026-10-07)

Fresh all-four-layer fills reduced one intermediate snapshot to five disconnected
ground pads. Two legal bridges and a negotiated third bridge joined that snapshot
in the router model. Subsequent signal changes fragmented other ground regions;
an independent later snapshot still had 17 ground pad memberships outside the
first component. Consequently no ground-complete or whole-board-complete claim
is made from the model. Every final candidate needs a fresh fill and numeric check.

Whole-trace rip-up repeatedly displaced long power branches. The new routing
worker can retain via lands and trim only actual conflicting wire sections.
Package exits are now allocated before global wiring: Hungarian assignment,
reserved planning lands and unused spare sites avoid consuming later exits.
Planning reservations never enter the copper connectivity graph or exports.
The remaining CPU analog pad is attached to an existing physical same-net via.

`dist/g350-post-ground-shared-analog-07/candidate.circuit.json` passes all ten
native copper checks, strict manufacturing via/track clearance and source widths.
This is an escape-only geometry checkpoint: its full routing checks correctly
fail for incomplete channels. Independent KiCad retains two off-centre ground
via contact errors for subsequent repair; no check is ignored or excluded.

The active continuation is `dist/g350-full-board-fixed-fanouts-recover-06/`:
standard package escapes are fixed, the six checked DDR pair paths are retained,
the other DDR channels are reconnected first, and peripherals follow. The earlier
clock-complete checkpoint, all failed/interrupted runs and the zero-skew DDR-only
reference remain preserved. Cached experimental source is not a fully checked
board and must not be promoted merely because its routing callbacks finish.

Routing-disabled compilation of the candidate with four ground pours passes.
`dist/g350-full-board-four-pour-source-definitions-01/comparison.json` proves
all source nets, trace constraints, numeric ports and 280 placements are exactly
the same as the accepted two-passive clock layout. A routed source replay is
still required. The second cached full replay preserves native physical/strict
clearance but fails incomplete-ground and three DDR bus-skew checks.

Routing-tool installation/reinstallation, startup pins/upstream assertions and
the cloud smoke suite passed. The reusable environment Install script now runs
the verified routing-tool installer after `scripts/setup-cloud.sh`; Start
instructions initialize `cloud/env.sh`, verify the isolated tools and keep
startup from routing hardware. All twelve repositories and ten additional
domains remain saved. Configuration persistence does not publish the environment.

Checked and failed checkpoints are preserved in
`checks/integrated/g350-full-board-progress/checkpoints.tar.gz`, with every
member indexed by SHA256 in `checkpoint-manifest.json`. Supplemental source
and solver input are in `source-inputs.tar.gz` and `source-input-manifest.json`.
Restore into ignored output paths with `tar -xzf ARCHIVE --keep-old-files`,
preserving existing evidence, and verify the archive/member hashes first.
`summary.json` explicitly marks the whole-board checkpoint as partial.

Long package fanouts need the declared 4 mil escapes through their complete
via field. The router's optional `G350_GRID_ESCAPE_MARGIN=3.9` covers the
allocated 3.6 mm fanout sites; wider rail trunks resume beyond this region.
Source widths, the original minimum clearance and explicit USB/clock widths
remain enforced. No native constraint is lowered by this routing-region change.

The isolated critical-access seed in
`dist/g350-fixed-escape-access-diagnostic-08/` connects DDR_ZQ, CPU_PORn and
all eight DDR_VREF pads in the model while preserving the fixed package exits.
All ten native copper checks, strict manufacturing, pad/pad, widths and dangling
checks pass for this seed. Full routing still fails as expected for its other
unfinished nets. These target paths are reserved before later mutable vias can
trap their access. The hash-indexed `critical-access-seed.tar.gz` preserves the
actual seed, execution inputs and native failures; it is not a complete board.
The full checker now includes the pinned `checkDanglingTraces` check. Continuous
clearance failures retain obstacle diagnostics and reject the failed grid access
before retrying; clearances and source constraints are unchanged.
