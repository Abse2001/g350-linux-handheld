Use /workspace/g350-linux-handheld and the existing eleven attached source checkouts. Each task is already isolated; do not create a Git worktree unless explicitly requested. Use branch codex/cloud-handoff, never the older main transfer.

Read AGENTS.md, cloud/SETUP_REQUEST.md, cloud/LINUX_VALIDATION.md, cloud/RUNTIME_REFRESH_2026-10-07.md, cloud/RUNTIME_UPGRADE_2026-10-07.md, cloud/DOCKER_RUNTIME_VALIDATION_2026-10-07.md, docs/CLOUD_HANDOFF.md and design-status.json. For board continuation, read cloud/CONTINUE_BOARD.md, docs/CHAT_CONTEXT.md, cloud/DDR_CHECKED_SHORTCUT_PROGRESS_2026-10-09.md and cloud/RUNTIME_REFRESH_2026-10-09.md.

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
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-clean-length-progress/runtime-and-length-progress-115-132-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-middle-shortcut-progress/checked-source-and-trials-135-152-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-bend-timing-progress/checked-source-and-trials-153-172-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-checked-shortcut-progress/checked-source-and-trials-173-180-manifest.json
bash scripts/setup-g350-routing-tools.sh
python3 scripts/verify-g350-routing-tools.py
```

KiCad must report 10.0.6. Docker must be available on the local socket; wrappers clear stale endpoint selectors and verify/load the retained ignored .cloud-tools/kicad10-debian.tar if its official Debian tool image is absent. See the Linux/Docker reports for reconstruction, proxy trust and default-bridge APT checks. Live containers are disposable. No live application service is required.

To refresh installation, run bash scripts/setup-cloud.sh and bash scripts/setup-g350-routing-tools.sh. The former verifies/restores all 25,814 frozen evidence files without replacing edited evidence, uses npm ci and the board lockfile, verifies the reviewed checks hash, checks out the eleven upstream references at their manifest pins and runs cloud smoke checks. For readiness revalidation run bash scripts/verify-cloud.sh; preserve the frozen mechanical report and use its fresh ignored checks/cloud output. Routing-evidence restoration was tested for fresh extraction, repeat extraction, member hashes and refusal to overwrite differing local evidence.

Use node_modules/.bin/tsci, never global tsci. Runtime pins: tscircuit 0.0.2803, core 0.0.2107, props 0.0.695, checks 0.0.242, CLI 0.1.2258, capacity-autorouter 0.0.962, circuit-json 0.0.520. Reviewed checks SHA256 is 1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc. If an older snapshot fails these assertions, refresh via setup-cloud.sh before board work; do not disable assertions. The eleven upstream source repositories are for inspection, not replacements for the board runtime. Frozen KiCad 10.0.5 evidence remains unchanged.

The routing tools use isolated NumPy 2.3.5, SciPy 1.17.0 and Shapely 2.1.2 under .cloud-tools/python-routing and project C++17 engine source with official Debian/Ubuntu g++. Actual planar-path, forbidden-corner, layer-change and budget-exhaustion tests must pass. These are tool smoke checks, not board routes.

Latest whole-board continuation: experiments/am3352-g350-clean-full-board-checked-shortcuts-replay.circuit.tsx. Read cloud/DDR_CHECKED_SHORTCUT_PROGRESS_2026-10-09.md and checks/integrated/g350-checked-shortcut-progress/summary.json. Fresh source 178, independent refill/export 179 and Gerber 180 verify 217/217 connections, 49 DDR signals, 298 ground ports and all 1,032 required numeric ports. All 280 placements, RAM90, four layers and 824 standard full-depth vias remain fixed. Only D2, D12 and A0 copper changes; all other DDR and peripheral geometry, logical constraints, pads, placements and vias are preserved. Derived pour annotations renumber on 102 peripheral records. Source/fresh-filled native checks pass except three whole-bus skew errors. The complete build exits 1 for those errors. KiCad has zero errors/warnings/opens/dangling copper with no ignored rules/exclusions; all-layer Gerber shorts exits 0. The initial combined shell's exit 1 is retained; a separate exit-bound artifact verifier and identical rerender pass. The preceding connected 7b08fba checkpoint is preserved with 14 hashes in cloud/CONNECTED_CHECKPOINT_BEFORE_SHORTCUTS_2026-10-09.json. Failed trials must not replace checked copper.
Next matching work: Byte0 29.148292 mm, Byte1 33.385093 mm, command/clock 24.480252 mm skew versus 0.635 mm. Differential pairs pass 0.127 mm. Native length includes 1.6 mm per via and is not an electrical delay model. Full timing needs the target DDR clock, actual manufacturer stackup, impedance, package/via delay, coupling and return paths. Those and PDN, Linux, measured original-shell/assembly fit remain unqualified. Preserve the original native bus-lanes bootstrap, frozen default and matched DDR-only checkpoint. Keep fabricationReady false.
GitHub authentication failed during the latest saved Install entry; local setup/validation can continue on attached pinned checkouts, but fetch/push and reliable remote restoration of the new local checkpoint are blocked. Restore repository access, fetch/reconcile any newer transfer records, then push to codex/cloud-handoff before claiming publication readiness. Do not reset local work or substitute the older remote tip to hide this blocker.

Use fresh output directories. After copper changes, rerun fresh source/native checks, collect all three actual routing phases with scripts/collect-g350-full-solver-input.py, check every numeric pad, refill all four layers, inspect every KiCad error category/severity/exclusion and check all-layer Gerber shorts. Router model counts, stale pours and phase callbacks are not qualification evidence. Keep fabricationReady false. Startup and installation must not route hardware or promote fabrication results automatically.

For all new Gerber checks, use bash scripts/check-g350-shorts-isolated.sh INPUT NEW_OUTPUT_DIRECTORY. The unmodified CLI's debug outputs must never overwrite frozen checks/check-shorts artifacts. The isolated wrapper was tested on passing fresh fills and failing stale pours; both preserve the original debug files. Source 178, independent export 179 and isolated Gerber check 180 are the current checked continuation. The restored D12 shortcut was qualified in source 123; later D6 detours and incomplete recovery models remain rejected. Electrical timing cannot be qualified without the selected manufacturer's actual stackup, impedance and package/via-delay constraints.

Run KiCad containers sequentially because Docker VFS copies consume substantial disk. Large generated routing scratch rasters were hash-indexed and compressed under checks/integrated/g350-dangling-copper-cleanup; do not restore these raster archives during ordinary startup. Restore only the baseline and final source archives above. Frozen originals remain untouched and scratch can be regenerated from saved routing inputs.

Do not automatically restore the rejected-recovery-127/128/133/134 manifests in checks/integrated/g350-middle-shortcut-progress: it contains stopped unqualified recoveries and large rasters. Core 0.0.2108 was independently source-tested but board lockfiles remain on the reviewed pins above. Full timing also requires the selected target DDR clock.
