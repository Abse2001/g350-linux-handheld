# G350 board continuation

Read `docs/CLOUD_HANDOFF.md`, `design-status.json`, and `docs/G350_CURRENT_DDR.md`
before editing hardware. The complete recorded user-visible conversation is in
`docs/CHAT_CONTEXT.md`. Newer user decisions supersede older ones.

The current design is a bare AM3352 + 512 MiB x16 DDR3L Linux handheld, authored
in tscircuit with individually imported JLCPCB parts. It must fit the original
G350 shell, use at most four copper layers, have eleven front membrane buttons,
an FPC display, microSD and one USB-C connector for charging and data. Both
assembly sides are permitted. No analog sticks or rear buttons. Do not return
to a Pi carrier, preassembled SBC or the historical RK3566 design.

`index.circuit.tsx` is the current 280-component, provisional 76 × 118 × 1.6 mm
shaped board. Its checked byte0 subset has 11/49 DDR signals connected. The
historical DDR42 and other larger layouts do not qualify this shell layout.
`fabricationReady` must stay false until all documented release gates pass.

Use `bash scripts/setup-cloud.sh` in an Ubuntu cloud environment, then
`source cloud/env.sh` in each new shell. Use the project `node_modules/.bin/tsci`,
never a global tsci. Restore ignored evidence using
`python3 scripts/restore-cloud-evidence.py`. Keep lockfiles and the reviewed
native checks patch. Verify versions after dependency changes; do not silently
replace pinned solvers with newer code or disable native/independent checks.

Layout all components before routing. Bootstrap DDR with native `bus_lanes`
phases, then repair geometry as needed. Preserve both complete byte buses and
their 0.635 mm limits, and the 0.127 mm differential-pair limits. Partial solver
outputs and pad-to-via escapes are not complete CPU-to-RAM channels. Use new
experiment/output directories; preserve failed runs and frozen evidence.

Validate actual editable-source replay, numeric pad mapping and connectivity,
all-layer Gerber shorts, four-layer full-depth vias, filled references, and
independent KiCad clearance/drill checks. Check all KiCad rule severities and
exclusions. Full DDR timing also needs package/via delay, nominal length,
impedance and return-path qualification; planar skew alone is insufficient.
Recheck the shared mechanical outline and assembly envelope after edits.

The user requested this GitHub/cloud handoff. After that, push additional board
work only on meaningful verified breakthroughs, as previously requested. Do
not place an order or claim fabrication readiness from partial routing evidence.
