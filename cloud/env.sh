# Source this file from any shell in the checked-out board repository.
G350_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$G350_REPO_ROOT/.cloud-tools/node/bin:$G350_REPO_ROOT/.cloud-tools/bun/node_modules/.bin:$G350_REPO_ROOT/node_modules/.bin:$PATH"
export G350_KICAD_CLI="kicad-cli"
export G350_KICAD_PYTHON="$G350_REPO_ROOT/scripts/kicad-python.sh"
