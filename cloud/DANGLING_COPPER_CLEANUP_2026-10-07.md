# Verified dangling-copper cleanup — 2026-10-07

The latest editable entry is
`experiments/am3352-g350-full-board-dangling-clean-replay.circuit.tsx`.
Its checked rest-of-board cache is
`lib/am3352/placement/g350-full-board-dangling-clean-rest-routing.json`.
The original DDR cache, all 49 DDR routes and all 280 component placements are
exactly preserved. RAM remains at 90 degrees on four copper layers, with the
provisional 76 × 118 × 1.6 mm outline and about 64.924% of planar DDR on Inner1/Inner2.

The cleanup removes 119 unused vias (944 → 825) and 135.834855 mm of unused
non-DDR planar copper. All vias remain standard full-depth 18/10 mil. Manual
branch trims use actual KiCad dangling endpoints and same-net junctions, followed
by fresh source and independent checks. Trial removals that broke required
connections were rejected and preserved. Reported dangling segments could carry
useful middle junctions; deleting their entire lengths was not accepted.

Fresh editable-source replay 111 completed in 402.866514 seconds with unchanged
source definitions and no forced timeout. All three routing phases completed
49 + 85 + 83 required connections with zero phase errors. The complete build exits
1 solely for three DDR bus-skew errors. Native source and freshly filled copper
have zero other physical, connectivity, width, placement, contiguity, dangling
and strict manufacturing errors.

Independent fresh-fill/export 113 verifies 217/217 connections and all 1,032
required numeric physical ports, including multipart pad membership and 298
ground ports. KiCad 10.0.6 reports zero errors, warnings, unconnected items,
dangling tracks and dangling vias. No rule severities are ignored and no DRC
exclusions exist. Fresh filled ground references span all four layers. Isolated
all-layer Gerber shorts check 114 exits 0 with no shorts detected. Checked ink
cleanup moves references and one connector outline to same-side fabrication
layers without changing copper, pads, outline or placement; the footprint library
is regenerated from the actual export.

## DDR lengths remain unchanged

| Bus | Shortest signal / mm | Longest signal / mm | Skew / mm | Limit / mm |
|---|---|---|---:|---:|
| Byte0 | D6 / 19.933031 | D2 / 54.811678 | 34.878647 | 0.635 |
| Byte1 | D8 / 18.640939 | D12 / 59.832199 | 41.191260 | 0.635 |
| Command/clock | A1 / 23.105578 | A0 / 52.682422 | 29.576845 | 0.635 |

DQS0 and DQS1 pairs each measure 34 mm; the CK pair measures 37.2 mm. Their
skew is effectively zero and all pass 0.127 mm. Native lengths include a fixed
1.6 mm allowance per via. This is a geometric approximation; full package/via
delay, selected manufacturer stackup, impedance, nominal timing, coupling,
return paths, PDN, Linux boot, electrical/footprint review and measured original
shell fit remain unqualified. `fabricationReady` remains false.

## Reproduction and preserved evidence

The hash-bound report is
`checks/integrated/g350-dangling-copper-cleanup/summary.json`; the main whole-board
progress summary points to this result while embedding the prior summary.
Restore the previous baseline and current final evidence with:

```bash
source cloud/env.sh
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-full-board-progress/ddr-shortcuts-74-86-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-dangling-copper-cleanup/cleaned-source-108-114-manifest.json
```

The final archive preserves fresh source 108/111, normalization proofs and negative
controls 112, independent evidence 113, Gerber output 114, snapshot and current
helper snapshots. Trials 88–107 and four compressed routing-raster archives have
separate member-hash manifests. All original 25,814 frozen evidence files were
hash-verified unchanged; no hardware sources were discarded. Generated scratch
rasters outside the original manifest were archived, individually verified and
then removed from expanded storage to recover disk. Do not automatically restore
these large rasters during startup; routing can rebuild scratch from saved input.
Run KiCad containers sequentially because Docker VFS copies use substantial disk.

The explicit 992-trace replay cache passes the actual props schema after direction
metadata normalization, six zero-distance boundary guards and splitting two
implicit layer junctions at existing same-net full-depth vias. Positive-length
wire geometry and all physical via dimensions/locations are unchanged. Negative
controls reject spatial jumps and foreign-net via ownership, with no output.
The optional CLI fanout debug serializer cannot select a unique PCB port for some
shared junction branches. This limitation remains visible in its logs; no port
selection was fabricated and no checks were weakened. The actual editable-source
build, explicit cache, native checks and independent pad/export checks bind the
accepted result.

Snapshot: `dist/g350-dangling-clean-verified-113/pcb-all-layers.png`. It displays
actual copper on all four layers; ground fills are omitted for clarity.
Use `scripts/check-g350-shorts-isolated.sh` for future Gerber checks to protect
frozen debug artifacts. Startup does not route hardware or promote readiness.
