#!/usr/bin/env bash
# Same full independent CAD checks in one KiCad process environment/container.
set -euo pipefail
test "$#" -eq 3
input="$1"; verified_root="$2"; solver_input="$3"
cp "$0" "$verified_root/kicad-qualification.executed.sh"
python_kicad() { xvfb-run -a -e /dev/stderr /usr/bin/python3 "$@"; }
python_kicad scripts/prepare-g350-ground-references.py "$verified_root/candidate.kicad_pcb" "$input" "$verified_root/filled" --all-layers > "$verified_root/ground-reference.log" 2>&1
cp dist/g350-checked-shortcuts-verified-179/filled/ground-reference.kicad_pro "$verified_root/filled/ground-reference.kicad_pro"
cp "$verified_root/candidate.kicad_dru" "$verified_root/filled/ground-reference.kicad_dru"
board="$verified_root/filled/ground-reference.kicad_pcb"
kicad-cli pcb drc "$board" --format json --severity-all --all-track-errors --refill-zones --save-board -o "$verified_root/filled/before-library-drc.json" > "$verified_root/filled/before-library-drc.log" 2>&1
python_kicad scripts/copy-g350-kicad-ink-layers.py dist/g350-checked-shortcuts-verified-179/filled/ground-reference.kicad_pcb "$board" > "$verified_root/filled/ink.log" 2>&1
python_kicad scripts/prepare-kicad-library.py "$board" > "$verified_root/filled/library.log" 2>&1
kicad-cli pcb drc "$board" --format json --severity-all --all-track-errors --refill-zones --save-board --exit-code-violations -o "$verified_root/filled/drc.json" > "$verified_root/filled/drc.log" 2>&1
python_kicad scripts/check-g350-full-kicad-connectivity.py "$board" "$input" "$solver_input" "$verified_root/filled/final-connectivity.json" > "$verified_root/filled/connectivity.log" 2>&1
python_kicad scripts/export-g350-ground-polygons.py "$board" "$verified_root/filled/ground-polygons.json" > "$verified_root/filled/polygons.log" 2>&1
