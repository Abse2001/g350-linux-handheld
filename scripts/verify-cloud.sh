#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source cloud/env.sh
mkdir -p checks/cloud
node scripts/verify-cloud-state.mjs
npm run typecheck
scripts/kicad-python.sh -c 'import pcbnew, wx; print("KiCad Python:", pcbnew.GetBuildVersion()); print("wx:", wx.version())'
kicad-cli version
shorts_directory=$(mktemp -d "$PWD/checks/cloud/current-shorts.XXXXXX")
bash scripts/check-g350-shorts-isolated.sh dist/g350-current-index-byte0-handoff-fixed/compiled.circuit.json "$shorts_directory" > checks/cloud/current-shorts.log 2>&1
# Keep frozen handoff evidence intact while retaining the fresh result.
backup=$(mktemp)
cp checks/mechanical/g350-current-envelope-check.json "$backup"
cleanup() {
  cp checks/mechanical/g350-current-envelope-check.json checks/cloud/mechanical-envelope-fresh.json
  cp "$backup" checks/mechanical/g350-current-envelope-check.json
  rm -f "$backup"
}
trap cleanup EXIT
node scripts/check-g350-mechanical-envelope.mjs
echo "Cloud smoke checks passed. Full PCB fabrication readiness remains false."
