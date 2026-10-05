# Source this file from any shell in the checked-out board repository.
G350_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$G350_REPO_ROOT/.cloud-tools/bin:$G350_REPO_ROOT/.cloud-tools/node/bin:$G350_REPO_ROOT/.cloud-tools/bun/node_modules/.bin:$G350_REPO_ROOT/node_modules/.bin:$PATH"
export G350_KICAD_CLI="kicad-cli"
export G350_KICAD_PYTHON="$G350_REPO_ROOT/scripts/kicad-python.sh"

# User configuration and caches must be writable in isolated task shells.
export XDG_CONFIG_HOME="$G350_REPO_ROOT/.cloud-tools/xdg-config"
export XDG_CACHE_HOME="$G350_REPO_ROOT/.cloud-tools/xdg-cache"
export XDG_DATA_HOME="$G350_REPO_ROOT/.cloud-tools/xdg-data"
export npm_config_cache="$G350_REPO_ROOT/.cloud-tools/npm-cache"
