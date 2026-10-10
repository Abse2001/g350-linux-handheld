# G350 cloud Linux validation

Validated 2026-10-06 in **G350 AM3352 handheld**, on Debian 13 x86_64.
The board checkout is `codex/cloud-handoff`; the created-environment transfer
record at `15448a8` was fetched before these setup changes. All eleven attached
upstream checkouts match `cloud/repositories.json` and are inspection sources,
not substitutes for the board's published runtime.

## Tested tools and setup

- Node 25.6.1, Bun 1.3.14, TypeScript 5.9.3; board lockfile unchanged.
- tscircuit 0.0.2744, core 0.0.2088, props 0.0.687, checks 0.0.239,
  capacity-autorouter 0.0.958, CLI 0.1.2237, Circuit JSON 0.0.515,
  React 19.3.0. Shared core identity and native BusLanesSolver,
  BusLanesPipelineSolver and DogboneFanoutSolver exports pass.
- Native checks correction SHA256:
  `50b27442a32befe1fe3f4e83fa082c6efe3e00e6af71e64869778bb68b479805`.
- KiCad CLI 10.0.6 / Python binding 10.0.6+dfsg-1, installed from official
  Debian packages in a Debian sid tool image. Host KiCad 9.0.2 is not used.
  wx 4.2.5 / wxWidgets 3.2.11, Python 3.14.7, reportlab 5.0.0, pypdf 6.19.0.
- Docker 28.4.0 is required. Tool containers are disposable; the 1.5 GiB image
  archive and SHA256 file are retained only under ignored `.cloud-tools`.
  `setup-cloud-kicad.sh` reconstructs it from a digest-pinned official Debian
  base and signed APT packages, or verifies and loads the retained archive.
  It reuses platform Docker proxy settings without saving proxy credentials.

The original Ubuntu-only setup guard now supports Debian through the isolated
KiCad tool image, while retaining the Ubuntu installation path. `cloud/env.sh`
selects local tools and writable caches; `kicad-python.sh` uses headless Xvfb.
Docker `--init` is required so Xvfb can signal readiness. A narrow sitecustomize
alias supplies `SwigPyIterator.next = __next__` for Debian's generated KiCad
binding; iteration, StopIteration, board data and checker assertions are unchanged.
`checkout-cloud-upstreams.mjs` reuses attached checkouts rather than duplicating
all eleven repositories. `verify-cloud.sh` preserves frozen mechanical evidence
and retains the fresh mechanical report under ignored `checks/cloud`.

## Results

- Restored and hash verified all **25,814 evidence files**; repeated restoration
  succeeds without replacing edited evidence.
- `bash scripts/setup-cloud.sh` and the reusable Install script complete the
  pinned install, evidence restoration and cloud smoke checks.
- A fresh task shell sources `cloud/env.sh` and verifies tools, board hashes,
  patched checks, solver exports, all upstream refs and KiCad/Python imports.
- `npm run typecheck`: pass.
- Current all-layer Gerber shorts: **zero**, using the unchanged frozen circuit.
- Mechanical checks: three current outputs preserve the provisional 76 × 118 ×
  1.6 mm outline and four layers. Original-shell fit remains unverified.
- Fresh `tsci export --format kicad_pcb`: pass, output under `checks/cloud`.
- KiCad `pcb drc --refill-zones --save-board --format json --all-track-errors
  --severity-all --exit-code-violations`: executes and saves fresh board/report.
  The unqualified raw export exits **5**, with **1,296 error violations,
  699 warnings and 499 reported/capped opens**. This demonstrates tool operation,
  not physical qualification; the raw export lacks the board's release adapters.
- `prepare-kicad-library.py` on that fresh normalized export: **280 exact local
  footprints**, all **1,052 physical records unchanged**.
- Unchanged existing byte0 plane checker on frozen KiCad 10 evidence: **101
  package terminals, 119 full-depth vias, both filled planes continuous**, pass.
- Frozen DDR connectivity checker: **11/49 connected**, exactly the expected
  partial result. No additional DDR channel is qualified by setup.

Fresh reports/logs are in ignored `checks/cloud`; command logs are in
`/workspace/setup-logs`. Original frozen circuit SHA256 remains
`01815364357e0354de1089af4253e2ce2dc926f822b5f173b7ccb133e459f555`, and the byte0
KiCad board remains
`1b61379e0f651fa99527abd1721de2819ced06adbf4c4fc6269ab6ca8e2c6cfd`.

## Start and continuation

```bash
cd /workspace/g350-linux-handheld
source cloud/env.sh
node scripts/verify-cloud-state.mjs
node scripts/checkout-cloud-upstreams.mjs
kicad-cli version
scripts/kicad-python.sh -c 'import pcbnew, wx; print(pcbnew.GetBuildVersion()); print(wx.version())'
```

To refresh: `bash scripts/setup-cloud.sh`. To rerun the smoke suite:
`bash scripts/verify-cloud.sh`. Use existing checkouts; do not create a worktree
unless explicitly requested. No persistent application service is needed.

The prepared filesystem and tested scripts are ready for environment publication;
publication and restoration into a new platform task are separate user actions
and have not been claimed as completed. The retained image can load in a fresh
Docker runtime; no running container is required to survive the snapshot.

Hardware sources, dependency declarations, lockfiles and frozen evidence are
unchanged. **fabricationReady remains false**: current default is 280 parts,
four layers, 11/49 DDR channels. Seeded-strobe independent qualification, exact
shell fit and all documented release gates remain outstanding. No routing,
experimental promotion or fabrication publication was performed. Continue with
`cloud/CONTINUE_BOARD.md` after publishing the reusable environment.

## Connected timing checkpoint and low-disk KiCad (2026-10-10 UTC)

Debian 13, Node 25.6.1, Bun 1.3.14 and official KiCad 10.0.6 / pcbnew 10.0.6+dfsg-1
remain tested. Board runtime, eleven source references, solver/checker pins and
reviewed checks SHA256: 1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc
are unchanged. The new exact Start block is committed as
`cloud/START_TIMING_CHECKED_2026-10-10.sh`; actual exit0 confirms frozen25,814
files, all checked archives, runtime/upstreams, KiCadversion/pcbnew APIs and
NumPy2.3.5/SciPy1.17.0/Shapely2.1.2 with all four C++controls. Install script
remains unchanged from tested draft19. This tests the current prepared Linux
filesystem; it does not claim a newly provisioned task or published configuration.

`scripts/cloud-kicad-tool.sh` now uses a read-only container root, temporary
Xvfb/XDG storage and an optional explicitly selected dist output mirror in
/tmp. Results copy back after VFS container removal, with original-output
concurrent-edit refusal and complete hash equality. Controls517 show all
positive operations exit0 and modified-file refusal exit1 with edits preserved.
Full source532/CAD533/Gerber534 and source540/CAD541/Gerber542 each qualify0
using this wrapper. CLIflags, all-rule severities, numeric connectivity, native
ground/physical assertions and Gerber checks stay unchanged. CAD515 reports
a real ground open and is preserved as failed evidence.

Keep `.cloud-tools/kicad10-debian.tar`, checksum and installed official image
in the prepared filesystem. Archive SHA256 remains
70a47643a9a6d89cca64579b5ef6bab5a290803ccc94ed9b9e170fb14c70b6bb.
The source wrapper checksum-verifies and reloads that archive if the image
is missing; the Start block also checks its hash. Frozen10.0.5 evidence is
untouched. VFS still requires transient disk for one container; run containers
sequentially and avoid concurrent source/archive writers during image copies.

The new450-member checked archive passes exact archive, fresh/repeat/in-place
restore and edited-file refusal. Test logs and commands are in
`checks/integrated/g350-constant-neck-timing-progress/runtime-validation-544-manifest.json`.
Unqualified trials are archived separately; never substitute them for the
current checked entry. Fabrication readiness remains false.
