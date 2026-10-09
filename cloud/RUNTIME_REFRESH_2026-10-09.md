# Tested tscircuit registry refresh — 2026-10-09 UTC

The board now uses registry tscircuit **0.0.2803**. Its `tsci --version` reports
0.0.2803. Core 0.0.2107, CLI 0.1.2258, props 0.0.695, checks 0.0.242, capacity
autorouter 0.0.962 and circuit-json 0.0.520 remain exact reviewed board pins.
All 19 existing solver/checker/Core/props lock records retain their exact versions
and integrities. The eleven upstream checkouts remain inspection references.
This qualifies the new tscircuit wrapper with the reviewed runtime; it does not
claim every dependency is the newest registry version. In particular, the new
wrapper's newer declared Core/checks/CLI ranges are overridden by the board pins.

An isolated locked install replayed the checked bend-timing whole-board source
in **440.325579 seconds**, with no timeout or source-definition changes. Every
record except `source_project_metadata` exactly equals checked source 166,
including all copper, pours, vias, pads, placements and logical constraints.
All three actual routing phases finish with zero phase errors. The complete
build exits 1 solely for the same three DDR bus-skew failures. Full native
verification independently confirms zero other errors. Unchanged copper retains
its previous independent zero-DRC/zero-shorts qualification; new edits require
their own fresh checks.

The actual board passes normal locked **npm ci**, its postinstall patch, complete
project typecheck and `bash scripts/verify-cloud.sh`, including KiCad 10.0.6 Python
and wx, isolated Gerber shorts and the preserved mechanical-envelope smoke check.
The original shell remains unmeasured. Real too-close vias, too-close SMT pads and
a deliberately removed CPU-ground connection still fail their negative controls.
The reviewed checks SHA256 remains
`1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc`.

The isolated workspace's first typecheck lacked historical routing JSON inputs;
that failure is retained. Copying the actual routing inputs resolved it. The main
project's complete typecheck then passed as part of the bound cloud-smoke run.
The negative-control helper's historical report version label was corrected only
in its retained executed copy; native assertions and frozen reports are unchanged.

Bun 1.3.14 imported the exact npm lock and successfully normalized/validated its
frozen lock; another frozen validation left that normalized file unchanged. A
fresh Bun dependency install is not claimed. Reusable installation continues to
use npm. Node 25.6.1 remains the tested runtime; packages declaring Node 24.x warn.
No TLS or checksum verification was disabled. Only the reconstructible isolated
`runtime-refresh-173/node_modules` was removed to leave disk for sequential KiCad
VFS containers; package/locks, source, execution snapshots and evidence remain.
The retained ignored KiCad image/archive and frozen KiCad 10.0.5 evidence remain.

Evidence is in `dist/g350-runtime-refresh-173`, including registry metadata,
tested/previous locks, complete executed source graph, replay, native reports,
negative controls and exit-bound installation/cloud-smoke logs. All 25,814
original restored evidence files still match their frozen hashes. Fabrication
readiness remains false, and this package refresh does not clear DDR matching.

The unchanged saved Install entry initially exited 128 for missing GitHub
authentication. Its setup body and routing-tool setup both passed separately.
That initial failure is retained inside the archive. Authentication subsequently
recovered, and a fresh fetch confirms the same 7b08fba parent; the full saved entry
now exits 0, with results outside the frozen archive. The archived runtime status
records the earlier blocked state and is not rewritten to hide that failure.
