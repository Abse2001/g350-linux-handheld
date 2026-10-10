# DDR timing trial history and current continuation

The newly qualified continuation is source 319 / KiCad 320 / Gerber 321. Read
`cloud/DDR_GROUND_SAFE_BYTE_GROWTH_2026-10-10.md` and its integrated summary.
It preserves 217/217 connections and improves checked native skews to
15.124882 / 23.748074 / 24.300328 mm. Fabrication readiness is false.
The following history describes the earlier 8284474 baseline and isolated trials.

The preceding connected checkpoint is GitHub commit
`82844746daba9142fd11ae99e40805b4dd371b50` on `codex/cloud-handoff`.
Fresh source 209, filled KiCad 210 and Gerber 211 retain all 217 connections,
49 DDR signals and 298 ground ports with zero DRC errors, warnings, opens,
dangling copper or shorts. Its three bus mismatches remain
19.293662 / 25.185093 / 24.480252 mm against 0.635 mm. All pair limits pass.
Environment draft revision 18 selected this preceding source; the new Start
will follow the verified pushed continuation.

The new byte1 rebuild is an isolated experiment. Whole-byte source membership,
0.635 mm bus and 0.127 mm pair limits, all 280 placements, RAM90, four layers,
peripheral routing, runtime pins and the reviewed native patch remain intact.
The main source, checked caches, frozen evidence and fabricationReady=false
are unchanged. The isolated rebuild experiments below are not orderable boards or active entries.

Trial 271 matched D9, D12 and both strobes to 34.000 mm but blocked other
channels. Trial 279 routed data first and trapped the strobes; it was rejected.
Trial 285 routed short strobes first and completed ten channels, leaving D8
open. Trials 287/288 could not recover D8 with other trial routes fixed.

Joint planning 289 uses only unqualified staged byte1 middle copper as soft
search obstacles. All actual pads, original escape barrels and foreign routed
nets remain hard. Its first complete sweep passes every physical, manufacturing,
width, contiguity, routing-constraint and via-count check used by the planner.
Gate 290 independently requires a continuous path between the correct real pads
and actual full-depth barrels for all 49 DDR signals; it passes. This is still
not fresh editable-source or independent CAD qualification. Byte1 is unmatched;
its current native length range is about 18.155–46.463 mm and its strobe pair is
also unmatched. Fresh native ground diagnostic 291 reports 215 whole-net ground
errors, so this candidate must not be promoted. Independent freshly filled
KiCad diagnostic 292 verifies all 49 real DDR connections, but only 216/217
whole-board connections: RAM pins 92/94 and C_DDR_RAM_2 pin 2 are isolated from
main ground. There are zero clearance violations and two reported ground opens.
The actual DRC exit is 5 and numeric-connectivity exit is 1; the diagnostic
wrapper records those expected failures and exits 0. DDR identities are bound
to source-trace IDs, since physical net display names are not a valid classifier.
Ground bridge trial 300 found no valid repair. Trial 301 restored only the
checked non-byte1 outer spans while preserving the rebuilt byte, but was rejected
for two trace overlaps, one via/trace clearance error and three manufacturing
errors. Its explicitly unqualified ground diagnostic 302 still reports 215
whole-net errors. Coarse ground stitching 303 also found no valid repair. Finer
0.025 mm stitching trial 304 also finished without a valid repair; the same physical checks apply and
all existing DDR/peripheral copper stays untouched. None is a promoted source.

The native BusLanes diagnostic input needed actual source-trace aliases on
terminal-via obstacles. Native bus lengths also include fixed planar prefixes,
so the diagnostic target subtracts only the two native 1.6 mm barrel terms.
Corrected trial 286 produced two partial native carriers before its 90-second
search budget expired. This is a failed incomplete solve; all outputs remain.
No checker assertion, source bus or runtime dependency was weakened.

Control 273 proves the small tuning step adds an actual 0.05 mm of copper;
the earlier no-change progress bug is corrected. Control 274 rejects disconnected
pad-to-via prefixes despite the native per-port check accepting such prefixes.
Preservation control 280 passes the checked source and rejects changed peripheral
copper and incomplete channels. The stricter existing planar preservation gate
is unchanged; the separate byte1 gate binds any allowed barrel changes to an
explicit real donor and preserves all other physical barrels.

Completed inactive planning outputs were compressed with original-byte and gzip
SHA-256 checks to make room for sequential KiCad containers. Their index is
`.cloud-tools/g350-timing-snapshots/compressed-completed-byte1-trials-294.json`.
Recover them with
`python3 .cloud-tools/g350-timing-snapshots/restore-compressed-byte1-trials-294.py`
when needed, allowing enough disk space. Control 295 tests exact restoration,
repeat restoration and refusal to overwrite an edited file. Authoritative
209–211, frozen 181–220, active 229/270/285/289/291/292 and the KiCad image/archive
remain raw and untouched. Only an unused ignored dependency cache was removed;
its manifests and lockfile remain. Initial KiCad diagnostic failures from disk
exhaustion and their actual exits/logs are preserved separately.

Further native diagnostics 304/305 found no valid stitching repair and no
connectivity recovery with a 0.105 mm fill margin (the actual 0.1016 mm copper
rule was unchanged). Those failed experiments remain separate. Ground-path
reservation 306 on the checked source also added no copper.

Subset controls 307–309 isolate an interaction between inner-layer length
edits: growing byte0 alone retains native ground, while combining all byte0
and command edits loses ground. A byte0-only spacing conflict is resolved by
retaining the actual A10 length edit. The byte0 + byte1 + A10 subset in 309
passes all full native physical/manufacturing checks and a fresh locked native
ground fill. All 49 complete DDR paths pass the explicit path gate; the strict
existing planar-preservation gate passes against source 209, including all
280 placements, 824 physical barrels, logical constraints and peripheral copper.
Its native bus skews are 15.124882 / 23.748074 / 24.300328 mm. This is a planning
result, not a promoted checkpoint or a fabrication release.

Cache 310 and the new experiment
`experiments/am3352-g350-full-board-ground-safe-byte-growth-replay.circuit.tsx`
reconstruct those actual paths. Fresh source replay 311 finished all phases in
422.43 seconds, with all 49 complete paths and a build exit of 1 for exactly
three bus-skew failures. Initial qualification 312 stopped at the strict
preservation gate: serializing paths in source-declaration order renumbered DDR
trace/via IDs. A geometry-and-source-ownership comparison proves all 824 actual
barrels unchanged; the strict gate was not weakened. The cache saver now accepts
an optional validated 49-connection order reference. Cache 318 preserves the
checked cache order with byte-for-byte identical paths per connection. Fresh
source 319 completed on the separate stable-order entry/cache and qualification
320/321 passed; 311 and failed 312 stay untouched. The active checked source
advances to 319; source 209 remains frozen.
Ground-guarded planning 314 starts from 309, focuses on minimum-length byte
members and performs a fresh locked native ground fill after every batch.
It rolls back and stops at any ground failure; source/independent CAD checks
remain mandatory for any retained result. New options preserve the default
planner behavior and all existing source/checker limits.
Negative control 316 restores hash-verified trial 235 to `/tmp` and confirms
the actual ground-guarded planner rejects its 215 native ground errors before
producing a candidate. Subset diagnostics 315/317/322 narrow the interacting
command edits to ODT/CSn0/BA0/A3; 324 is continuing that bisection. These are
diagnostics, and their physical passes do not replace independent connectivity.
D9's alternate existing-barrel Inner1 search 323 found no clearance-preserving
path and changed no copper. Small guarded D9 growth is currently saturated;
byte0 is still making checked planning progress in 314.

The current environment connection, saved draft revision 18, all twelve exact
repository refs, ten additional domains and checked connection checkpoint are
recorded in `cloud/TIMING_CONNECTION_CHECKPOINT_2026-10-10.json`. Runtime status
is connected/running; network enforcement observation is still unknown. No
credentials are recorded. Install and Start remain saved and previously tested
against checked commit 8284474; publication was not revalidated in this timing
continuation. An inactive npm download cache was removed to make room for VFS
KiCad containers; installed dependencies, lockfiles, pins, all frozen hardware
evidence and the image/archive were untouched. The saved Install reconstructs
that cache. The exact removal inventory is under ignored `.cloud-tools`.

Next: qualify the ground-preserving subset, retain all real channels, match DDR,
then run fresh editable-source replay, all native checks, independent fresh-fill
numeric connectivity/DRC and all-layer Gerber checks. Only a verified improvement
may replace the checked checkpoint. Target DDR clock and manufacturer stackup
are still needed for electrical timing; native length matching alone does not
qualify impedance, coupling, package/via delay, return paths, Linux or shell fit.

Completed planning 314 stopped after round 14 with native ground intact and
skews 14.484882 / 23.638074 mm for byte0/byte1. Four-layer byte1 planning 327
stopped after round 6 at 23.508074 mm with native ground intact. Both remain
unqualified and separate from checked 319. Bisection 326 identifies CSn0 as
the interacting native-ground-breaking command edit; retaining ODT passes.
All owned evidence 222–327 is archived with member hashes and tested restoration.
