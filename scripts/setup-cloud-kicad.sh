#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .cloud-tools/bin .cloud-tools/python-compat
cp scripts/cloud-kicad-sitecustomize.py .cloud-tools/python-compat/sitecustomize.py
image=g350-kicad-debian:10.0.6
if [[ -f .cloud-tools/kicad10-debian.tar ]]; then
  (cd .cloud-tools; sha256sum -c kicad10-debian.tar.sha256)
  docker load -i .cloud-tools/kicad10-debian.tar >/dev/null
elif ! docker image inspect "$image" >/dev/null 2>&1; then
  container="g350-kicad-install-$$"
  cleanup_container() { docker rm -f "$container" >/dev/null 2>&1 || true; }
  trap cleanup_container EXIT
  docker run --network host --name "$container" -e HTTP_PROXY -e HTTPS_PROXY -e NO_PROXY \
    -e DEBIAN_FRONTEND=noninteractive \
    debian:sid@sha256:a2aa46262453eba3f464d8b1c7a8c31db85eb15af180ae34dd400615d7208547 \
    bash -c 'apt-get -o APT::Update::Error-Mode=any update && apt-get install -y --no-install-recommends kicad=10.0.6+dfsg-1 xvfb xauth python3-wxgtk4.0 python3-venv python3-reportlab python3-pypdf poppler-utils ca-certificates && apt-get clean'
  # Import the installed filesystem without retaining runtime proxy variables.
  docker export "$container" | docker import \
    --change 'ENV PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' - "$image"
  cleanup_container
  trap - EXIT
fi
if [[ ! -f .cloud-tools/kicad10-debian.tar ]]; then
  docker save -o .cloud-tools/kicad10-debian.tar "$image"
  (cd .cloud-tools; sha256sum kicad10-debian.tar > kicad10-debian.tar.sha256)
fi
cat > .cloud-tools/bin/kicad-cli <<'CLI'
#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
exec bash "$root/scripts/cloud-kicad-tool.sh" kicad-cli "$@"
CLI
chmod +x .cloud-tools/bin/kicad-cli
.cloud-tools/bin/kicad-cli version
