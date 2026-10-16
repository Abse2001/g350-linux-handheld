# Source272 CAD connectivity evidence, closed through Root310

Root310 passed the read-only KiCad10.0.6 geometry and owned-connectivity verifier
for the fresh Source272 export. All49 real CPU/RAM numeric pairs passed both the
independent owned-wire/barrel graph and the native flags0 connectivity graph,
including every owned item. The exact export preserves280 real parts,1165 lands,
234 fullspan vias,5271 wire segments and four copper layers. Every input hash
remained unchanged; the owned process group was empty and the disposable rootfs
matched its original full file/link manifest afterward.

The current report is
`dist/g350-source272-kicad49-root-20261016/SOURCE272_KICAD49_READ_ONLY_V3_FLAGS_REPORT.json`,
SHA256 `4c20246cdc0a300c52fd286dd4f6efada132c301aaa882a94fbb068cc53ef687`.
It embeds the complete, unfiltered-as-returned Root303 DRC JSON. It does not
qualify Source289, Model299, later Source replays, the whole board, timing,
reference continuity, TI compliance, return paths, manufacturing or fabrication.

## DRC findings are capped default-rule observations

Root303 returned exit5 and retained2102 reported violations and499 reported
unconnected items. The violation severities are1300 errors and802 warnings.
The exact returned data is preserved; these counts are not an exhaustive census.
Official KiCad10.0.6 `pcbnew/drc/drc_engine.cpp` defines `ERROR_LIMIT=199` and
`EXTENDED_ERROR_LIMIT=499` at lines61–62. `RunTests` lines929–936 assigns0 to
ignored codes,499 to clearance and unconnected items, and199 to other types.
`ReportViolation` lines2277–2286 atomically stops each code when its counter
reaches0. The actual run reached499 clearance reports,499 open reports and199
reports in each of these eight types: drill_out_of_range, hole_clearance,
isolated_copper, lib_footprint_issues, silk_over_copper, silk_overlap, track_width,
and via_diameter. More findings can exist beyond those caps.

`--severity-all` selects error, warning and exclusion output severities.
`--all-track-errors` selects per-track reporting. Neither removes the engine's
per-code caps. The recorded KiCad CLI help exposes no cap-removal argument.
The JSON explicitly lists five default-ignored checks: missing_courtyard,
track_not_centered_on_via, tuning_profile_track_geometries,
footprint_filters_mismatch and footprint_type_mismatch. The matching defaults
appear in official `pcbnew/board_design_settings.cpp` lines173,190,199,210,212.

This fresh board has no authenticated Source-to-KiCad project-rule bridge.
The returned default constraints include0.2mm minimum track width,0.3mm minimum
hole and0.5mm minimum via diameter; the corresponding actual DDR values are
0.1016mm,0.254mm and0.4572mm. These are reported mismatches, not waived errors.
No minimum, exclusion, project file, board geometry or source rule was changed.
A future rules bridge must explicitly derive and preserve the original limits;
an old project file must not be substituted.

## Exact export and operational provenance

The stock pinned CLI exported a distinct metadata-only serializer input.
Exactly103 previously missing via connectivity-map keys were added after
SourceTrace-only UF and real endpoint-alias authentication. Full before/after
rows and the complete array inverse are in `SERIALIZER_BRIDGE.json`. Original
Source272 raw bytes, numeric IDs, geometry, layers and dimensions remain exact.
This evidence does not retroactively validate an unbridged stock raw export.

Root301 proves the actual KiCad10 API without loading a board. Root303 retains
all returned DRC data and its associated PRL sidecar. Root304 is a preserved
negative: the old verifier used the incompatible KiCad9 type-list overload.
Root310 uses `GetConnectedItems(item,0)`, manual pad/track/arc/via types, exact
native net code/name and owned UUID filtering. KiCad10.0.6 source proves flags0
uses `CSM_CONNECTIVITY_CHECK` and the item's net code. The independent graph
remains a separate required gate; no foreign copper or pour adds its edges.

The earlier fontcache incident is preserved separately. The read-only audit
found13 changed existing cache files and no other changes. Root298 restored all
14 original cache files from the pinned image, then verified all18238 regular
files and2115 links with no extras. Runtimev3 uses a private fontconfig copy and
bind; every later full rootfs check remains strict. The1.5GB rootfs and image
archive are excluded from the compact evidence increment.

## Portable increment boundary

The tested increment depends on the exact published Source289 archive and its
five ordered base archives. It stores public Source272 CAD data and closed
receipts only, never a current board default or a rootfs image. Workspace CAD
files are data-only evidence copies with explicit original paths and hashes;
the legacy workspace restorer is limited to its declared public `/tmp` targets.
Recreating a CAD stage or the KiCad runtime requires a separate explicit Root
operation after dependency verification. No application or SDK runs during
collection, archive verification or restoration.

The [portable evidence archive](artifacts/g350-source272-cad310-connected49-capped-default-drc-2026-10-16.tar.gz)
has SHA256 `e6b63b3e768f620eeaacd1ac5abadca747edf063ae79842c82fea9786fd0d753`.
Its [manifest](artifacts/g350-source272-cad310-connected49-capped-default-drc-2026-10-16.manifest.json)
has SHA256 `1ada576fa863f460a925f7e7f76b9fa796646f477e0d0007d6647a42644b9135`.
The [restore test](artifacts/g350-source272-cad310-restoration-validation-2026-10-16.json)
passes all 64 member hashes/sizes/modes and normalized headers, isolated
extraction and a second zero-write extraction. All 216 actual prerequisite/local
targets, ten data-only CAD files and the dependency link remain exact after the
existing workspace helper's zero-write restore.

The [read-only connectivity report](artifacts/g350-source272-kicad49-read-only-validation-2026-10-16.json)
and [unfiltered-as-returned default DRC](artifacts/g350-source272-kicad-default-capped-drc-2026-10-16.json)
are also directly available. Root304's process returned zero while its checker
report was incomplete with a TypeError; that semantic failure remains preserved.
Root310's report, input preservation and process closure all pass.
