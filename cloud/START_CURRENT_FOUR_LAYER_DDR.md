# G350 AM3352 handheld: current task startup

Use the existing isolated checkouts under `/workspace`; do not create a worktree.
Preserve existing edits, untracked work, hardware sources and frozen evidence.
Use `Abse2001/g350-linux-handheld` branch `codex/cloud-handoff`, not the older
default `main`. The saved Install script fetches and fast-forwards that branch.
Do not reset or overwrite local changes to switch branches.

Activate every shell from the board root:

```bash
cd /workspace/g350-linux-handheld
source cloud/env.sh
git branch --show-current
node --version
bun --version
```

These commands were exercised in the prepared environment: branch
`codex/cloud-handoff`, Node 25.6.1, Bun 1.3.14. Keep the reviewed runtime and
native-checks patch: tscircuit 0.0.2821, Core 0.0.2107, CLI 0.1.2258 and
checks 0.0.242. Attached upstream source is for inspection. Installation and
Linux/KiCad setup history remain in `cloud/SETUP_REQUEST.md`, `AGENTS.md` and
`docs/CLOUD_HANDOFF.md`; `cloud/CONTINUE_BOARD.md` preserves board history.

For current routing, read `cloud/DDR_FOUR_LAYER_MANUAL_ROUTING_2026-10-16.md`
first. Its latest section supersedes older counts and Top/Bottom-only requests.
The user chose DDR signals on all four copper layers: Top, Inner1, Inner2 and
Bottom. TI's usual four-layer stack instead reserves inner reference planes;
the chosen arrangement still needs reference redesign and electrical review.

The latest editable checkpoint is Source313 / candidate299: all 49 genuine
CPU/RAM connections, 35 fresh fidelity checks, 280 real parts and 234 fullspan
vias. Both 11-member byte groups pass planar skew at 0.5771666935 and
0.5769421603 mm against 0.635 mm. All three pair skews pass 0.127 mm.
Command/clock is unfinished: 16/26 reach minimum, ten remain short, full skew
17.6628187566 mm fails. All 32 native checks completed with 951 unfiltered
findings; auth315 authenticates all 234 vias without foreign track violations.
All 19 current pours remain independently unqualified.

Separate physical model318 tunes Source37 to 21.2000 mm, retains all 49 paths
and both byte groups, and reaches 17/26 command/clock minima with nine short.
It passes the fresh physical49/changed-join/critical API/C31/reference/PDN gates,
but has no fresh editable-source/native-board/pour/CAD qualification. Do not
silently replace Source313 with that model or combine incompatible studies.

Source272 has a separate fresh KiCad10 scoped49 connectivity proof. Read
`cloud/DDR_SOURCE272_KICAD_CONNECTIVITY_2026-10-16.md`: its default DRC retains
2102 reported violations and 499 opens under per-code caps and five default
ignored checks. This is not a whole-board pass and is not inherited by later
sources. Keep the pinned KiCad image/archive and rootfs under ignored
`.cloud-tools`; current source and reports reconstruct or verify the tools.

Use the restored prepared filesystem first. If routing evidence is missing,
follow the current report and its hash-pinned archive manifests. Restore the
Source32 lineage, then Source209 → Source228 → Source248 → Source257 →
Source272-v2 → Source289 → Model299 → Source313 → Model318, in order.
The four newest increments passed isolated archive extraction and the existing
workspace helper's actual zero-write `--restore` branch, checking 167, 180,
220 and 239 respective prerequisite/local targets. All hashes and modes remain
in their manifests and linked restore reports. Extract newer archives into a
task-owned `/tmp` directory to preserve workspace disk capacity, then pass that
directory's full `.cloud-tools/...` saved path to
`scripts/restore-g350-four-layer-routing-workspace.py --saved-directory ... --restore`.
Never overwrite a differing existing target or frozen metadata to make restore
pass. The Source272 CAD increment is separate data-only evidence; its workspace
CAD copies are not automatically restored by the legacy helper.

Before routing, rendering or CAD, inspect the current Root process journal at
`/workspace/bus-lanes-solver/.cache/root-routing-progress/LATEST_CONTINUATION_2026-10-14.json`
and establish current ownership, immutable input pins and bounded execution.
Historical receipts do not authorize or prove a new execution. Processes do
not survive environment publication. Retain the reviewed resource limits and
all original physical/timing assertions; do not mask findings or swap numeric
pins. Incomplete tighter-spacing alternatives remain studies.

Keep `fabricationReady=false`. Reference continuity, impedance, electrical
timing/SI, complete board connectivity, fabrication checks and exact shell fit
remain unfinished. Environment publication is separate from fabrication.
