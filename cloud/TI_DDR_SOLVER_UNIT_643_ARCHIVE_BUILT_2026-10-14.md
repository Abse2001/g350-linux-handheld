# Solver643 source and test evidence preservation

The exact104-file selection in `TI_DDR_SOLVER_UNIT_643_ARCHIVE_PLAN_2026-10-14.json` was packaged and tested as regular data. The original selection plan and qualification report remain unchanged. The archive contains4,566,697 logical bytes in452,299 compressed bytes; SHA256 `0222f8c42605e4e692a25b28300637773e76841396a785daacd1abb20fcc9277`. Its adjacent manifest has SHA256 `7f05fec0fc8c7e23c529ee70a97bc1f9287f354e8053c1d6a3e1969173ac9176`.

Root exercised the safe restorer against this exact archive. Fresh temporary restoration created104 files, all independently checked for hash, size and permission mode. Repeated restoration and verify-only passed with no changes. A differing destination and a symlink parent were both refused before any new files were written. Live verify-only found104 exact files in the prepared filesystem. `TI_DDR_SOLVER_UNIT_643_ARCHIVE_VALIDATION_2026-10-14.json` records those data checks. The helper retains the tested file-descriptor traversal and never-overwrite checks, with an explicit104-member allowlist.

For portable inspection, restore into a new empty workspace root. Existing Git checkouts can give tracked reports different permission modes than these preserved originals; strict restoration then refuses that collision. Do not change preserved mode expectations or overwrite existing reports. This archive is deliberately data only: selected source snapshots, patches, original failures and closed643-test/constructor outcomes. It omits dependencies, private Git metadata, execution authority, active benchmarks and a complete runnable source closure.

```bash
cd /workspace/g350-linux-handheld
source cloud/env.sh
unit643_review_root=$(mktemp -d /tmp/g350-unit643-review.XXXXXX)
python3 -B scripts/restore-g350-unit643-evidence.py \
  --manifest cloud/artifacts/g350-ti-ddr-solver-unit-643-evidence-2026-10-14.manifest.json \
  --manifest-sha256 7f05fec0fc8c7e23c529ee70a97bc1f9287f354e8053c1d6a3e1969173ac9176 \
  --archive cloud/artifacts/g350-ti-ddr-solver-unit-643-evidence-2026-10-14.tar.gz \
  --workspace "$unit643_review_root" --restore
```

This does not rerun application tests, establish standalone Start restoration, adopt the private solver stack or qualify all-eleven benchmarks. Current49 DDR interconnects, redesigned references, electrical timing and ordering remain unqualified; `fabricationReady=false`.
