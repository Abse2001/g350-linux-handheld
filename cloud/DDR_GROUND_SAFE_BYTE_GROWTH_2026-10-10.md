# Connected, ground-preserving DDR length progress

Continue `experiments/am3352-g350-full-board-ground-safe-byte-growth-stable-replay.circuit.tsx`.
The source-bound summary is `checks/integrated/g350-ground-safe-byte-growth-progress/summary.json`.
Fabrication readiness remains false.

| Bus | Preceding checked skew | New checked skew | Limit |
|---|---:|---:|---:|
| Byte0 | 19.293662 mm | 15.124882 mm | 0.635 mm |
| Byte1 | 25.185093 mm | 23.748074 mm | 0.635 mm |
| Command/clock | 24.480252 mm | 24.300328 mm | 0.635 mm |

All three differential pairs pass their 0.127 mm limits. Native length includes
1.6 mm per routing via; it is not qualified electrical propagation delay.

Fresh source 319 completes all three replay phases with unchanged source
definitions. Its build exits 1 for exactly three bus-skew failures. Full native
source and fresh-filled checks report zero errors in every other category.
Independent fresh-fill KiCad 320 verifies 217/217 connections, all 49 complete
DDR channels, 298 ground ports and 1,032 required numeric ports. DRC errors,
warnings, opens and dangling copper are zero; no rules are ignored and no
items excluded. Gerber 321 verifies zero shorts on all layers. The qualification
wrapper exits 0, separately from the still-failing complete timing build.

All 280 placements, RAM90, four layers, 824 standard full-depth barrels, source
constraints, DDR pad endpoints/transitions and peripheral copper are exactly
preserved by the strict existing comparison. Native BusLanes participation and
the original frozen evidence remain. The prior 8284474 checkpoint and all older
evidence are preserved; the mutable continuation summary advances to this entry.

## Repairs and rejected trials

Length edits that individually preserved ground could jointly isolate the net.
Subset diagnostics retain the byte0/byte1 edits and A10 needed for clearance,
while excluding the interacting command edits. Bisection later identifies the
large CSn0 meander as the native ground-breaking command edit with this byte0
geometry. Those further command combinations have not passed source/CAD gates.

The cache saver now accepts an optional validated reference order. Initial
source 311 retained all actual barrel geometry/net ownership but renumbered
DDR trace/via IDs because paths followed source-declaration order. Qualification
312 correctly rejected it. Stable-order cache 318 contains identical paths per
connection and reproduces the checked order; source 319 passes the unchanged
strict gate. Failed source 311 and qualification 312 remain preserved.

New ground-guarded planning checks a fresh locked native fill after every batch,
rolls back and stops on ground failure, and preserves every physical barrel.
Negative control 316 rejects the actual disconnected-ground trial before saving
a candidate. Completed trials 314 and 327 regain additional small lengths, but
remain unqualified planning and must not replace this checked source. Their
small-edit searches saturated; D9 alternate-layer/lower-detour searches found
no clear path. The joint byte1 carrier trial connected all 49 channels physically
but failed independent ground and timing checks, so was never promoted.

Full source replay, native checks, all-layer Gerber shorts, fresh reference fills,
numeric connectivity and all KiCad rule severities remain required after edits.
Target DDR clock and the manufacturer's stackup are still needed for electrical
timing. Package/via delay, impedance, coupling, return paths, PDN, footprints,
Linux bring-up and measured original-shell fit remain unqualified. Do not order.

The environment connection and twelve pinned repository refs are recorded in
`cloud/TIMING_CONNECTION_CHECKPOINT_2026-10-10.json`. Install/Start remain saved;
the Start revision must follow the verified pushed checkpoint. Runtime pins and
the reviewed native checker patch are unchanged. Sequential containers are
required; inactive software download caches can be reconstructed from lockfiles.

Restore the checked evidence after sourcing `cloud/env.sh`:

```bash
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-ground-safe-byte-growth-progress/connected-source-319-321-manifest.json
```

Separate manifests preserve all explicitly owned planning/rejected evidence
222–327. Their archive/member hashes are verified. Checked archive restoration
passes fresh, repeat and in-place checks and refuses to overwrite edits. All 56
compressed planning members are independently verified; selective restoration,
repeat restoration and edited-file refusal are tested. Use
`scripts/restore-g350-compressed-planning-evidence.py` with the checkpoint's
`compressed-planning-evidence.json` and `--only PATH` to avoid restoring all
large inactive candidates. Original frozen evidence and preceding checkpoints
remain untouched. Inactive npm downloads/Bun transpilation caches were cleared
for disk space; installed tools, source, lockfiles and KiCad image/archive remain.

Exact saved Install and new Start commands both exit 0. They verify the pinned
runtime/patch, all 25,814 frozen files, eleven upstream refs, TypeScript, KiCad
10.0.6/Python/wx and routing-tool controls, without routing hardware. Execution
logs and actual exits are retained in this checkpoint directory.
