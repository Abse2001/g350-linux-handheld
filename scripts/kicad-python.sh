#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "$root/.cloud-tools/kicad10-debian.tar" ]]; then
  exec bash "$root/scripts/cloud-kicad-tool.sh" xvfb-run -a /usr/bin/python3 "$@"
fi
exec xvfb-run -a /usr/bin/python3 "$@"
