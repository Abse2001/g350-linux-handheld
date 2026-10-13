#!/usr/bin/env bash
set -euo pipefail
cd /workspace/g350-linux-handheld
source cloud/env.sh
# Prepare or verify the separate reviewed exporter; preserve installed packages.
python3 scripts/prepare-isolated-cli-physical-vias.py \
  --cli-package-directory node_modules/@tscircuit/cli \
  --output-directory .cloud-tools/cli-physical-vias
