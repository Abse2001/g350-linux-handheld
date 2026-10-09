# Connected board preserved; checked DDR shortcuts — 2026-10-09 UTC

Continue `experiments/am3352-g350-clean-full-board-checked-shortcuts-replay.circuit.tsx`.
Fresh source 178, independent refill/export 179 and isolated Gerber 180 retain
217/217 connections, all 49 DDR signals, 280 fixed placements, RAM90, four layers
and 824 standard full-depth 0.4572/0.254 mm vias. Fabrication readiness stays false.

| DDR group | Previous skew | Checked new skew | Limit |
|---|---:|---:|---:|
| Byte0 | 30.621477 mm | 29.148292 mm | 0.635 mm |
| Byte1 | 34.678381 mm | 33.385093 mm | 0.635 mm |
| Command/clock | 24.692716 mm | 24.480252 mm | 0.635 mm |

D2 shortened by 1.473185 mm to 52.831323 mm, D12 by 1.293289 mm to
55.348165 mm, and A0 by 0.212464 mm to 52.469959 mm. Their shortest bus members
remain D6 23.683031 mm, D9 21.963072 mm and CASn 27.989707 mm. All differential
pairs pass their 0.127 mm limits. Three whole-bus matching failures remain.

The shortcut helper now has an optional mode that checks each proposed shortcut
with every unchanged native physical/manufacturing check before accepting it.
It preserves ports, layers, vias and other nets, and retains the historical mode.
Trials 174–177 accept 25 individual edits across the three signals. The combined
candidate also passes every full native check except the three bus-skew checks.
The first source-save helper failed on an unnamed non-DDR trace; its executed
helper and partial candidate are retained separately. Correcting that metadata
lookup produces the saved source without promoting the failed attempt.

Fresh editable-source replay completes in 438.159042 seconds, without timeout
or changed source definitions. All three routing phases finish with zero phase
errors. The complete build exits 1 solely for three native bus-skew errors.
Source and fresh-filled native checks have zero other errors, including physical
geometry, connectivity, width, contiguity, dangling copper and manufacturing
clearance. Independent KiCad 10.0.6 verifies all 1,032 required numeric ports and
multipart pads, including 298 ground ports. Four fresh GND fills have zero DRC
errors, warnings, unconnected items and dangling copper, with no ignored rules
or exclusions. All-layer Gerber shorts exits 0. An empty schematic-parity report
category does not establish a separate schematic-parity qualification.

Only D2, D12 and A0 copper geometry changes. The other 46 DDR geometries, all
non-DDR copper geometry, logical constraints, ports, pads, placements and vias
are exactly preserved. Derived pour annotations renumber on 102 peripheral
trace records; those records do not describe peripheral reroutes. No components
move and no new holes are added. The native bus-lanes bootstrap remains preserved.

The combined qualification shell reported exit 1 although all expected validation
artifacts and the image were produced. Its result is retained and no combined
shell success is claimed. A separate exit-bound final verifier exits 0 after
checking all source/native/refill/DRC/connectivity/Gerber hashes and assertions.
An independently exit-bound rerender also exits 0 and produces an identical PNG.
These explicit checks qualify the saved artifacts; they do not clear matching.

The preceding connected `7b08fba` checkpoint is preserved with 14 bound hashes in
`cloud/CONNECTED_CHECKPOINT_BEFORE_SHORTCUTS_2026-10-09.json`; all 509 members of
its archive pass revalidation. Frozen originals and hardware sources remain.
The new summary is `checks/integrated/g350-checked-shortcut-progress/summary.json`.
Snapshot: `dist/g350-checked-shortcuts-verified-179/pcb-all-layers.png`, showing
actual copper with fills omitted and the three matching failures clearly stated.

The board now uses source-tested tscircuit 0.0.2803 with the unchanged reviewed
Core/CLI/checker/solver pins. Read `cloud/RUNTIME_REFRESH_2026-10-09.md`. All 25,814
original evidence files still match. Preserve rejected bypass/detour/recovery
trials and the matched DDR-only checkpoint; neither qualifies whole-board copper.
Further matching needs useful clearance-preserving route changes; the current
safe shortcuts have not reached the requested zero-error goal. Full electrical
timing also needs the target DDR clock, actual manufacturer stackup, impedance,
package/via delay, coupling and return paths. PDN, Linux and measured original
shell/assembly fit remain unqualified. Keep `fabricationReady=false`.

GitHub authentication briefly failed during the saved Install entry. That failure
is retained, and the setup body passed separately. Authentication then recovered:
a fresh fetch confirms the same `7b08fba` parent. The complete saved Install entry now exits 0; its bound result is stored under
the integrated publication validation directory. Always fetch/reconcile newer transfer records before pushing
the verified continuation to `codex/cloud-handoff`.

Restore the hash-indexed checked source, runtime and all new trials with:

```bash
source cloud/env.sh
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-checked-shortcut-progress/checked-source-and-trials-173-180-manifest.json
```

The new archive contains 654 hash-verified members (29,498,653 bytes), SHA256
`ceb8d4902963e9554a1c2fb4b91882dcd4e97c1ba33e4eabfe167827821ae544`.
Archive validation and in-place restoration pass without replacing any files.

The exact updated Start bash block exits 0 in this Linux instance, including all
six routing-archive restorations, pinned upstream/tool checks and four meaningful
grid-engine smoke tests. It does not route hardware. The install body also passes;
the initial saved Install entry's authentication failure is retained, and its full
retest exits 0 after restored access. Fresh-task restoration is not claimed.
