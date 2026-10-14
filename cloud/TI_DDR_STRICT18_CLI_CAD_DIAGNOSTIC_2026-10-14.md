# Actual strict18 CLI and KiCad diagnostic data

This separate 64-file Source/DATA extension preserves the exact CLI10835 export, KiCad52647 connectivity diagnostic and the earlier failed KiCad67603 check. It leaves the frozen 314-, 26-, 217- and 27-file bundles unchanged. The original Core input `81a72280365352ac9116563921536a2aced6f7ea2b65f330535927582537c76a` and exported PCB `4d09599dc390bbd311be47cda5b4f3cc5b8842b56722381d9b5a25c52ce6a633` remain byte-identical.

CLI10835 completed with child/wrapper exit0 using the pinned direct circuit-JSON exporter; the recognized `.circuit.json` copy equals the original Core bytes. KiCad52647 completed with child/wrapper exit0 on retained KiCad10.0.6+dfsg-1. It loaded505 footprints,225 existing vias,988 segments and4 copper layers; all279 Source trace segments were mapped bijectively. The diagnostic proves96 local numeric-pad/stub/via net and physical approaches and18 nonzero-net/physical CPU→RAM graphs.505 includes SourceVia placeholders and is not an assembly-part count.

The original export contains7 zones:5 authentic Source copper pours and2 hardware keepouts. The diagnostic copy removes only the5 mapped copper pours, preserving both keepouts and every footprint/via/segment node. The actual pcbnew board retains2 rule-area keepouts and0 copper pours. No raw net repair, retagging, SaveBoard, zone refill or all-rule DRC occurred. KiCad's normal connectivity inference was allowed. This narrow result does not qualify continuous reference planes or electrical timing.

The earlier CAD67603 run remains failed with child/wrapper exit2 before pcbnew geometry loading: its old assertion expected4 raw zones. Its report, source and Root process receipts are preserved, not overwritten by the corrected zone contract.

Native54946 remains a mixed failed stage: Native physical child0, original API child1, Root wrapper2. Original sharp-angle failures on source_trace15/16/28 remain recorded. The diagnostic exports do not repair these paths or make `complete18Accepted` true.31 original signal routes are still missing; reference/electrical/all49/fabrication readiness remain false.

The archive includes immutable CLI0cb/native-scopef74/CADdb9 zone-mapping and earlier0b62 source, explicitly selected helper text, actual guards/authorities/collections/reports/logs/process records, the unchanged original Core/raw copy, original PCB and copper-free diagnostic copy. No SDK, runtime binaries, vendor model or container image is bundled. Earlier full Source/process evidence is separately available in the frozen217/27 bundles; earlier manual Source/CAD evidence stays in314/26. Historical one-use authorities are evidence only and never permission to launch a new worker.

A standalone restorer binds the compressed archive, index, exact serialized PAX byte count and all64 regular paths/hashes/modes. It walks held directory descriptors without symlinks, checks all existing leaves before writing and publishes absent files exclusively. Its protocol is byte-identical to the reviewed predecessor after reversing only pins, allowlist naming, temporary prefix and outcome labels. Actual temporary-only tests passed11 restoration/refusal cases plus7 unsafe paths, including long-name PAX roundtrip and refusal. Root independently reran all11 temporary-root cases and7 unsafe paths (actual15387, exit0), verified all64 hashes/modes, and tested the tracked live restore with64existing/0created. Frozen314/26/217/27 remained exact.

The five files are installed and independently tested. From the board checkout, verify without writes:

```bash
cd /workspace/g350-linux-handheld
source cloud/env.sh
python3 -B scripts/restore-g350-strict18-cli-cad-diagnostic-data.py \
  --manifest cloud/artifacts/g350-ti-ddr-strict18-cli-cad-diagnostic-data-2026-10-14.manifest.json \
  --manifest-sha256 4e0cb70c925bc99a67b64230016efb4a06117afa980d16b6650bdd6b20ec2db3 \
  --archive cloud/artifacts/g350-ti-ddr-strict18-cli-cad-diagnostic-data-2026-10-14.tar.gz \
  --workspace /workspace
```

Add `--restore` only to create absent exact indexed files. Differing bytes/modes or symlinks are refused. Data restoration never runs board, SDK or CAD code.
