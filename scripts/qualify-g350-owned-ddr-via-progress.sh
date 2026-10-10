#!/usr/bin/env bash
# Qualify an exact planned source replay with scoped A0 owned-barrel movement. Never routes hardware.
set -euo pipefail
source cloud/env.sh
test "$#" -eq 6
source_root="$1"
verified_root="$2"
shorts_root="$3"
baseline="$4"
expected_skew="$5"
planned="$6"
test "$expected_skew" -ge 0 && test "$expected_skew" -le 3
test ! -e "$verified_root" && test ! -e "$shorts_root"
mkdir -p "$verified_root"
cp "$0" "$verified_root/qualification.executed.sh"
export G350_QUAL_SOURCE="$source_root" G350_QUAL_VERIFIED="$verified_root" G350_QUAL_EXPECTED_SKEW="$expected_skew"
trap 'G350_QUAL_EXIT=$?; export G350_QUAL_EXIT; python3 -c '\''import json,os,pathlib; pathlib.Path(os.environ["G350_QUAL_VERIFIED"],"wrapper-exit.json").write_text(json.dumps({"exitCode":int(os.environ["G350_QUAL_EXIT"]),"expectedNativeBusSkewFailures":int(os.environ["G350_QUAL_EXPECTED_SKEW"])},indent=2)+"\n")'\''; exit "$G350_QUAL_EXIT"' EXIT
input="$source_root/compiled.circuit.json"
test -f "$source_root/result.json"
python3 - <<'PY'
import hashlib,json,os,pathlib
root=pathlib.Path(os.environ['G350_QUAL_SOURCE'])
r=json.load(open(root/'result.json'))
assert r['freshCompiledSource'] and r['sourceDefinitionsUnchanged'] and r['selectedPhaseFinished']
assert not r['forcedTimeout'] and r['signal'] is None and len(r['phases'])==3
assert r['code']==(1 if int(os.environ['G350_QUAL_EXPECTED_SKEW']) else 0)
e=json.load(open(root/'execution.json'))
assert e['sameCoreExports']
assert e['versions']=={'tscircuit':'0.0.2803','@tscircuit/cli':'0.1.2258','@tscircuit/core':'0.0.2107','@tscircuit/checks':'0.0.242','@tscircuit/capacity-autorouter':'0.0.962'}
assert e['nativeChecks']['sha256']=='1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc'
for a in [*r['artifacts'],*e['definitions'],e['nativeChecks']]:
 assert hashlib.sha256(pathlib.Path(a['path']).read_bytes()).hexdigest()==a['sha256']
for a in e['definitions']:
 assert hashlib.sha256(pathlib.Path(a['originalPath']).read_bytes()).hexdigest()==a['sha256']
PY
cp "$input" "$verified_root/candidate.circuit.json"
node scripts/compare-g350-owned-ddr-via-progress.mjs "$input" "$baseline" "$planned" "$verified_root/baseline-preservation.json" > "$verified_root/baseline-preservation.log" 2>&1
native_check() {
  local native_input="$1" native_output="$2" native_log="$3"
  set +e
  G350_ALLOW_DDR_REPAIR=1 node scripts/check-g350-full-routing-native.mjs "$native_input" "$baseline" "$native_output" > "$native_log" 2>&1
  local native_exit=$?
  set -e
  python3 - "$native_output" "$native_exit" "$expected_skew" <<'PY'
import json,sys
r=json.load(open(sys.argv[1]));expected=int(sys.argv[3])
assert int(sys.argv[2])==(1 if expected else 0)
assert r['counts']['checkPcbBusLengthSkew']==expected
assert all(v==0 for k,v in r['counts'].items() if k!='checkPcbBusLengthSkew'),r['counts']
PY
}
native_check "$input" "$source_root/native.json" "$source_root/native.log"
python3 scripts/collect-g350-full-solver-input.py "$source_root" "$verified_root/full-solver-input.json"
G350_EXPORT_WITHOUT_POURS=1 node scripts/export-g350-large-kicad.mjs "$input" "$verified_root/candidate.kicad_pcb" > "$verified_root/export.log" 2>&1
node scripts/prepare-am3352-kicad.mjs "$verified_root/candidate.kicad_pcb" "$input" > "$verified_root/preparation.log" 2>&1
# Bundle the identical CAD sequence to avoid repeated VFS image copies.
# The original host/wrapper flow remains available without a cloud image.
if [[ -f .cloud-tools/kicad10-debian.tar ]]; then
  G350_KICAD_OUTPUT_DIRECTORY="$verified_root" bash scripts/cloud-kicad-tool.sh bash scripts/qualify-g350-kicad-full-checks.sh "$input" "$verified_root" "$verified_root/full-solver-input.json"
else
  scripts/kicad-python.sh scripts/prepare-g350-ground-references.py "$verified_root/candidate.kicad_pcb" "$input" "$verified_root/filled" --all-layers > "$verified_root/ground-reference.log" 2>&1
  cp dist/g350-checked-shortcuts-verified-179/filled/ground-reference.kicad_pro "$verified_root/filled/ground-reference.kicad_pro"
  cp "$verified_root/candidate.kicad_dru" "$verified_root/filled/ground-reference.kicad_dru"
  board="$verified_root/filled/ground-reference.kicad_pcb"
  kicad-cli pcb drc "$board" --format json --severity-all --all-track-errors --refill-zones --save-board -o "$verified_root/filled/before-library-drc.json" > "$verified_root/filled/before-library-drc.log" 2>&1
  scripts/kicad-python.sh scripts/copy-g350-kicad-ink-layers.py dist/g350-checked-shortcuts-verified-179/filled/ground-reference.kicad_pcb "$board" > "$verified_root/filled/ink.log" 2>&1
  scripts/kicad-python.sh scripts/prepare-kicad-library.py "$board" > "$verified_root/filled/library.log" 2>&1
  kicad-cli pcb drc "$board" --format json --severity-all --all-track-errors --refill-zones --save-board --exit-code-violations -o "$verified_root/filled/drc.json" > "$verified_root/filled/drc.log" 2>&1
  scripts/kicad-python.sh scripts/check-g350-full-kicad-connectivity.py "$board" "$input" "$verified_root/full-solver-input.json" "$verified_root/filled/final-connectivity.json" > "$verified_root/filled/connectivity.log" 2>&1
  scripts/kicad-python.sh scripts/export-g350-ground-polygons.py "$board" "$verified_root/filled/ground-polygons.json" > "$verified_root/filled/polygons.log" 2>&1
fi
board="$verified_root/filled/ground-reference.kicad_pcb"
python3 scripts/rebuild-g350-filled-pours.py "$input" "$board" "$verified_root/filled/ground-polygons.json" "$verified_root/filled/final-connectivity.json" "$verified_root/fresh-filled.circuit.json" > "$verified_root/fill-reconstruction.log" 2>&1
native_check "$verified_root/fresh-filled.circuit.json" "$verified_root/native-filled.json" "$verified_root/native-filled.log"
python3 - <<'PY'
import json,os,pathlib
root=pathlib.Path(os.environ['G350_QUAL_VERIFIED'])
d=json.load(open(root/'filled/drc.json'))
assert not d['violations'] and not d['unconnected_items'] and not d['schematic_parity']
c=json.load(open(root/'filled/final-connectivity.json'))
assert c['connectedConnections']==c['requiredConnections']==217
assert c['missingPadMemberships']==c['disconnectedConnections']==0
p=json.load(open(root/'filled/ground-reference.kicad_pro'))
assert not p['board']['design_settings'].get('drc_exclusions',[])
assert all(v!='ignore' for v in p['board']['design_settings']['rule_severities'].values())
PY
bash scripts/check-g350-shorts-isolated.sh "$verified_root/fresh-filled.circuit.json" "$shorts_root" > "$verified_root/shorts.log" 2>&1
python3 scripts/render-g350-full-board-layers.py "$input" "$verified_root/pcb-all-layers.png" "217/217 connected | 49 DDR | zero DRC/shorts | DDR bus matching: $expected_skew failures | not fabrication ready"
