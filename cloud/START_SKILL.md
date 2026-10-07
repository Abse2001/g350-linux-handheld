Use /workspace/g350-linux-handheld and the existing eleven attached source checkouts. Each task is already isolated; do not create a Git worktree unless explicitly requested. Use branch codex/cloud-handoff, never the older main transfer.

Read AGENTS.md, cloud/SETUP_REQUEST.md, cloud/LINUX_VALIDATION.md, cloud/RUNTIME_UPGRADE_2026-10-07.md, cloud/DOCKER_RUNTIME_VALIDATION_2026-10-07.md, docs/CLOUD_HANDOFF.md and design-status.json. For board continuation, read cloud/CONTINUE_BOARD.md, docs/CHAT_CONTEXT.md and cloud/DANGLING_COPPER_CLEANUP_2026-10-07.md.

In every task shell:
```bash
cd /workspace/g350-linux-handheld
source cloud/env.sh
test "$(git branch --show-current)" = codex/cloud-handoff
test "$(node --version)" = v25.6.1
test "$(bun --version)" = 1.3.14
node scripts/verify-cloud-state.mjs
node scripts/checkout-cloud-upstreams.mjs
kicad-cli version
scripts/kicad-python.sh -c 'import pcbnew, wx; print(pcbnew.GetBuildVersion()); print(wx.version())'
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-full-board-progress/ddr-shortcuts-74-86-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-dangling-copper-cleanup/cleaned-source-108-114-manifest.json
bash scripts/setup-g350-routing-tools.sh
python3 scripts/verify-g350-routing-tools.py
```

KiCad must report 10.0.6. Docker must be available on the local socket; wrappers clear stale endpoint selectors and verify/load the retained ignored .cloud-tools/kicad10-debian.tar if its official Debian tool image is absent. See the Linux/Docker reports for reconstruction, proxy trust and default-bridge APT checks. Live containers are disposable. No live application service is required.

To refresh installation, run bash scripts/setup-cloud.sh and bash scripts/setup-g350-routing-tools.sh. The former verifies/restores all 25,814 frozen evidence files without replacing edited evidence, uses npm ci and the board lockfile, verifies the reviewed checks hash, checks out the eleven upstream references at their manifest pins and runs cloud smoke checks. For readiness revalidation run bash scripts/verify-cloud.sh; preserve the frozen mechanical report and use its fresh ignored checks/cloud output. Routing-evidence restoration was tested for fresh extraction, repeat extraction, member hashes and refusal to overwrite differing local evidence.

Use node_modules/.bin/tsci, never global tsci. Runtime pins: tscircuit 0.0.2757, core 0.0.2106, props 0.0.695, checks 0.0.242, CLI 0.1.2257, capacity-autorouter 0.0.962, circuit-json 0.0.520. Reviewed checks SHA256 is 1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc. If an older snapshot fails these assertions, refresh via setup-cloud.sh before board work; do not disable assertions. The eleven upstream source repositories are for inspection, not replacements for the board runtime. Frozen KiCad 10.0.5 evidence remains unchanged.

The routing tools use isolated NumPy 2.3.5, SciPy 1.17.0 and Shapely 2.1.2 under .cloud-tools/python-routing and project C++17 engine source with official Debian/Ubuntu g++. Actual planar-path, forbidden-corner, layer-change and budget-exhaustion tests must pass. These are tool smoke checks, not board routes.

Latest whole-board continuation: experiments/am3352-g350-full-board-dangling-clean-replay.circuit.tsx. Read cloud/DANGLING_COPPER_CLEANUP_2026-10-07.md and checks/integrated/g350-full-board-progress/summary.json. Fresh editable source 111 and independent fresh-fill/export 113 verify 217/217 connections, 49 DDR signals, 298 ground ports and 1,032 required numeric ports. All 280 placements of the rotated clock-clustered reference, RAM at 90 degrees and four layers remain exactly preserved. 119 unused vias and 135.834855 mm of unused non-DDR planar copper were removed, leaving 825 standard full-depth 18/10 mil vias. All DDR copper is exactly preserved; about 64.924% of planar DDR uses Inner1/Inner2. Source and fresh-filled native checks have zero connectivity/physical/width/placement/contiguity/dangling/manufacturing errors and exactly three whole-DDR-bus skew errors. The complete source build exits 1 for those three errors. Independent KiCad has zero errors, warnings, unconnected items and dangling copper, no ignored rules or exclusions. Isolated all-layer Gerber shorts check 114 exits 0 with no shorts detected. The optional fanout debug serializer cannot choose a unique PCB port at some shared junctions; retain its diagnostic and use the schema-validated explicit replay cache with actual source/native/independent checks.
Next work is whole-board DDR matching: Byte0 34.878647 mm, Byte1 41.191260 mm and command/clock 29.576845 mm skew against 0.635 mm limits. All three differential pairs pass 0.127 mm limits. Native length uses a 1.6 mm via allowance; complete package/via delay, nominal length, impedance, coupling, return paths, PDN, Linux and measured original-shell/assembly fit remain unqualified. Preserve pinned native bus_lanes bootstrap evidence, the old default 280-part/four-layer/provisional 76 x 118 mm 11/49 entry, the checked zero-skew DDR-only experiment and all rejected trials. That DDR-only timing result does not qualify the different whole-board copper.

Use fresh output directories. After copper changes, rerun fresh source/native checks, collect all three actual routing phases with scripts/collect-g350-full-solver-input.py, check every numeric pad, refill all four layers, inspect every KiCad error category/severity/exclusion and check all-layer Gerber shorts. Router model counts, stale pours and phase callbacks are not qualification evidence. Keep fabricationReady false. Startup and installation must not route hardware or promote fabrication results automatically.

For all new Gerber checks, use bash scripts/check-g350-shorts-isolated.sh INPUT NEW_OUTPUT_DIRECTORY. The unmodified CLI's debug outputs must never overwrite frozen checks/check-shorts artifacts. The isolated wrapper was tested on passing fresh fills and failing stale pours; both preserve the original debug files. Source 111, independent export 113 and isolated Gerber check 114 are the current checked continuation. Finer D12 trial 81 passes native geometry but has no fresh source/independent qualification and must not be promoted. Electrical timing cannot be qualified without the selected manufacturer's actual stackup, impedance and package/via-delay constraints.

Run KiCad containers sequentially because Docker VFS copies consume substantial disk. Large generated routing scratch rasters were hash-indexed and compressed under checks/integrated/g350-dangling-copper-cleanup; do not restore these raster archives during ordinary startup. Restore only the baseline and final source archives above. Frozen originals remain untouched and scratch can be regenerated from saved routing inputs.
