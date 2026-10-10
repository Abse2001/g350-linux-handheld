#!/usr/bin/env bash
set -euo pipefail
cd /workspace/g350-linux-handheld
# Use existing attached checkouts; tasks are already isolated. No worktree.
git fetch origin codex/cloud-handoff
if [[ "$(git branch --show-current)" != codex/cloud-handoff ]]; then
  test -z "$(git status --porcelain)" || { echo 'Preserve local edits before switching handoff branches.' >&2; exit 1; }
  if git show-ref --verify --quiet refs/heads/codex/cloud-handoff; then
    git switch codex/cloud-handoff
  else
    git switch -c codex/cloud-handoff FETCH_HEAD
  fi
fi
git merge --ff-only FETCH_HEAD
bash scripts/setup-cloud.sh
bash scripts/setup-g350-routing-tools.sh
