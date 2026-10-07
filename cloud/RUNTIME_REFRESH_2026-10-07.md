# Latest registry runtime refresh — 2026-10-07

The existing whole-board source was tested with current registry releases:
tscircuit 0.0.2759, Core 0.0.2107 and CLI 0.1.2258. Checks 0.0.242,
props 0.0.695, capacity autorouter 0.0.962 and circuit-json 0.0.520 are unchanged.
All eleven upstream inspection references remain pinned. Node 25.6.1, Bun 1.3.14,
KiCad 10.0.6 and the reviewed checker hash are retained.

An isolated locked npm install replayed the cleaned whole-board entry in
392.515341 seconds, without timeout or changed source definitions. Every record
except project metadata exactly matches checked source 111, including copper,
vias, placements, pads, fills and source constraints. The complete build exits 1
for its same three DDR skew errors. Full native checks independently confirm
zero other errors. Physical qualification of the unchanged copper remains bound
to the previous zero-DRC/zero-shorts evidence; timing repairs require fresh checks.

The actual board installation uses the updated exact package pins and npm lock,
with locked npm ci, shared Core/native solver/version assertions and typecheck
passing. The reviewed checker patch remains SHA256
1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc.
Real invalid-via, invalid-SMT-pad and removed-CPU-ground negative controls still
fail correctly. The first isolated fixture checks and incomplete import-graph
replays failed for missing local inputs; those logs are retained. Copying their
actual frozen fixtures and complete recorded import graph resolved the failures.

Bun lock records were updated using npm's exact versions, dependencies and
integrities, retaining the unchanged Git linter record. Bun successfully validated
and normalized the frozen lock. A fresh Bun install is not claimed; reusable
installation continues to use npm. Dependencies declaring Node 24.x still warn
on the tested Node 25.6.1 runtime. No package-signature or TLS verification was
disabled. Core and exporter version assertions were updated to exact tested pins.

Evidence: dist/g350-runtime-refresh-115/runtime-validation.json and the related
execution, install, negative-control, typecheck and lock-validation logs.
Read cloud/CONTINUE_BOARD.md for the latest independently checked hardware;
this runtime upgrade alone does not clear DDR timing or fabrication readiness.
