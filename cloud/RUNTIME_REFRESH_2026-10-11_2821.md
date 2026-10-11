# Verified latest tscircuit wrapper0.0.2821

The registry lists0.0.2821. The installed wrapper is upgraded from0.0.2819;
all345 other npm lock records and every other Bun package record are exact.
An initial package-lock-only resolution floated runframe to0.0.2958 and pruned
unused records; it was rejected before installation. An explicit runframe
0.0.2957 override preserves the existing runtime, and the controlled lock retains
all old records. npm ci, reviewed native patch verification and typecheck pass.
The Bun lock retains its existing normalization for unsupported nested overrides;
no fresh Bun installation is claimed. The board uses npm ci and the reviewed
Core0.0.2107/CLI0.1.2258/checks0.0.242 plus unchanged solver pins.

Fresh source1044 completes in629.034306 seconds without timeout. Every record
except project metadata exactly matches preserved source836. SHA256:
c87ed7ef32eccd1fa0c9fbe4a018ccceec251940741b968766d198643a3a6354.
Its exit1 is exactly the same byte1 and command matching errors, not a new
runtime failure. Core exports and reviewed native checks hash remain identical.
All217 fallback connections,49 DDR and298 grounds are preserved; that board
still uses inner DDR and fails two length constraints. It does not satisfy the
requested Top/Bottom reroute. The separately checked outer checkpoint remains
18/49 local channels, with31 missing and full source/CAD/timing unqualified.

Source execution inputs, outputs, logs and all file hashes are archived for
restoration. A mistaken cloud-smoke filename call is retained as a failed call;
the actual Linux verification command is bash scripts/verify-cloud.sh. Start
sources cloud/env.sh, restores the latest-source archive and verifies all
nonmetadata equality plus18 checked outer channels. Keep fabricationReady=false.

The actual Linux verification bash scripts/verify-cloud.sh exits0, including
typecheck, KiCad Python/wx10.0.6 APIs, all-layer shorts smoke and the preserved
mechanical envelope. The initial mistaken smoke filename remains a failed call.
