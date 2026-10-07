#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
source cloud/env.sh
if ! command -v g++ >/dev/null; then
  source /etc/os-release
  case "${ID:-}" in debian|ubuntu) ;; *) echo 'A C++17 compiler is required.' >&2; exit 1 ;; esac
  routing_privilege=()
  if [[ "$(id -u)" != 0 ]]; then routing_privilege=(sudo -n); fi
  "${routing_privilege[@]}" apt-get update
  "${routing_privilege[@]}" apt-get install -y --no-install-recommends g++
fi
mkdir -p .cloud-tools/python-routing
# Keep Python routing tools isolated from board Node/Bun lockfiles and the
# reviewed native checks. Verify official wheel hashes, including dependencies.
python3 -m pip install --no-deps --only-binary=:all: --require-hashes \
  --upgrade --target .cloud-tools/python-routing \
  -r cloud/python-routing-requirements.txt
g++ -O3 -std=c++17 scripts/g350-grid-path.cpp -o .cloud-tools/g350-grid-path.next
mv .cloud-tools/g350-grid-path.next .cloud-tools/g350-grid-path
cp .cloud-tools/g350-grid-path .cloud-tools/g350-grid-negotiated-path
python3 scripts/verify-g350-routing-tools.py
