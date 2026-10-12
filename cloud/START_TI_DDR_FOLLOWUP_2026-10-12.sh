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
