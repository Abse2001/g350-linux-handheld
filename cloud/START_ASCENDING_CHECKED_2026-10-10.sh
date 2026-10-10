set -euo pipefail
cd /workspace/g350-linux-handheld
source cloud/env.sh
test "$(git branch --show-current)" = codex/cloud-handoff
test "$(node --version)" = v25.6.1
test "$(bun --version)" = 1.3.14
node scripts/verify-cloud-state.mjs
node scripts/checkout-cloud-upstreams.mjs
(cd .cloud-tools && sha256sum -c kicad10-debian.tar.sha256)
test "$(kicad-cli version)" = 10.0.6
scripts/kicad-python.sh -c 'import pcbnew,wx; assert pcbnew.GetBuildVersion().startswith("10.0.6"); assert all(callable(getattr(pcbnew,n)) for n in ("LoadBoard","SaveBoard")); assert hasattr(pcbnew.BOARD,"GetConnectivity"); print(pcbnew.GetBuildVersion()); print(wx.version())'
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
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-integrated-ground-safe-progress/connected-source-532-534-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-constant-neck-timing-progress/connected-source-539-542-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-large-group-restored-progress/connected-source-565-568-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-ascending-group-restored-progress/connected-source-589-593-manifest.json
bash scripts/setup-g350-routing-tools.sh
python3 scripts/verify-g350-routing-tools.py
