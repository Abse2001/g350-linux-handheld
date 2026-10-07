#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
image=g350-kicad-debian:10.0.6
docker_local=(bash "$root/scripts/cloud-docker.sh")
if ! "${docker_local[@]}" image inspect "$image" >/dev/null 2>&1; then
  (cd "$root/.cloud-tools"; sha256sum -c kicad10-debian.tar.sha256)
  "${docker_local[@]}" load -i "$root/.cloud-tools/kicad10-debian.tar" >/dev/null
fi
# Keep the same working directory and user; outputs stay in the checkout.
exec "${docker_local[@]}" run --rm --init -i --user "$(id -u):$(id -g)" \
  -v /workspace:/workspace -w "$PWD" \
  -e PYTHONPATH="$root/.cloud-tools/python-compat" \
  -e XDG_CONFIG_HOME="$root/.cloud-tools/xdg-config" \
  -e XDG_CACHE_HOME="$root/.cloud-tools/xdg-cache" \
  -e XDG_DATA_HOME="$root/.cloud-tools/xdg-data" \
  "$image" "$@"
