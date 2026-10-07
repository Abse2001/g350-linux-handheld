# Whole-board routing connected; DDR bus matching remains

Continue `experiments/am3352-g350-full-board-ground-joined-replay.circuit.tsx`.
The user requested routing the rest of the rotated-RAM board. Fresh editable
source and independent KiCad now verify **217/217 connections**, including
**49/49 DDR signals**, 298 ground ports and all 1,032 required numeric PCB ports.
Every physical pad associated with those ports was checked, including multipart
lands. `fabricationReady` remains **false**.

The board retains all 280 placements of the rotated, clock-clustered reference,
RAM at 90 degrees and four layers. Approximately 64.925% of planar DDR length
uses Inner1/Inner2. The complete board has 944 standard full-depth through-vias,
with 0.4572 mm lands and 0.254 mm drills. The provisional outline remains
76 × 118 × 1.6 mm; measured original-shell fit is still unqualified.

## Verification

The source build is `dist/g350-full-board-ground-joined-source-replay-72`.
It finished in 440.312 seconds with unchanged input definitions and a fresh
compiled circuit, SHA256
`3cd5b175253342cd6a422c2c5e6a60f53ad89a300cbb5a837055716aae90683d`.
Its exit code is **1**, with exactly three whole-DDR-bus skew errors. It is not
a passing complete build. The separate full native check reports zero errors
for connectivity, missing traces, contiguity, dangling traces, physical spacing,
trace width, placement, routing constraints and strict manufacturing clearance.
The reviewed checks hash remains
`7bb83632137db56a698d91dc75ace0e74561e51dfcfb2bd9c6928a2280c45b2a`.

`dist/g350-full-board-ground-joined-source-verified-73` contains the independent
export of that exact compiled source. Fresh fills on all four layers verify
217/217 connections and zero missing pad memberships. The filled board SHA256
is `63d1433efcfe2c6f0daa93d63a9a9a23703c0068e36d03a3acd232d79b55e09d`.
All KiCad error categories, including unconnected items, are zero. No rule is
ignored and no item is excluded. The exact fresh-filled Circuit JSON preserves
every non-pour source record and has zero all-layer Gerber shorts. Its full
native check again reports only the same three bus-skew errors.

KiCad still reports warnings: 199 library-footprint issues, 199 silkscreen
overlaps, 199 silkscreen-over-copper items, 115 dangling vias, 42 dangling tracks
and five silkscreen edge clearances. They remain recorded, not waived. Clearing
required connectivity and error categories does not qualify electrical timing,
power delivery, return paths, assembly or fabrication.

| DDR bus | Native skew | Required maximum |
| --- | ---: | ---: |
| Byte 0 | 36.739114 mm | 0.635 mm |
| Byte 1 | 42.943753 mm | 0.635 mm |
| Command/clock | 31.489073 mm | 0.635 mm |

All three differential pairs pass their 0.127 mm limits. Native length includes
a 1.6 mm allowance per routing via; package delay, actual via delay, impedance,
coupling, nominal lengths and signal integrity remain unqualified. A bounded
large-growth timing trial (61) accepted no legal changes and is preserved.

## Changes and preserved trials

Ground recovery repaired the CPU escape, CPU decoupling/PLL ground and RAM
ground while retaining all required peripheral connections. Three DDR paths
(D3, WEn and A10) needed real local repairs around RAM; their branched copper
was canonicalized and independently rechecked. Existing matched pair copper
was preserved. Canonicalization does not establish timing readiness.

Both unused switch pin-4 terminals, already internally grounded, now have
explicit source ground connections. Endpoint width guards preserve the input
cache's positive-length wire geometry and prevent Core reversal from widening
a thin terminal segment. Fresh compiled-source native and independent checks
verify the result; no width or spacing assertion was disabled.

Dead tails were trimmed. A hash-bound KiCad connectivity check then identified
seven entire floating branches and three unused vias; removing them cleared
the remaining unconnected-item errors without losing any required pad. The
source-generated ground had a separate three-port keypad island even when
KiCad's fresh fill connected it. A short ground escape and one standard via
at (-0.8, -34.2) join it, clearing the source's 216 ground-port errors.

The negotiated router now retains foreign via-land clearance when existing
vias are protected, can freeze each new ground stitch and each recovered net,
and respects signal-only net selection when considering ground recovery.
Trials 42, 46 and 52 and their independent exports exercised these corrections.
Physical, native and numeric assertions remain enabled. Board runtime and
solver/checker pins were not changed; attached upstream code remains inspection
material.

Rejected and intermediate runs are archived separately, including wrong-layer
and clearance failures, the retained-via assertion failure, stale-plane source
builds and unsuccessful timing tuning. Source callbacks and router model counts
alone are not qualification evidence. The default 11/49 entry, the checked
zero-skew DDR-only entry and frozen hardware evidence are unchanged.

## Restore and continue

After `source cloud/env.sh`, restore the final checked evidence with:

```bash
python3 scripts/restore-g350-routing-evidence.py \
  checks/integrated/g350-full-board-progress/ground-joined-source-72-73-manifest.json
```

The restorer verifies the archive and every member and refuses to replace
differing local evidence. Archive verification, fresh restoration, repeat
restoration and preservation of a differing local file were tested. Historical
archives have their own manifests: `ground-recovery-24-53-manifest.json` and
`connected-routing-54-71-manifest.json`. Read individual failures before reuse.

The final snapshot `pcb-all-layers.png` shows actual source traces, pads and
vias; pours are omitted for readability. The hashes, native counts, numeric
connectivity, warnings and archive references are in
`checks/integrated/g350-full-board-progress/summary.json`.

Continue DDR matching from the new whole-board entry, with full native checks,
fresh source replay, all-phase numeric pad mapping, all-layer Gerber checks and
fresh all-rule KiCad checks after copper changes. Preserve both buses and the
pair limits. Never promote the DDR-only zero-skew result as qualification of
this different whole-board copper. Electrical/PDN/return-path verification,
exact shell and assembly fit, Linux validation and release gates remain open.
