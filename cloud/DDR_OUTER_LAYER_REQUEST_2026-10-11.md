# Latest runtime and Top/Bottom DDR request

Date: 2026-10-11, Africa/Tripoli. The requested DDR signal layers are now **Top
and Bottom only**, on the existing four-layer board, using public Bus Lanes.
That routing change is **not solved or promoted**. The protected connected
fallback remains source836 / KiCad837 / Gerber838. It connects49 DDR signals and
all217 board connections, but only CASn, CK, CKn and A8 already use outer layers
exclusively. Its native byte0 skew is0.574882 mm; byte1 is4.211624 mm and
command/clock4.410969 mm against0.635 mm. All pairs pass0.127 mm. Fabrication
readiness remains false.

The registry's latest tscircuit wrapper **0.0.2819** is installed and locked.
Core0.0.2107, CLI0.1.2258, props0.0.695, checks0.0.242 and the reviewed routing
dependencies remain. All 34 compared lock records retain their exact versions
and integrities, including the reviewed solver/checker pins. Two nested npm overrides retain the wrapper's
capacity-autorouter0.0.958 and fanout-solver's capacity-autorouter0.0.718; the
direct board capacity-autorouter remains0.0.962. This updates the wrapper, not
every overridden dependency to its latest release. Upstream HEAD is inspection
material; all eleven pinned upstream references remain unchanged.

An isolated fresh source replay completes in660.867517 seconds without a timeout
or source-definition changes. Every record except project metadata exactly
equals checked source836, including all copper, pads, holes, placements, logical
connections and constraints. All three routing phases report zero routing
errors. Complete build exit1 is exactly the same two bus-skew errors. Latest
compiled SHA256 is53d31ea87c236be8e4f1c89e77e31df97567abf3f261d92a063d9f241f29c38f.
The reviewed checks SHA remains
1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc.

Main npm installation, full typecheck, cloud smoke and the complete saved Install
script all exit0. Smoke verifies KiCad10.0.6 Python/wx, isolated Gerber shorts and
the preserved mechanical-envelope check. The original25,814 evidence files still
match their hashes. The KiCad image/archive remains under ignored .cloud-tools.
Bun1.3.14 cannot apply nested overrides. An initial lock refresh also receives a
GitHub API403. Importing the tested npm lock avoids that resolution; its first
frozen repeat normalizes serialization, and the next frozen repeat retains the
same hash. A fresh Bun dependency install is not claimed. Installation uses npm;
no TLS/checksum verification or native assertion is disabled.

Public Core BusLanes trials911–913/915–917/920 restrict signal wires to the outer
layers, preserving actual pads and foreign copper. Whole-bus coupled attempts
time out or fail legal coupled/package approaches. Separate uncoupled access
diagnostics also fail or time out; the actual source's pair constraints remain.
Pad-first BusLanesPipeline preparation923/924 cannot find a collision-free local
dogbone assignment. The shifted peripheral planning host922 moves one legal
1.693503 mm Top carrier to Inner1 and passes physical checks on its explicitly
open geometry; all49 DDR carriers are still missing there. It is not a board.
The first open-host diagnostic921 mis-associated terminal vias with removed
carrier IDs;922 corrects those temporary stub associations. Neither is promoted.

Guarded manual batches914/918/919/925 find respectively19/10/20/21 trial paths
out of49 and fail mandatory full physical checks.925 applies the stricter via
copper reserve, raster margin and fixed-escape guards, but remains incomplete
and has overlaps/self-shorts/clearance failures. An individual RESETn merge927
against the entire connected board also fails clearance checks. No trial is
accepted as a connected or timing-qualified Top/Bottom result. Current native
BusLanes package approaches need redesign; these bounded failures do not prove
the hardware is mathematically unroutable.

The earlier inner-layer improvement898 and CASn restoration909 retain a KiCad
ground open. Numeric diagnostics identify RAM ground pins92/94; native ground0
did not establish independent connectivity. They are rejected and archived.
Previous planning846–896 and their existing restoration controls remain intact.
Preserve the user's two pre-existing script diffs; their combined SHA is
349912589330f6030862a7c26f22a5d8a8a9b8bbe09f9a04fc74a28bdbd21fb8.

The integrated summary and hash-indexed archives are under
checks/integrated/g350-outer-ddr-request-2026-10-11. Restore the runtime archive
for normal startup; rejected planning archives are on-demand evidence. Each
archive is checked by archive verification, fresh restoration, repeat
restoration, in-place verification and refusal to overwrite an edited fixture.
The full Start script is cloud/START_OUTER_DDR_RUNTIME_2026-10-11.sh.

Next work is joint CPU/RAM package fanout and legal outer-layer carriers, followed
by fresh editable-source replay and complete independent connectivity, ground,
manufacturing, all-rule/all-severity DRC and all-layer shorts checks. Keep timing
and pair limits unchanged. Native1.6 mm per transition is a heuristic, not
electrical delay; clock/stackup/package/via models, returns/coupling/PDN,
footprints, Linux and measured original-shell fit remain unqualified.
