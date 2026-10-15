# G350 Source32 Linux checkpoint — 15 October 2026

The adopted checkpoint connects **32 of the original 49 DDR signals**, leaving **17 unfinished**. **The board is not ready to order or fabricate.**

Fresh capture, strict TypeScript checks and Core rendering passed in stage 67. Native stage 68 found no violations across 18 physical checks. Original API stage 69 passed 151 boolean predicates plus two joint-net aggregate gates, including both DQS1 coupled views. CLI stage 70 exported the unchanged Core JSON. CAD stage 71 checked that export using KiCad **10.0.6+dfsg-1**. Both zone and CAD children completed naturally with exit status zero; container cleanup was independently recorded. Root then adopted the partial checkpoint.

The four-layer design has 280 parts and 509 loaded footprints. CAD reconciled 297 source traces, 1,116 segments, 229 physical vias, 98 local CPU/RAM endpoint approaches and 32 complete CPU-to-RAM graphs. The vias comprise 129 reference barrels, 98 existing endpoint dogbones and two intermediate through-vias. DDR_WEn and DDR_BA2 each use Inner2 and Top with one intermediate via; DDR_A4 uses Inner2.

The diagnostic copy retained both hardware keepouts and contained zero copper pours. Original source and export bytes remained unchanged. No net repair, board save, copper refill or full-rule DRC was performed.

API stage 69 measured planar copper lengths, including fixed fanouts and routed interconnect:

| Group | Signals checked | Spread/skew (mm) | Limit (mm) |
|---|---:|---:|---:|
| Byte0, partial | 6 | 0.527591 | 0.635 |
| Byte1, complete roster | 11 | 0.627102 | 0.635 |
| Command/clock, partial | 14 | 0.485443 | 0.635 |
| DQS0 pair | 2 | 0.047005 | 0.127 |
| DQS1 pair | 2 | approximately 0 | 0.127 |
| Clock pair | 2 | 0.083221 | 0.127 |

These checks establish planar matching for the loaded signals. Electrical delay remains unqualified: via depth, layer propagation, package delay, impedance and final stackup still need verification. The 400 MHz RAM clock and 1.6 mm board thickness remain planning defaults.

The remaining 17 DDR connections, reference-plane redesign and continuous return paths, power distribution, exact shell fit and full-board fabrication checks remain unfinished. DDR routing on all four signal layers is the chosen arrangement; reference qualification remains pending. Full-board acceptance, all-49 acceptance, electrical timing and fabrication readiness remain **false**. Frozen hardware sources and evidence are preserved.


The [PCB snapshot](artifacts/g350-ddr-source32-four-layer-kicad-verified-2026-10-15.png) was generated from the verified fresh export and checked against the stage 71 report.

The [portable archive](artifacts/g350-ti-ddr-source32-through-cad71-source-data-2026-10-15.tar.gz) adds 315 public source/data files (63,904,514 logical bytes) after verifying all 1,023 prerequisite files. Its [index](artifacts/g350-ti-ddr-source32-through-cad71-source-data-2026-10-15.manifest.json) and [restorer](../scripts/restore-g350-source32-through71-source-data.py) preserve prior evidence. All [20 restore controls and 13 privacy controls](artifacts/g350-source32-through71-restore-test-report-2026-10-15.json) passed, including fresh restoration, idempotence, changed inputs, symlinks, collisions and attempts to replace predecessor files. A [live restore](artifacts/g350-source32-through71-live-restore-report-2026-10-15.json) verified all 315 files and created none. Private authority and context bodies, SDKs, container images and frozen hardware evidence are excluded from this extension. Restored historical records confer no authority on a future execution.

Resume after the Source29 restore in the saved Start instructions, with `source cloud/env.sh`, using the following additional restore:

```bash
python3 scripts/restore-g350-source32-through71-source-data.py \
  --manifest cloud/artifacts/g350-ti-ddr-source32-through-cad71-source-data-2026-10-15.manifest.json \
  --manifest-sha256 88355cb25a68816e1cd6e2133e66b52feff010387cfc1f1e56af8ecc1b964d68 \
  --archive cloud/artifacts/g350-ti-ddr-source32-through-cad71-source-data-2026-10-15.tar.gz \
  --base-manifest cloud/artifacts/g350-ti-ddr-source23-core-native-cli-cad-public-failure-2026-10-14.manifest.json \
  --source24-api-manifest cloud/artifacts/g350-ti-ddr-source24-through-api-source-data-2026-10-15.manifest.json \
  --source24-cli45-manifest cloud/artifacts/g350-ti-ddr-source24-cli-cad-delta-source-data-2026-10-15.manifest.json \
  --source24-through47-manifest cloud/artifacts/g350-ti-ddr-source24-cad46-cad47-small-source-data-2026-10-15.manifest.json \
  --source26-through52-manifest cloud/artifacts/g350-ti-ddr-source26-through-cad52-source-data-2026-10-15.manifest.json \
  --source29-through60-manifest cloud/artifacts/g350-ti-ddr-source29-through-cad60-source-data-2026-10-15.manifest.json \
  --restore
```

Validated pins: source manifest `6cffcee4868f6fa81c48c4a105b594256ef4e53af057d4866d42407d797f7b4e`; Core JSON `8ff53b8f95e06f5323e324f146f6860c45f3dec2bf02ba308c6c0202671d1b03`; CAD report `3182ab17d4d91f26f0c1d0fc423957174d92f84e7e3298cffe3fdbd49cfdb510`; separate partial adoption `f2666dbc6db137ae3a5582a6e050d92e418cc0ef81c2f65e6df69ed299763a76`.

The C31 solver candidate passed its focused regression and all 647 tests. Its portable public regression and fair all-eleven benchmark remain pending; no release or regression-free benchmark claim is made.
