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
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-protected-layer-progress/connected-source-609-622-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-reverse-window-progress/connected-source-642-645-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-bus-lanes-timing-progress/connected-source-698-701-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-four-layer-owned-via-progress/connected-source-734-739-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-shorter-byte1-second-batch-progress/connected-source-763-772-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-clean-corners-forward-progress/connected-source-828-838-manifest.json
bash scripts/setup-g350-routing-tools.sh
python3 scripts/verify-g350-routing-tools.py

python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-outer-ddr-request-2026-10-11/latest-runtime-910-926-manifest.json
python3 - <<'VERIFY_LATEST_OUTER_RUNTIME'
import hashlib,json
from pathlib import Path
assert json.loads(Path('node_modules/tscircuit/package.json').read_text())['version']=='0.0.2819'
assert hashlib.sha256(Path('node_modules/@tscircuit/checks/dist/index.js').read_bytes()).hexdigest()=='1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc'
p=Path('.cloud-tools/runtime-outer-ddr-910/dist/latest-wrapper-source')
a=json.loads((p/'compiled.circuit.json').read_text());b=json.loads(Path('dist/g350-ddr-ground-preserving-clean-corners-source-836/compiled.circuit.json').read_text())
assert [e for e in a if e['type']!='source_project_metadata']==[e for e in b if e['type']!='source_project_metadata']
r=json.loads((p/'result.json').read_text());assert r['code']==1 and not r['forcedTimeout'] and r['selectedPhaseFinished'] and r['freshCompiledSource'] and r['sourceDefinitionsUnchanged']
assert json.loads(Path('design-status.json').read_text())['fabricationReady'] is False
print('Latest tscircuit wrapper verified; requested Top/Bottom DDR remains unsolved. Preserve the connected fallback and read the new continuation report.')
VERIFY_LATEST_OUTER_RUNTIME
