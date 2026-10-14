This is a SOURCE/DATA restoration proposal for the verified manual clock
capture 77605, strict types 61948, Core 41840, Native/API 42626 and CLI 87907.
It contains 314 regular files, totaling 66,037,634 logical bytes, compressed
into a 3,914,005-byte archive. The 144 imported Source files and 13 original
private continuous-check API bodies are included with exact current bytes and
modes, together with the Source/guard ancestry, original inputs and baselines,
actual output/control/capture/diagnostic files, and collected execution proofs.

The archive SHA256 is
`e7d286d456eec4bd6a7f721502ce87e9775ae847bbfde41929ff581701a641df`.
The index SHA256 is
`7c741294e616877a20b4a8e69903a7473136bff140c0e6b19eb67a4706709230`.
The restorer pins both hashes, archive size, the exact 314 allowed destinations,
total logical size, and every indexed file hash, size and mode. Destinations
are confined to `g350-linux-handheld/.cloud-tools` and
`bus-lanes-solver/.cache` under the chosen workspace root.

The restorer walks parent directories through held descriptors and refuses
symlinks, traversal, unindexed paths, differing files and differing modes.
It verifies the complete archive and every existing destination before any
write. New payloads are staged, checked and fsynced, then published with an
exclusive atomic hard link; an existing leaf is never replaced. Exact repeat
restoration creates zero files. No archived Python, TypeScript, board, SDK or
CAD code is imported or executed during restoration.

Run from the board project, with an existing empty temporary workspace for
a data restoration test, or `/workspace` to verify the prepared filesystem:

```bash
cd /workspace/g350-linux-handheld
source cloud/env.sh
python3 -B scripts/restore-g350-clock-manual-source-data.py \
  --manifest cloud/artifacts/g350-ti-ddr-clock-manual-source-data-2026-10-14.manifest.json \
  --manifest-sha256 7c741294e616877a20b4a8e69903a7473136bff140c0e6b19eb67a4706709230 \
  --archive cloud/artifacts/g350-ti-ddr-clock-manual-source-data-2026-10-14.tar.gz \
  --workspace /ABS/EXISTING/EMPTY/WORKSPACE --restore
```

Omit `--restore` to verify without creating files. Use the standard
`/workspace` mapping when reconstructing the prepared project; Source imports
retain their original absolute paths. A temporary-root restoration is a data
test and does not make those Source imports executable at that temporary path.

`RESTORE_VALIDATION.json` records ten actual temporary-root cases: fresh
restoration with independent verification of all 314 hashes/sizes/modes,
repeat, verify, empty verification, conflicting last leaf, wrong mode,
symlink parent, symlink leaf, corrupt archive and caller-forged manifest.
Seven direct unsafe-member cases were also refused. Conflicts were detected
before any member write, and no temporary publication files remained.

Historical Root authorizations, guards, process identities, execution receipts
and outputs are evidence only. They do not authorize new tasks or make old
one-use guard output directories reusable. A new task requires a new owned
authority and fresh output namespace, with applicable Source/dependency checks.
Some preserved earlier manifests describe historical file modes; the archive
index records the exact current modes of the preserved files. No historical
manifest or hardware source was rewritten to reconcile that metadata.

Node/Bun binaries, `node_modules`, vendor IBIS/models, credentials and the
retained KiCad image/archive are excluded. Tested environment setup reconstructs
the runtime separately. This bundle does not reconstruct or qualify runtime,
SDK trees, Source resolver symlinks, KiCad or a new managed environment. It
does not claim complete operational closure from data restoration alone.

The KiCad PCB from CLI 87907 is included as exact output data. Actual KiCad
94957 independently passed the narrow clock connectivity check; its outer
negative-expectation gate failed because KiCad inferred the raw net-0 via nets.
Read `TI_DDR_CLOCK_FRESH_SOURCE_NATIVE_CAD_2026-10-14.md`. CAD data can be retained
in a separate archive; this sealed archive need not change. No electrical timing/reference/full49
acceptance or fabrication readiness is claimed. All hardware sources and
frozen evidence remain untouched, and `fabricationReady=false`.

Root independently repeated the ten temporary-root cases and seven unsafe
member refusals, then tested the exact tracked command with `/workspace`:
314 existing exact files, zero created. See
`TI_DDR_CLOCK_MANUAL_SOURCE_DATA_RESTORE_VALIDATION_2026-10-14.json`.
