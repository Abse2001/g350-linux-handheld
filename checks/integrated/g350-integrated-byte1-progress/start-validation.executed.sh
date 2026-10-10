set -euo pipefail
cd /workspace/g350-linux-handheld
source cloud/env.sh
test "$(git branch --show-current)" = codex/cloud-handoff
test "$(node --version)" = v25.6.1
test "$(bun --version)" = 1.3.14
node scripts/verify-cloud-state.mjs
node scripts/checkout-cloud-upstreams.mjs
kicad-cli version
scripts/kicad-python.sh -c 'import pcbnew,wx; print(pcbnew.GetBuildVersion()); print(wx.version())'
python3 scripts/restore-cloud-evidence.py
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-full-board-progress/ddr-shortcuts-74-86-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-dangling-copper-cleanup/cleaned-source-108-114-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-clean-length-progress/runtime-and-length-progress-115-132-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-middle-shortcut-progress/checked-source-and-trials-135-152-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-bend-timing-progress/checked-source-and-trials-153-172-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-checked-shortcut-progress/checked-source-and-trials-173-180-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-inner-ground-timing-progress/connected-source-209-211-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-ground-safe-byte-growth-progress/connected-source-319-321-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-byte0-matched-progress/connected-source-443-445-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-integrated-byte1-progress/connected-source-468-473-manifest.json
bash scripts/setup-g350-routing-tools.sh
python3 scripts/verify-g350-routing-tools.py
