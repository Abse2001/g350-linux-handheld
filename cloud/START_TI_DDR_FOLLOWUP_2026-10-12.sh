#!/usr/bin/env bash
set -euo pipefail
cd /workspace/g350-linux-handheld
source cloud/env.sh
# Refresh the handoff without replacing local hardware work.
git fetch origin codex/cloud-handoff
if [[ "$(git branch --show-current)" != codex/cloud-handoff ]]; then
  test -z "$(git status --porcelain)" || { echo 'Preserve local G350 edits before switching handoff branches.' >&2; exit 1; }
  if git show-ref --verify --quiet refs/heads/codex/cloud-handoff; then
    git switch codex/cloud-handoff
  else
    git switch -c codex/cloud-handoff FETCH_HEAD
  fi
fi
git merge --ff-only FETCH_HEAD
cd /workspace/bus-lanes-solver
# Keep the source fix separate from the board lockfile runtime.
git fetch https://github.com/Abse2001/bus-lanes-solver.git codex/fix-g350-ddr-routing
g350_solver_expected=c1151212be7b9de4b34b07436d135d874e6c0466
test "$(git rev-parse FETCH_HEAD)" = "$g350_solver_expected"
if [[ "$(git branch --show-current)" != codex/fix-g350-ddr-routing ]]; then
  test -z "$(git status --porcelain)" || { echo 'Preserve local Bus Lanes edits before switching the source branch.' >&2; exit 1; }
  if git show-ref --verify --quiet refs/heads/codex/fix-g350-ddr-routing; then
    git switch codex/fix-g350-ddr-routing
  else
    git switch -c codex/fix-g350-ddr-routing FETCH_HEAD
  fi
fi
git merge --ff-only FETCH_HEAD
test "$(git rev-parse HEAD)" = "$g350_solver_expected"
# Verify preserved installed bytes and archive without replacing packages.
python3 /workspace/g350-linux-handheld/cloud/verify-installed-dependencies.py \
  --receipt /workspace/bus-lanes-solver/.cache/topology-installed-dependencies-20261012T0154Z/archive-receipt.json \
  --expected-receipt-sha256 1a49a60909258b542c7f4899e6378fa9f10c1cea08ef1aaf4b5366480dbf71b7 \
  --audit-tool /workspace/g350-linux-handheld/cloud/audit-installed-dependencies.py
# Audit the prepared source/dependencies and fixed fixtures without routing.
mkdir -p /workspace/g350-linux-handheld/.cloud-tools/start-validation
g350_start_audit_parent=$(mktemp -d /workspace/g350-linux-handheld/.cloud-tools/start-validation/bus-lanes-audit.XXXXXX)
bun scripts/benchmark-frozen-g350.ts --revision "$g350_solver_expected" --directory "$g350_start_audit_parent/audit" --prepare-only
cd /workspace/g350-linux-handheld
source cloud/env.sh
bash cloud/START_OUTER_DDR_RUNTIME_2026-10-11.sh
# Restore the collected TI diagnostics into their own ignored namespace.
python3 scripts/restore-g350-routing-evidence.py \
  cloud/artifacts/g350-ti-ddr-linux-followup-2026-10-12.manifest.json \
  --destination .cloud-tools/ti-ddr-followup-restored-2026-10-12
# Restore the verified RAM-placement and solver diagnostics separately.
python3 scripts/restore-g350-routing-evidence.py \
  cloud/artifacts/g350-ti-ddr-v7-linux-followup-2026-10-12.manifest.json \
  --destination .cloud-tools/ti-ddr-v7-followup-restored-2026-10-12

# PROPOSAL ONLY: add after existing1975/660 restores once this exact block is tested.
# The surrounding saved Start sources cloud/env.sh and audits the trusted solver dependencies.
python3 scripts/restore-g350-routing-evidence.py \
  cloud/artifacts/g350-ti-ddr-v7-diagnostics-2026-10-13.manifest.json \
  --destination .cloud-tools/ti-ddr-v7-diagnostics-restored-2026-10-13
python3 .cloud-tools/ti-ddr-v7-diagnostics-restored-2026-10-13/report/verify-replay-files.py \
  --manifest cloud/artifacts/g350-ti-ddr-v7-diagnostics-2026-10-13.manifest.json \
  --destination .cloud-tools/ti-ddr-v7-diagnostics-restored-2026-10-13 \
  --apply-indexed-modes --create-trusted-resolver-links
# Recover indexed records/modes only; no installs, source adoption or diagnostic routing.

# Restore the closed V4 software/runtime diagnostics as evidence only.
# Keep the bootstrap verifier available before recovering its archived copy.
python3 - <<'PY'
import hashlib
from pathlib import Path
helper = Path('/workspace/g350-linux-handheld/cloud/restore-v4-closed-evidence.py')
if hashlib.sha256(helper.read_bytes()).hexdigest() != 'b43531921f3ee396a2e72cf8a55c180c7f9fa0ce73a298e65df8a663a5ba40fd':
    raise SystemExit('Closed V4 recovery helper differs from tested bytes.')
PY
python3 /workspace/g350-linux-handheld/cloud/restore-v4-closed-evidence.py restore \
  --manifest /workspace/g350-linux-handheld/cloud/artifacts/g350-ti-ddr-v4-closed-runs-2026-10-13.manifest.json \
  --manifest-sha256 c445edd385778f883b57fa58060b8bd866d268924f76fc8dadb187061d8fae5e \
  --archive /workspace/g350-linux-handheld/cloud/artifacts/g350-ti-ddr-v4-closed-runs-2026-10-13.tar.gz \
  --destination /workspace/g350-linux-handheld/.cloud-tools/ti-ddr-v7-diagnostics-restored-2026-10-13-v4-closed \
  --prior-map /dev/stdin <<'JSON'
{
  "/workspace/g350-linux-handheld/cloud/artifacts/g350-ti-ddr-linux-followup-2026-10-12.manifest.json": "/workspace/g350-linux-handheld/.cloud-tools/ti-ddr-followup-restored-2026-10-12",
  "/workspace/g350-linux-handheld/cloud/artifacts/g350-ti-ddr-v7-linux-followup-2026-10-12.manifest.json": "/workspace/g350-linux-handheld/.cloud-tools/ti-ddr-v7-followup-restored-2026-10-12",
  "/workspace/g350-linux-handheld/cloud/artifacts/g350-ti-ddr-v7-diagnostics-2026-10-13.manifest.json": "/workspace/g350-linux-handheld/.cloud-tools/ti-ddr-v7-diagnostics-restored-2026-10-13"
}
JSON
# Historical controller paths/authorities and private Git are not reconstructed.
# No saved diagnostic is launched; board/runtime adoption remains a separate task.
