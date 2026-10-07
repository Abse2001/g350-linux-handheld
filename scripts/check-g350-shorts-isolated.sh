#!/usr/bin/env bash
# Keep the CLI's fixed debug-output paths outside frozen handoff evidence.
set -euo pipefail
project="$(cd "$(dirname "$0")/.." && pwd)"
source "$project/cloud/env.sh"
test "$#" = 2
input="$(realpath "$1")"
mkdir -p "$2"
output="$(realpath "$2")"
test ! -e "$output/shorts.log"
set +e
(cd "$output"; "$project/node_modules/.bin/tsci" check shorts "$input" --mode gerber --layer all) > "$output/shorts.log" 2>&1
check_exit=$?
set -e
python3 - "$project" "$input" "$output" "$check_exit" <<'PY'
import json,hashlib,sys
from pathlib import Path
project,source,output=map(Path,sys.argv[1:4]);code=int(sys.argv[4])
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
result=dict(input=str(source),inputSha256=sha(source),mode='gerber',layer='all',
    cliVersion=json.loads((project/'node_modules/@tscircuit/cli/package.json').read_text())['version'],
    cliSha256=sha(project/'node_modules/@tscircuit/cli/dist/cli/main.js'),
    logSha256=sha(output/'shorts.log'),exitCode=code,workingDirectory=str(output),fabricationReady=False)
(output/'execution.json').write_text(json.dumps(result,indent=2)+'\n')
PY
cat "$output/shorts.log"
exit "$check_exit"
