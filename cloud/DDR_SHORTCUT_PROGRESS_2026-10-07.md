# Whole-board DDR shortcuts verified; matching remains unfinished

Continue `experiments/am3352-g350-full-board-ddr-shortcut-replay.circuit.tsx`.
The latest tested runtime is described in `cloud/RUNTIME_UPGRADE_2026-10-07.md`.
The latest experiment retains all **217/217 connections**, **49/49 DDR signals**,
280 placements, RAM at 90 degrees, four layers and 944 standard full-depth
0.4572/0.254 mm vias. About 64.924% of planar DDR length uses Inner1/Inner2.
`fabricationReady` remains **false**.

Sixteen signal paths were shortened by a total of 17.140703 mm. Shortcuts retained
every other net, terminal escape and via. Conservative obstacle filtering and
complete native physical/manufacturing checks qualified each accepted change.
Fresh editable-source replay (78) finished in 439.322 seconds, without a timeout
or changed input definitions. Compiled SHA256:
`18cdc8154b317f66219c150acd6643c59533456242ebf15dc91e1c71dbd64a10`.
The complete build exits **1**, with exactly three bus-skew errors:

| DDR bus | Previous skew | Current skew | Required maximum |
| --- | ---: | ---: | ---: |
| Byte 0 | 36.739114 mm | 34.878647 mm | 0.635 mm |
| Byte 1 | 42.943753 mm | 41.191260 mm | 0.635 mm |
| Command/clock | 31.489073 mm | 29.576845 mm | 0.635 mm |

All three differential pairs retain their passing 0.127 mm constraints. Both
source and exact fresh-filled native reports have zero other errors, including
connectivity, contiguity, trace width, placement, physical and strict manufacturing
clearance. Native timing uses a 1.6 mm allowance per via; it does not qualify
actual via/package delay, nominal length, impedance, coupling or return paths.

Independent fresh export (82), fills on all four layers and all-phase numeric
pad mapping verify all 217 connections and all 1,032 required numeric ports.
Every physical pad of multipart ports is checked. The native board has zero
errors and opens; no rule is ignored and no item is excluded. Its exact
fresh-filled Circuit JSON has zero all-layer Gerber shorts. Native checks on
that reconstruction again report only the same three matching failures.

Fresh export (83) improves assembly markings. Its exact local footprint library
clears the library warnings. Four checked passes moved 225 conflicting generated
reference fields to their existing side's Fab layer; one conflicting battery
connector outline segment also moved to Fab. Names, positions, visibility,
strokes, pads, tracks, vias, zones, outline and ownership are retained. Serializer
comparisons permit only the selected ink-layer changes and ordering, and restore
the original on an unexpected change. The final independent board SHA256 is
`3ae48665b1cfb52954441800ac3ba6a0a280323056f0b0b4ff712cc5774e2008`.
It again verifies 217/217 connections and zero DRC errors or unconnected items.
No silkscreen or library warnings remain. **115 dangling vias and 42 dangling
tracks remain**, recorded and unwaived. Earlier warning totals were reported
counts; several KiCad warning categories were capped, revealing further items
after each cleanup pass. This is still not a zero-warning fabrication export.

## Preserved trials and failure controls

Runs 74–77 check the manual shortcut candidate before fresh replay. Stale input
pours produce real Gerber collisions and must never qualify changed copper.
Independent refill and exact reconstruction clear those collisions. One early
reconstructed-fill CLI invocation printed no shorts but returned 1; its identical
repeat and the separate exact-source 82 invocation completed with exit 0. That
early nonzero exit is preserved, not described as passing.

Run 79 opens only D12's middle, retaining its actual CPU/RAM terminal escapes.
Coarse 0.05 mm fixed-obstacle searches (80) found no path. A 0.025 mm search (81)
found a complete alternative with no other net ripped up. Canonical native D12
length is 56.641453 mm; byte-1 skew would fall to 38.000514 mm. All native physical
and connectivity checks pass, but this alternative has no fresh editable-source
replay or independent refill qualification. It is a separate trial and is **not**
promoted as the checked continuation.

Silkscreen serializer trials are retained, including strict comparisons that
rejected KiCad's layer-based outline-segment ordering and restored the original.
The final comparison checks complete segment records within their owning
footprints, preserving geometry while allowing that serialization ordering.

The CLI reuses `checks/check-shorts` for failed-check debug images. Its first
stale-pour failure overwrote two restored debug images there. The new generated
outputs are preserved separately in run 84; the hash-indexed originals were
restored from the verified archive, and all 25,814 original files were verified.
Use `bash scripts/check-g350-shorts-isolated.sh INPUT NEW_OUTPUT_DIRECTORY` for
future checks. The wrapper runs the unmodified installed CLI from an isolated
output directory, records source/CLI/log hashes and preserves its exit status.
Actual passing and failing Gerber cases test that original debug files stay
unchanged. Cloud smoke checks now use this wrapper too.

The frozen default 11/49 entry, DDR-only zero-skew checkpoint and hardware sources
are preserved. Their earlier timing results do not qualify this whole-board
copper. Restore this continuation using the indexed archive manifest in
`checks/integrated/g350-full-board-progress/summary.json`.

## Remaining work and required inputs

Three native bus-skew failures still require routing work. The 157 dangling-copper
warnings require review against real pad/plane connections before removal.
Qualifying electrical timing also requires the selected manufacturer's four-layer
stackup, impedance specification and package/via-delay constraints. Original-shell
measurements, assembly clearances, electrical/PDN/footprint qualification, Linux
bring-up and bound fabrication outputs remain release gates. Neither routing
connectivity nor these partial improvements authorize an order.
