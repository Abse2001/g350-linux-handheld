#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source cloud/env.sh
mkdir -p checks/cloud
node scripts/verify-cloud-state.mjs
npm run typecheck
scripts/kicad-python.sh -c 'import pcbnew, wx; print("KiCad Python:", pcbnew.GetBuildVersion()); print("wx:", wx.version())'
kicad-cli version
node_modules/.bin/tsci check shorts dist/g350-current-index-byte0-handoff-fixed/compiled.circuit.json --mode gerber --layer all > checks/cloud/current-shorts.log 2>&1
node scripts/check-g350-mechanical-envelope.mjs
echo "Cloud smoke checks passed. Full PCB fabrication readiness remains false."
