#!/usr/bin/env bash
# Debian/Ubuntu Codex Cloud setup; this runs only in the requested cloud environment.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(uname -s)" != Linux ]]; then
  echo "This setup script requires a Linux cloud environment." >&2
  exit 1
fi
source /etc/os-release
case "${ID:-}" in
  debian)
    # Isolate KiCad 10's newer Debian libraries from the Debian 13 host.
    bash scripts/setup-cloud-kicad.sh
    ;;
  ubuntu)
    privilege=()
    if [[ "$(id -u)" != 0 ]]; then privilege=(sudo -n); fi
    "${privilege[@]}" apt-get update
    "${privilege[@]}" apt-get install -y --no-install-recommends ca-certificates curl git xz-utils software-properties-common python3 python3-venv python3-pip xvfb xauth python3-wxgtk4.0 poppler-utils
    "${privilege[@]}" add-apt-repository --yes ppa:kicad/kicad-10.0-releases
    "${privilege[@]}" apt-get update
    "${privilege[@]}" apt-get install -y --no-install-recommends kicad
    ;;
  *) echo "Supported Linux distributions: Debian or Ubuntu; got ${ID:-unknown}." >&2; exit 1 ;;
esac
mkdir -p .cloud-tools/downloads .cloud-tools/node
case "$(uname -m)" in
  x86_64) node_arch=x64 ;;
  aarch64|arm64) node_arch=arm64 ;;
  *) echo 'Unsupported Node architecture' >&2; exit 1 ;;
esac
node_archive="node-v25.6.1-linux-${node_arch}.tar.xz"
if [[ ! -x .cloud-tools/node/bin/node ]]; then
  curl --fail --location --retry 3 "https://nodejs.org/dist/v25.6.1/$node_archive" -o ".cloud-tools/downloads/$node_archive"
  curl --fail --location --retry 3 https://nodejs.org/dist/v25.6.1/SHASUMS256.txt -o .cloud-tools/downloads/SHASUMS256.txt
  (cd .cloud-tools/downloads; awk -v target="$node_archive" '$2 == target' SHASUMS256.txt > selected.sha256; test -s selected.sha256; sha256sum -c selected.sha256)
  tar -xJf ".cloud-tools/downloads/$node_archive" --strip-components=1 -C .cloud-tools/node
fi
mkdir -p .cloud-tools/xdg-config .cloud-tools/xdg-cache .cloud-tools/xdg-data
source cloud/env.sh
test "$(node --version)" = v25.6.1
python3 scripts/restore-cloud-evidence.py
GIT_CONFIG_COUNT=2 \
  GIT_CONFIG_KEY_0=url.https://github.com/.insteadOf GIT_CONFIG_VALUE_0=ssh://git@github.com/ \
  GIT_CONFIG_KEY_1=url.https://github.com/.insteadOf GIT_CONFIG_VALUE_1=git@github.com: \
  npm ci --legacy-peer-deps --ignore-scripts
node scripts/patch-tscircuit-via-pad-check.mjs
node scripts/checkout-cloud-upstreams.mjs
npm install --prefix .cloud-tools/bun --no-package-lock bun@1.3.14
if [[ "$ID" == ubuntu ]]; then
  python3 -m venv .cloud-tools/python
  .cloud-tools/python/bin/pip install 'reportlab>=4,<5' 'pypdf>=6,<7'
fi
chmod +x scripts/kicad-python.sh
bash scripts/verify-cloud.sh
