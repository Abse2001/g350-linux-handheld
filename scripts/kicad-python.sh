#!/usr/bin/env bash
set -euo pipefail
exec xvfb-run -a /usr/bin/python3 "$@"
