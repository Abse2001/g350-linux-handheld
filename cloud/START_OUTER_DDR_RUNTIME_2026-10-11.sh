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
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-outer-ddr-placement-continuation/latest-wrapper-2821-full-source-replay-1044-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-outer-ddr-placement-continuation/alternative-byte-paths-and-exact-selection-1043-1048-manifest.json
python3 - <<'VERIFY_LATEST_OUTER_RUNTIME'
import hashlib,json
from pathlib import Path
assert json.loads(Path('node_modules/tscircuit/package.json').read_text())['version']=='0.0.2821'
assert hashlib.sha256(Path('node_modules/@tscircuit/checks/dist/index.js').read_bytes()).hexdigest()=='1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc'
p=Path('dist/g350-ddr-latest-wrapper-2821-source-replay-1044')
a=json.loads((p/'compiled.circuit.json').read_text());b=json.loads(Path('dist/g350-ddr-ground-preserving-clean-corners-source-836/compiled.circuit.json').read_text())
assert [e for e in a if e['type']!='source_project_metadata']==[e for e in b if e['type']!='source_project_metadata']
r=json.loads((p/'result.json').read_text());assert r['code']==1 and not r['forcedTimeout'] and r['selectedPhaseFinished'] and r['freshCompiledSource'] and r['sourceDefinitionsUnchanged']
assert json.loads(Path('design-status.json').read_text())['fabricationReady'] is False
print('Latest tscircuit wrapper verified; requested Top/Bottom DDR remains unsolved. Preserve the connected fallback and read the new continuation report.')
VERIFY_LATEST_OUTER_RUNTIME

python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-outer-ddr-placement-continuation/bus-and-cpu-recovery-967-980-manifest.json

python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-outer-ddr-placement-continuation/cpu-corridor-recovery-957-966-manifest.json

python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-outer-ddr-placement-continuation/joint-package-physical-progress-1001-1005-manifest.json

python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-outer-ddr-placement-continuation/near-cpu-preconditions-and-odt-repair-995-1000-manifest.json

python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-outer-ddr-placement-continuation/ram-placement-and-escapes-945-956-manifest.json

python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-outer-ddr-placement-continuation/reference-recovery-and-rejected-routes-981-994-manifest.json

python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-outer-ddr-placement-continuation/rejected-preconditions-and-plans-933-944-manifest.json

python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-outer-ddr-placement-continuation/centre-facing-fanouts-and-rejected-carriers-1006-1009-manifest.json

python3 - <<'VERIFY_JOINT_PACKAGE_ESCAPE_PROGRESS'
import hashlib,json
from pathlib import Path
summary=json.loads(Path('checks/integrated/g350-outer-ddr-placement-continuation/summary.json').read_text())
assert summary['fabricationReady'] is False and summary['qualifyingCompleteDdrCarriers']==0
trial=json.loads(Path('dist/g350-ddr-outer-only-joint-ram-checked-escape-plan-1005/trial-0.json').read_text())
assert trial['allCpuAndRamEscapesPhysicalPassed'] and all(v==0 for v in trial['counts'].values())
centre=json.loads(Path('dist/g350-ddr-outer-only-ram-centre-facing-escapes-1008/trial-0.json').read_text())
assert centre['allCpuAndRamEscapesPhysicalPassed'] and all(v==0 for v in centre['counts'].values())
assert hashlib.sha256(Path('dist/g350-ddr-ground-preserving-clean-corners-source-836/compiled.circuit.json').read_bytes()).hexdigest()==summary['protectedConnectedSourceSha256']
assert json.loads(Path('design-status.json').read_text())['fabricationReady'] is False
print('Joint49 CPU /91 RAM fanout evidence restored. DDR interconnect/reference/timing/source/CAD qualification is unfinished. Read cloud/DDR_OUTER_LAYER_PLACEMENT_CONTINUATION.md before routing.')
VERIFY_JOINT_PACKAGE_ESCAPE_PROGRESS

python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-outer-ddr-placement-continuation/closed-bus-and-13-channel-progress-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-outer-ddr-placement-continuation/checked17-and-joint-inner-references-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-outer-ddr-placement-continuation/checked17-kicad-dsn-and-router-diagnostics-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-outer-ddr-placement-continuation/exact-clearance-and-independent-cad-diagnostics-1035-1037-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-outer-ddr-placement-continuation/checked18-and-corrected-grid-progress-1036-1042-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-outer-ddr-placement-continuation/ram270-checked22-and-public-bus-trials-1049-1055-manifest.json
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-outer-ddr-placement-continuation/ram270-locked22-final-addition-trial-1056-manifest.json
python3 - <<'VERIFY_CHECKED_PARTIAL_DDR'
import json,hashlib
from pathlib import Path
s=json.loads(Path('checks/integrated/g350-outer-ddr-placement-continuation/summary.json').read_text())
p=Path(s['checkedLocalSource']);assert hashlib.sha256(p.read_bytes()).hexdigest()==s['checkedLocalSourceSha256']
a=json.loads(p.read_text());r=json.loads(Path(s['checkedLocalReport']).read_text())
assert r['physicalPassed'] and all(v==0 for v in r['counts'].values())
assert r['physicallyCheckedCompleteOuterChannels']==s['checkedLocalCompleteDdrCarriers']==22
assert r['missingDdrChannels']==s['missingLocalDdrCarriers']==27 and r['allMissingCpuRamAnd42ReferenceFanoutsReserved']
names={e['source_trace_id']:e['name']for e in a if e['type']=='source_trace' and e.get('name','').startswith('DDR_')};assert len(names)==49
selected=set(r['selectedNames']);traces=[e for e in a if e['type']=='pcb_trace' and names.get(e.get('source_trace_id'))in selected and e['route'][0].get('start_pcb_port_id') and e['route'][-1].get('end_pcb_port_id')]
assert len(traces)==22 and {names[t['source_trace_id']]for t in traces}==selected
for t in traces:
 for point in t['route']:
  assert point['layer']in ['top','bottom'] if point['route_type']=='wire' else point['from_layer']in ['top','bottom']and point['to_layer']in ['top','bottom']
board=Path(s['independentKicadDdrConnectivity']['board']);c=json.loads((board.parent/'ddr-connectivity.json').read_text())
assert hashlib.sha256(board.read_bytes()).hexdigest()==c['boardSha256']
assert c['requiredConnections']==49 and c['connectedConnections']==22 and c['disconnectedConnections']==27 and c['missingPadMemberships']==27
assert not s['fullSourceQualified'] and not s['fullTimingQualified'] and not s['fullCadQualified'] and s['fabricationReady']is False
assert json.loads(Path('design-status.json').read_text())['fabricationReady']is False
print('Restored22 checked local Top/Bottom DDR connections;27 remain missing. Read cloud/DDR_OUTER_LAYER_22_CHANNELS_2026-10-11.md. Timing/full-board/order qualification remains open.')
VERIFY_CHECKED_PARTIAL_DDR
