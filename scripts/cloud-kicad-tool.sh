#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
image=g350-kicad-debian:10.0.6
docker_local=(bash "$root/scripts/cloud-docker.sh")
if ! "${docker_local[@]}" image inspect "$image" >/dev/null 2>&1; then
  (cd "$root/.cloud-tools"; sha256sum -c kicad10-debian.tar.sha256)
  "${docker_local[@]}" load -i "$root/.cloud-tools/kicad10-debian.tar" >/dev/null
fi
# VFS allocates both an init layer and a writable copy even for --read-only.
# Refuse before container creation: ENOSPC can otherwise leave orphan copies.
if [[ "$("${docker_local[@]}" info --format '{{.Driver}}')" == vfs ]]; then
  docker_root="$("${docker_local[@]}" info --format '{{.DockerRootDir}}')"
  image_bytes="$("${docker_local[@]}" image inspect "$image" --format '{{.Size}}')"
  python3 - "$docker_root" "$image_bytes" <<'PY'
import shutil,sys
available=shutil.disk_usage(sys.argv[1]).free
required=2*int(sys.argv[2])+256*1024*1024
if available < required:
    print(f'KiCad VFS disk preflight refused: {available} bytes free; {required} required. Preserve evidence and reclaim space before retrying.',file=sys.stderr)
    sys.exit(3)
PY
fi
# VFS image copies can fill the workspace disk. Put transient Xvfb/config files
# on /tmp, and optionally mirror an explicitly selected new dist output there.
# The container still sees the same paths; copy completed outputs back only after
# Docker has removed its VFS copy. Keep the verified image/archive unchanged.
scratch="$(mktemp -d /tmp/g350-kicad-runtime.XXXXXX)"
mkdir -p "$scratch/xdg-config" "$scratch/xdg-cache" "$scratch/xdg-data"
for area in config cache data; do
  if [[ -d "$root/.cloud-tools/xdg-$area" ]]; then
    cp -a "$root/.cloud-tools/xdg-$area/." "$scratch/xdg-$area/"
  fi
done
output_dir="${G350_KICAD_OUTPUT_DIRECTORY:-}"
output_mount=()
if [[ -n "$output_dir" ]]; then
  output_dir="$(realpath -e "$output_dir")"
  [[ "$output_dir" == "$root/dist/"* && -d "$output_dir" ]]
  mkdir "$scratch/output"
  cp -a "$output_dir/." "$scratch/output/"
  python3 "$root/scripts/verify-g350-kicad-output-mirror.py" snapshot "$output_dir" "$scratch/original.json"
  output_mount=(-v "$scratch/output:$output_dir")
fi
finish() {
  local outcome=$?
  trap - EXIT
  if [[ -n "$output_dir" ]]; then
    if ! python3 "$root/scripts/verify-g350-kicad-output-mirror.py" unchanged "$output_dir" "$scratch/original.json"; then
      echo "KiCad output changed outside the container; preserved results in $scratch" >&2
      exit 1
    fi
    if ! cp -a "$scratch/output/." "$output_dir/" || ! python3 "$root/scripts/verify-g350-kicad-output-mirror.py" equal "$scratch/output" "$output_dir"; then
      echo "KiCad copy-back failed; preserved results in $scratch" >&2
      exit 1
    fi
  fi
  rm -rf -- "$scratch"
  exit "$outcome"
}
trap finish EXIT
"${docker_local[@]}" run --rm --init -i --user "$(id -u):$(id -g)" \
  --read-only --tmpfs /tmp:rw,nosuid,size=512m \
  --tmpfs /tmp/.X11-unix:rw,nosuid,size=1m,mode=1777 \
  -v /workspace:/workspace -w "$PWD" \
  -v "$scratch:/g350-runtime" "${output_mount[@]}" \
  -e PYTHONPATH="$root/.cloud-tools/python-compat" \
  -e XDG_CONFIG_HOME=/g350-runtime/xdg-config \
  -e XDG_CACHE_HOME=/g350-runtime/xdg-cache \
  -e XDG_DATA_HOME=/g350-runtime/xdg-data \
  "$image" "$@"
