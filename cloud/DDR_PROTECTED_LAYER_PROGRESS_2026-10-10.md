# G350 connected board: protected-layer DDR length progress

Continue `experiments/am3352-g350-full-board-protected-layer-replay.circuit.tsx`. Fresh source610 / independent KiCad621 /
Gerber622 retain all217 authored connections, all49 DDR, all298 ground ports and
1,032 numeric ports. All280 placements, RAM90, four layers and824 standard
full-depth0.4572/0.254 mm vias remain. Original barrels/endpoints, pads, logical
constraints and peripheral copper are exactly preserved. Native physical and
manufacturing checks, every KiCad DRC severity, opens, dangling copper and all-layer
shorts are zero. No ignored rules or exclusions. Full qualification exits0.

| Native bus skew | Previous source591 mm | Source610 mm | Limit mm |
| --- | ---: | ---: | ---: |
| Byte0 | 0.574882 | 0.574882 | 0.635 |
| Byte1 | 7.373572 | 7.333572 | 0.635 |
| Command/clock | 10.350328 | 9.650328 | 0.635 |

All differential pairs pass0.127 mm. Two whole buses remain unmatched. Build exit1
is exactly those two errors: all three phases complete, definitions remain unchanged,
no timeout/signal is hidden, elapsed402.528 seconds.

A9 trial600 adds3 mm on Inner2 while preserving its checked top ground corridor.
The reusable tuner now accepts `G350_LENGTH_SIGNAL_LAYER_OVERRIDES_JSON`, for
example `{"DDR_A9":["inner2"]}`. Overrides must name selected-bus signals and be
nonempty unique subsets of global proposal layers. An additional assertion fixes
every other-layer wire point; defaults, vias/endpoints, full physical/fresh-ground
checks, native limits and reviewed patch stay unchanged. Positive605 exercises this
restriction and adds the same3 mm; negative606 rejects invalid inner9 with exit1.
Two-bus603 retains ten accepted units over two rounds, with fresh ground checked
for every unit and batch. Its fresh source then passes complete independent checks.

D12 attempts are preserved and rejected:601 refuses out-of-bounds viaCost20;
602/607 find no clearance-preserving bridge;604 is longer and fails self-short/
overlap;608 is physically legal but grows D12 to61.922 mm. Generator exit0 is not
qualification. Current D12 remains55.276643 mm, D9 47.943072 mm; command A0
52.452361 mm versus A13 42.802033 mm. Both groups still need substantial repair.

Native length includes1.6 mm per transition. It does not establish electrical delay.
The source-bound layer inventory preserves byte0 planar spread8 mm with2–7
transitions, byte1 5.011838 mm with2–6, command8.485113 mm with2–6. Target DDR
clock, manufacturer stackup, package/via/stub delay, impedance, coupling, return
paths, PDN/footprints, Linux bring-up and measured original-shell fit remain
unqualified. **fabricationReady=false; not ready to order.**

Summary: `checks/integrated/g350-protected-layer-progress/summary.json`.
Compiled SHA256: `dff444c5765cc9220d41fe2739d4426040a6600baa3c3e4460e8475377200922`.
Fresh-filled SHA256: `1757584360e3ac04d0c6cd0f9cbac5f2831ce1ba1bb220a1c62acedd755b066a`.

```bash
source cloud/env.sh
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-protected-layer-progress/connected-source-609-622-manifest.json
```

The452-member archive SHA256 is`525519794abaa28cf3173ea0031e81fcda5efdcb100a3f586b81810bf0c97f2e`.
Archive verification, fresh/repeated/in-place restoration pass0. Edited-file refusal
exits1 and preserves the edit. Planning/control600–608 and runtime/recovery611–624
archives retain executed helpers, options, logs and failed independent attempts.
The exact refreshed Start shell commands pass0, including all25,814 frozen hashes,
all11 upstream/runtime pins, official KiCad archive/version/APIs and geometry controls.
Install remains unchanged from tested revision19.

Independent attempt611 exits125 before KiCad because VFS fills disk;615 exits134
because GTK cannot initialize Xvfb. Recovery preserves seven unreferenced VFS
copies in a3,415,472,859-byte exact-compared backup under `/tmp`; registered images
and the verified KiCad archive remain intact. Removing only those orphan copies
leaves about9.5 GB free before rerun.101 redundant generated planning JSON files
(1,909,636,496 logical bytes) are preserved by13 independently fresh-restored
hash-indexed archives before removal; logical bytes do not imply recovered overlay
space. Frozen files and qualified sources remain. Index614 lists exact hashes.

The wrapper now refuses before container creation when available VFS space is less
than twice the pinned image size plus256 MiB (3,308,305,874 bytes). Real low-space
control618 exits3. A root-owned mode1777 socket tmpfs stabilizes unprivileged Xvfb;
eight consecutive real GTK/pcbnew controls pass0, then complete621/622 passes0.
The full CAD helper retains Xvfb stderr. Source scripts reconstruct these settings.

Preserve source591/565/540/532/468/443/319, native BusLanes bootstrap and frozen
KiCad10 evidence. User-owned changes remain exactly intact. Connection observations
are in PROTECTED_LAYER_CONNECTION_OBSERVED_2026-10-10.json. Saving an environment
draft requires user review/save/publication and does not prove new-task restoration.
