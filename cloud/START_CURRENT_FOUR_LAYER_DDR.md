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

For current routing, read `cloud/DDR_CA18_EDITABLE_SOURCE_2026-10-17.md`
first, then `cloud/DDR_FOUR_LAYER_MANUAL_ROUTING_2026-10-16.md` for history.
The current report supersedes older counts and Top/Bottom-only requests.
The user chose DDR signals on all four copper layers: Top, Inner1, Inner2 and
Bottom. TI's usual four-layer stack instead reserves inner reference planes;
the chosen arrangement still needs reference redesign and electrical review.

The latest editable checkpoint is Source333 / physical Model328: all 49 genuine
CPU/RAM numeric-pad graphs, 35 fresh fidelity checks, 280 real parts and 236 fullspan
vias. Both 11-member byte groups pass planar skew at 0.5771666935 and
0.5769421603 mm against 0.635 mm. All three pair skews pass 0.127 mm.
Command/clock is unfinished: 18/26 reach minimum, eight remain short, full skew
17.6628187566 mm fails. All 32 native checks completed with 951 unfiltered
findings: one bus-skew failure, 70 unrouted declarations, 718 connectivity
findings and 162 width warnings. None of the width warnings directly names a
current DDR declaration; no finding is filtered or waived. Auth335 authenticates
all 236 actual vias without foreign track violations or unresolved identities.
Audits339/340 and coverage341 complete the scoped foreign-copper margin
check of all 19 literal Source333 pours, all 236 vias and 5573 DDR wire segments,
with zero findings and minimum edge gap 0.1183205295 mm against 0.1016 mm.
This excludes reference-wire geometry and does not qualify reference continuity,
own-net reentry or PDN connectivity. Later models do not inherit this result.

All four layers contain DDR traces. The current segment counts are Top362,
Inner1 1684, Inner2 2078 and Bottom1449. Model328 changes only bodies20/23/25/36
from Model318, with two genuine additional Source25 vias. Source25 now reaches
21.1965717360 mm. The Source20 clearance repair shortens it to12.1001310191 mm;
it remains underlength. Both bytes and all other45 bodies remain held. Changed
edges introduce no preferred3W self-spacing failures; retained old preferred
self/foreign-spacing findings remain unwaived. Whole TI qualification is false.
The remaining short command/clock owners are0/19/5/20/7/22/8/9. Source0/ODT
fanout alternatives remain studies; no partial route or incomplete power-via
replacement is adopted. Preserve true package pins and all power connections.

Source272 has a separate fresh KiCad10 scoped49 connectivity proof. Read
`cloud/DDR_SOURCE272_KICAD_CONNECTIVITY_2026-10-16.md`: its default DRC retains
2102 reported violations and 499 opens under per-code caps and five default
ignored checks. This is not a whole-board pass and is not inherited by later
sources. Keep the pinned KiCad image/archive and rootfs under ignored
`.cloud-tools`; current source and reports reconstruct or verify the tools.

Use the restored prepared filesystem first. If routing evidence is missing,
follow the current report and its hash-pinned archive manifests. Restore the
Source32 lineage, then Source209 → Source228 → Source248 → Source257 →
Source272-v2 → Source289 → Model299 → Source313 → Model318 → Model328,
then the current Source333 increment, in order. Model328's verified archive
contains66 files and301 cumulative restore targets. The Source313 pour327
increment is separate historical evidence, not a Source333 prerequisite.
Current Source333 archive:
`cloud/artifacts/g350-four-layer-both-bytes-ca18-connected49-source333-2026-10-17.tar.gz`,
SHA256 `3b42fefada48d7338fbd674c9461d0b46ab6f51690102465816c3861c0ad2fe9`.
Use its adjacent `.manifest.json` and canonical saved directory
`.cloud-tools/ddr-four-layer-source333-2026-10-17`. Its71 members passed
normalized-header/hash/size/mode checks, isolated extraction and all368 actual
local/prerequisite targets before and after zero-write workspace restore.
Completed increments pass isolated archive extraction and the existing
workspace helper's actual zero-write `--restore` branch. All hashes and modes remain
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
