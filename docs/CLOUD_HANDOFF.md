# G350 Linux handheld — cloud continuation handoff

Latest checked continuation (2026-10-10): use
`experiments/am3352-g350-full-board-byte0-matched-corner-clean-replay.circuit.tsx`
and read `cloud/DDR_BYTE0_MATCHED_2026-10-10.md` plus
`checks/integrated/g350-byte0-matched-progress/summary.json`.
Fresh source 443 / KiCad 444 / Gerber 445 preserve all 217 connections, 49 DDR,
298 ground ports, 1,032 numeric ports, 280 placements and 824 standard through-vias.
Native physical checks, all-rule DRC errors/warnings, opens, dangling copper and
all-layer shorts are zero. Byte0 passes native matching at 0.574882 mm; byte1
21.213572 mm and command/clock 24.150328 mm still fail 0.635 mm. All pairs pass.
Build exit is 1 for exactly those two failures; qualification wrapper exit is 0.
Native length counts 1.6 mm per transition; byte0's planar spread is 8 mm with
2–7 transitions. This is not electrical delay qualification. Preserve preceding
7165c90 / source 319 and all frozen evidence. Further byte1/command combinations
are unqualified; overlap repair 448 was rejected. Keep fabricationReady=false.


## Latest checked DDR shortcuts and runtime (2026-10-09 UTC)

Continue `experiments/am3352-g350-clean-full-board-checked-shortcuts-replay.circuit.tsx`.
Read `cloud/DDR_CHECKED_SHORTCUT_PROGRESS_2026-10-09.md`,
`cloud/RUNTIME_REFRESH_2026-10-09.md` and
`checks/integrated/g350-checked-shortcut-progress/summary.json`. Fresh source 178,
independent refill/export 179 and Gerber 180 retain 217/217 connections, 49 DDR
signals, 280 placements, RAM90, four layers and 824 standard full-depth vias.
DRC errors/warnings, opens, dangling copper and shorts are zero. All native checks
pass except three bus-skew failures: 29.148292 / 33.385093 / 24.480252 mm versus
0.635 mm; differential pairs pass. Only D2/D12/A0 copper changes. Other DDR and
peripheral geometry, logical constraints, pads, placements and vias are preserved.
The new tscircuit 0.0.2803 wrapper is source-tested with unchanged reviewed
Core/CLI/checker/solver pins. The preceding connected 7b08fba checkpoint and frozen
evidence remain. A separate exit-bound final artifact verifier passes; the initial
combined wrapper's exit 1 is retained and explained in the report. GitHub
authentication briefly failed, then recovered; a fresh fetch confirms the same
7b08fba parent. Preserve any newer transfer records before pushing. Matching and electrical
clock/stackup/package/via/impedance/return-path qualification remain unfinished.
Keep fabricationReady false. Older sections describe preserved checkpoints.

## Latest checked DDR bend progress (2026-10-09)

Continue `experiments/am3352-g350-clean-full-board-bend-timing-replay.circuit.tsx`.
Read `cloud/DDR_BEND_TIMING_PROGRESS_2026-10-09.md` and
`checks/integrated/g350-bend-timing-progress/summary.json`. Fresh source 166,
independent refill/export 167 and isolated Gerber 168 retain 217/217 connections,
49 DDR signals, all 280 placements, RAM90 and four layers. DRC errors/warnings,
opens, dangling copper and shorts are zero. All native checks pass except three
bus-skew failures: 30.621477 / 34.678381 / 24.692716 mm versus 0.635 mm.
Differential pairs pass. Non-DDR copper geometry, logical constraints and all
824 standard through-vias are unchanged; derived pour annotations renumber.
The preceding connected checkpoint and all new trials are hash-indexed and
retained. Runtime/checker/solver pins stay fixed. Whole-bus matching is unfinished;
target DDR clock and manufacturer stackup are still needed for electrical timing.
Keep fabricationReady false. Older sections describe preserved checkpoints.

Prepared 2026-10-06. This transfers the complete authored project, original
user-visible conversation, and routing evidence to GitHub before cloud setup.
**The PCB is unfinished and must not be ordered.** Moving it to cloud does not
qualify the electronics or prove that it fits the original shell.

Cloud setup is now verified on **Debian 13**, using isolated official **KiCad
10.0.6** tools. The initial Ubuntu setup assumption below is superseded by the
tested Debian/Ubuntu implementation and [Linux validation report](../cloud/LINUX_VALIDATION.md).
The **G350 AM3352 handheld** environment is **published**, with all twelve repos
attached. See [cloud setup](https://chatgpt.com/local/01a10e5b-3bbd-746c-bbc6-06cbc27d4064),
`cloud/transfer-status.json` and its publication screenshot. A new platform board
task has not yet been started or independently verified.

## Read first

- [Complete user-visible chat](CHAT_CONTEXT.md): all recorded human messages,
  structured question answers and visible assistant replies, chronologically.
- [Agent continuation rules](../AGENTS.md), [current DDR notes](G350_CURRENT_DDR.md),
  [design status](../design-status.json), [shell fit](G350_SHELL_FIT.md),
  [display](G350_DISPLAY.md), [integrated host](INTEGRATED_HOST.md).
- [Dependency and repository manifest](../cloud/repositories.json),
  [artifact manifest](../cloud/artifacts/manifest.json),
  [transfer status](../cloud/transfer-status.json).

The chat contains the full evolving requirements and historical results. This
handoff identifies the authoritative current board so a new agent does not
mistake a larger historical routing fixture for the current handheld.

## User decisions and scope

The user initially requested a G350 Gameboy Linux board in tscircuit, using
tsci, current packages, individually imported JLCPCB parts, phased autorouting,
manual repairs, shorts checks, other checks and fabrication outputs. Both a
GitHub and tscircuit repository were requested and already exist.

Processor exploration considered Rockchip and Pi Zero 2 W, with a later clear
request to put the processor itself on the main PCB rather than attach an SBC.
The final selected CPU is **TI AM3352BZCZ100**, JLCPCB **C468247**, a bare Cortex-A8
Linux processor. The user expressly accepts simple CPU-rendered games without
a 3D GPU. RAM is **MT41K256M16TW-107:P**, JLCPCB **C253882**, x16 **512 MiB DDR3L**
operated in DDR3-compatible mode. Do not revert to a Pi carrier or dual RP2350.

The finished handheld requires:

- Eleven front membrane button contacts; no analog sticks or rear buttons.
- Display connected by flexible cable/FPC. The present candidate is an
  EastRising ER-TFT035-7 bare panel with a 54-pin connector; electrical, panel
  firmware and mechanical compatibility remain to be qualified.
- Onboard microSD holder and Linux boot support.
- **One USB-C port for both charging and data/provisioning**. A separate external
  USB-C microSD reader did not meet the user's intent. Charging/data role,
  protection, firmware and Linux installation/recovery need complete validation.
- At most **four copper layers**. Components on both top and bottom are allowed;
  the earlier top-only preference was explicitly superseded.
- Layout all components before routing. Use tscircuit's native **`bus_lanes`**
  solver as a phased DDR bootstrap, preserving its participation while repairing
  routes manually. Do not replace it with an entirely manual or unrelated route.
- Fit the **original G350 shell**, not a new case with similar outside dimensions.
- Latest requested publication policy: push this full cloud handoff now. For
  later board work, push only meaningful verified breakthroughs, as requested
  earlier; repeated failed routing runs need not be published individually.

## Authoritative current board

`index.circuit.tsx` exports
`experiments/am3352-g350-byte0-complete-bus.circuit.tsx`.

Frozen default circuit files are
`dist/g350-current-index-byte0-handoff-fixed/compiled.circuit.json` and
`dist/index/circuit.json`, both SHA-256:

`01815364357e0354de1089af4253e2ce2dc926f822b5f173b7ccb133e459f555`

This board has **280 explicitly placed components**, **112 trace pieces**,
**119 standard full-depth through-vias**, two continuous filled inner reference
planes and four copper layers. It is a **provisional 76 × 118 × 1.6 mm shaped
outline**, with a 22 mm-wide lower speaker tongue extending 19 mm. Shared
geometry is `mechanical/g350-provisional-outline.json`; do not invent screw-hole
coordinates or shrink the outline to make a route pass.

**11/49 DDR signals are connected:** D0–D7, DQM0, DQS0 and DQSn0. Byte0 combines
native `bus_lanes` carriers and manual repairs. All eleven byte0 members remain
in the source bus. Complete-byte planar skew is **0.2077921286 mm** against
**0.635 mm**; DQS0-pair skew is effectively zero against **0.127 mm**.
All 101 CPU/RAM ground/DDR supply terminals have checked plane connections
through 97 retained power vias. The default has **818 open-port** and **108
missing-trace** native errors, so a full build intentionally exits nonzero.

Matching default evidence is
`checks/integrated/g350-byte0-complete-bus/check-summary.json`:
numeric-pad mapping, scoped connectivity, Gerber shorts and physical DRC pass.
There are **403 presentation warnings** and **499 reported/capped host opens**.
Do not interpret the open count as the complete number of unfinished nets.
Complete bypass loops, power converter loops, timing/impedance and peripherals
remain unfinished. No current fabrication exporter should bypass the false
readiness flag.

The repository also contains historical 212-component, 100 × 124 mm routing
fixtures, including DDR42. Their higher completed-signal counts cannot be
merged into this board without fresh routing and qualification. RAM orientation,
placements, package exits and reference geometry differ between experiments.

## Latest byte1 experiments and exact continuation point

The default remains the checked byte0 circuit above. Do not promote the following
experiments merely because their partial copper passes a scoped check.

1. `experiments/am3352-g350-byte1-escapes-replay.circuit.tsx` replays 22 manual
   CPU/RAM pad-to-via escapes using `autorouter="fanout"` and explicit caches.
   The `requireSavedEscapes` callback prevents an implicit generic completion
   stage from taking over after the fanouts. A later native `bus_lanes` phase
   remains declared. Cache:
   `lib/am3352/placement/ddr-byte1-manual-escapes.json`; byte0-access retunes:
   `ddr-byte0-byte1-access-paths.json`. Only D6 and DQM0 wire geometry changes;
   their planar lengths and all old vias/power copper are preserved.

2. Actual editable-source replay completed in
   `dist/g350-byte1-explicit-fanout-replay`, phase
   `G350_BYTE1_MANUAL_ESCAPES`, with fresh output and unchanged frozen definitions.
   Compiled SHA:
   `0aead32d237ba63631d9c6cb8080d5f1c89cf98c5ec229a45bbe98d422e6bae7`.
   It has 280 parts, 134 trace pieces, 141 full-depth vias, 807 open-port errors,
   97 missing traces and two byte1 timing errors. It adds **zero complete DDR
   channels**, retaining 11/49. Independent evidence is in
   `checks/integrated/g350-byte1-package-escapes/`: all 22 numeric package pads
   reach their intended vias, both reference planes and 101 package-power
   terminals pass, Gerber shorts are zero, physical DRC has zero errors, and
   22 dangling escape-via warnings accompany 403 presentation warnings.
   **The new aggregate summary is not yet qualified:**
   `summarize-g350-byte1-bootstrap.mjs` rejects five generated KiCad `ignore`
   severities (`footprint_filters_mismatch`, `footprint_type_mismatch`,
   `missing_courtyard`, `track_not_centered_on_via`,
   `tuning_profile_track_geometries`). Audit/restore the rules and rerun the
   affected board/hash-bound evidence before claiming this aggregate pass.
   Do not relax the assertion. Existing executed-checker snapshots are frozen.

3. `experiments/am3352-g350-byte1-strobe-seed.circuit.tsx` adds two complete,
   manually seeded strobe routes and retains 18 other partial escapes. Caches:
   `ddr-byte1-strobe-seeded-paths.json` and
   `ddr-byte0-byte1-strobe-access-paths.json`. Actual source replay completed in
   `dist/g350-byte1-strobe-seeded-source`, phase
   `G350_BYTE1_SEEDED_STROBES`, fresh/unchanged, SHA:
   `422b953063e3e6b92502f0a8376f092d397923ca405eed978ba40c664509734a`.
   It has 132 trace pieces and 141 vias; source connectivity reports **13/49**
   with DQS1/DQSn1 planar pair skew **0.0774970265 mm** (passes 0.127 mm).
   Whole byte1 remains unmatched. Source has 807 open-port, 97 missing-trace and
   one full-byte skew error. Independent checks in
   `checks/integrated/g350-byte1-seeded-strobes/` are **unfinished**: Gerber shorts,
   adapter and stencil normalization ran, but local footprint preparation,
   plane/pad continuity, final DRC, stencil verification and bound aggregate
   summary are still required. Therefore two new channels are not yet promoted
   to the default or counted as a fully independently qualified breakthrough.

4. Native prepared-carrier searches are under
   `dist/g350-byte1-strobe-seed-*`, generated by
   `scripts/prepare-g350-byte1-strobe-seed.mjs`. Short matched strobes in `02`
   let the native bottom solver find two partial D9/D8 detours, but their total
   lengths (~25.83/25.72 mm) exceed the short-seed matching interval. `03-top`
   also exhausted its budget and found a much longer (~37.5 mm) partial route.
   Neither is a complete byte. Do not rerun identical searches indefinitely.

5. Long seeded experiment `05-native-two`, geometry
   `ddr-byte1-strobe-long-seeded-clearance-geometry.json`, preserves four fixed
   members and runs native `BusLanesSolver` for seven remaining carriers. Its
   preflight geometry has zero native physical errors and four fixed members
   have 0.4109 mm planar skew. The terminal solver result is **FAILED**,
   **50,000 iterations**, `search_budget_exhausted`, **no complete output** after
   117.1 seconds. Preserve this failure. Long matching candidates still require
   absolute TI data-length/package-delay qualification; matching alone cannot
   approve them. Root `04` is rejected for a strobe-wire/power-via collision.

`lib/am3352/placement/G350Byte1EscapedBusLanes.ts` still expects eleven connections
and 141 vias; it has not been qualified on the seeded-strobe phase. Adapt native
remaining-connection/end-point handling explicitly, including correctly named
source traces, fixed-route lengths and physical via access. Then replay the
actual selected native phase before relying on prepared solver output.

## Frozen runner and check behavior

- `scripts/run-g350-ddr-phase.mjs` freezes the import graph and helper versions,
  runs a selected tsci phase with a hard external deadline, and requires fresh
  output, phase completion and unchanged definitions. Use a **new directory**.
- `scripts/run-g350-native-prepared.mjs` and
  `scripts/g350-native-routing-worker.mjs` freeze prepared native inputs and
  retain terminal results/partial-carrier snapshots. Failed/partial output is
  not evidence of a fully connected bus.
- `scripts/check-am3352-routing.mjs` checks full mapping and planar timing;
  nonzero status is expected while required signals remain open. Do not remove
  the open-signal checks to produce a green full-build report.
- `scripts/check-g350-kicad-byte1-escapes.py --seeded-strobes` accepts exactly two
  seeded byte1 strobe channels; default mode expects zero complete byte1 channels.
- `scripts/check-g350-ddr-plane-connectivity.py --byte1-escapes` expects 141
  full-depth vias and 44 signal-via reference connections.
- `scripts/summarize-g350-byte1-bootstrap.mjs <source-output-root> <check-root>
  escapes|strobes` binds source, pads, old geometry, all 280 placements, final
  board, reports and executed helpers. Run only after every prerequisite is
  rechecked. Historical helper copies must remain unchanged.
- Run the project `node_modules/.bin/tsci`; an older global executable previously
  omitted microSD keepouts. Use absolute output paths for `tsci export`.
- KiCad 10 uses `pcb drc --save-board`, not `--save`. Several Python validators
  initialize wx; Linux requires `xvfb-run` and distro Python with `pcbnew`.

## Mechanical state

Published case dimensions are **81 × 128 × 22 mm outside**, not an internal PCB
envelope. Online research did not establish measured PCB outline, post positions,
shell ribs, button centers or port cutouts. Current placement/copper is preserved
and no unverified mounting holes are introduced.

`checks/mechanical/g350-current-envelope-check.json` reports **279/280 component
courtyards within the actual provisional polygon**. J_USB projects ~0.651 mm
beyond its top edge. Assembly XY envelope is **76 × 118.6509988 mm**. Nominal
outside-case setbacks do not prove internal or assembled clearance.

Print `output/pdf/g350-shell-registration-template.pdf` at **100%**, with its
50 mm calibration bar. It includes all eleven button centers, connector/switch
coordinates and all 280 component courtyards on both assembly sides. Bottom
coordinates are viewed through the board, not mirrored for assembly. Exact shell
registration, height clearance and mounting positions remain a fabrication gate.

## Cloud tools, dependencies and restoration

Attach the main GitHub repo **Abse2001/g350-linux-handheld** at the handoff branch
recorded in `cloud/transfer-status.json`. Its complete authored source includes
all individual imported components, routing caches, software stubs, scripts,
mechanical drawings, reports and historical experiments. The tscircuit registry
release is older and should not be used instead of this fresh GitHub checkout.

Ignored `dist`, `.tscircuit`, reference files and ignored check evidence are stored
in `cloud/artifacts/board-evidence.tar.gz.part-*`. Each part is under GitHub's
100 MiB single-file limit; the manifest contains every original relative path,
size and SHA-256. Restore in place with:

```sh
python3 scripts/restore-cloud-evidence.py
bash scripts/setup-cloud.sh
source cloud/env.sh
```

Restoration verifies part/member hashes and refuses to replace an edited existing
evidence file. Disposable `tmp` scripts, installed `node_modules`, Git internals
and credentials are excluded. Npm packages and upstream source repositories are
recorded in `cloud/repositories.json`; the lockfiles reproduce the bundled native
solvers. Read upstream code in additional repos without silently substituting
unbuilt main-branch code into the pinned board runtime.

Verified package pins are tscircuit **0.0.2744**, core **0.0.2088**, props
**0.0.687**, checks **0.0.239**, capacity-autorouter **0.0.958**, CLI **0.1.2237**,
Circuit JSON **0.0.515**, React **19.3.0**, TypeScript **5.9.3**. Local runtime was
Node **25.6.1**, Bun **1.3.14**, KiCad **10.0.5**. The verified cloud runtime uses
the same Node/Bun pins and official KiCad **10.0.6** tools on Debian 13. Read
`cloud/LINUX_VALIDATION.md` for tested setup, Docker-image restoration and API checks.

`npm ci --legacy-peer-deps --ignore-scripts` avoids unrelated lifecycle execution;
the reviewed checks patch is then applied explicitly. It corrects the declared
via-to-pad rule lookup and coincident-edge distance handling **without disabling
checks**. Patched checks SHA-256 must be:
`50b27442a32befe1fe3f4e83fa082c6efe3e00e6af71e64869778bb68b479805`.
Do not alter that patch without reviewing the new upstream checker and evidence.

Allow package-manager/GitHub hosts and the additional **jscdn.tscircuit.com**,
**nodejs.org** and **registry.tscircuit.com** where needed. Component updates and
documentation research also need **docs.tscircuit.com**, **tscircuit.com**,
**ti.com**, **micron.com**, **jlcpcb.com**, **lcsc.com**, **buydisplay.com** and their
actual documented asset hosts. No account secrets are stored in this repository.
Do not assume local browser sign-ins, processes or Mac installations transfer.

Official setup guidance: [Codex cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environments),
[KiCad Ubuntu packages](https://www.kicad.org/download/details/ubuntu/).

## Next work and release gates

First verify restoration/package/core identities, run typecheck, current shorts
and mechanical checks. Complete the byte1 experiment's pending independent
qualification and rule-severity audit. Then repair/restructure the native byte1
carrier phase with full physical obstacles and retained byte0/power copper.
Continue command/control/clock routing only from an explicitly checked combined
state; failed prepared searches do not change the authoritative default.

All 49 DDR signals, nominal/package/via timing, matching, class spacing, impedance,
termination and return paths must pass. Finish converter/PMIC switching loops,
bypass supply/return loops, battery protection/NTC/current/thermal checks, microSD,
USB-C charge/data roles and recovery, display/backlight, audio and eleven controls.
Software files in `software/` are bring-up stubs rather than a tested Linux image.
AM3352 DDR configuration, bootloader, device tree/pinmux, panel/audio/input drivers
and a verified shared-port provisioning flow still need implementation and testing.

Finally verify measured original-shell fit, supplier pinouts/footprints/stock,
zero unresolved shorts/physical/connectivity errors on the complete editable board,
and matching integrated Gerber/drill/BOM/top-bottom placement/release hashes.
Replace legacy carrier fabrication contracts with checks for the completed AM3352
handheld. Only then mark fabrication readiness true and prepare a prototype order.

## Latest rotated-RAM DDR candidate

The user requested RAM rotated 90 degrees and four-layer routing with inner
layer priority. The new source-verified candidate connects all 49 DDR signals
with zero native physical errors and zero Gerber shorts. Read
`cloud/DDR49_ROTATED_RAM_2026-10-06.md` and its evidence before continuing.
Six native length/skew failures, power/reference copper and peripheral routing
remain unfinished. The default 11/49 layout is unchanged; preserve its evidence,
but continue the user-requested rotated candidate rather than mixing placements.
`fabricationReady` stays false.

## Rotated-RAM timing repair (2026-10-06)

Continue `experiments/am3352-g350-ram90-three-pairs-safe-replay.circuit.tsx`
from `cloud/DDR_TIMING_REPAIR_2026-10-06.md`. Its fresh editable source retains
49/49 DDR connectivity and all 280 component placements. All three differential
pairs pass; native skew failures decreased from six to three whole-bus failures.
Native physical checks, all-layer shorts, manufacturing clearance and independent
KiCad connectivity pass. The default and the prior 49/49 evidence remain frozen.
Power/reference copper, peripheral routing, electrical timing and shell fit remain
unfinished. `fabricationReady` is false. The earlier three-pairs entry without
`safe` was rejected for manufacturing clearance and must not be promoted.

## DDR native skew cleared (2026-10-06)

The latest checked continuation is
`experiments/am3352-g350-ram90-zero-skew-replay.circuit.tsx`.
Read `cloud/DDR_ZERO_SKEW_2026-10-06.md` and
`checks/integrated/g350-ram90-zero-skew/summary.json`.
Fresh editable-source replay has 49/49 DDR connections, zero native length/skew
violations, zero physical/manufacturing errors and zero all-layer shorts.
Independent KiCad verifies all 49 connections with no ignored checks/exclusions.
All 280 placements, RAM at 90 degrees and four layers are retained; about 60% of
planar DDR copper uses Inner1/Inner2. Native pair bootstrap and checked manual
repairs are archived. The old default and all older evidence remain frozen.
This clears the native skew milestone, not full electrical timing or fabrication:
power/reference copper, nominal/package/via timing, impedance/return paths,
peripherals, Linux and measured original-shell fit remain unqualified.
`fabricationReady` stays false. Continue this newest checked entry; older timing
sections describe preserved historical checkpoints.

## Latest connected inner-layer timing checkpoint (2026-10-10 UTC)

Continue `experiments/am3352-g350-full-board-inner-timing-ground-preserved-replay.circuit.tsx`.
Read `cloud/DDR_INNER_TIMING_CONNECTED_2026-10-10.md` and
`checks/integrated/g350-inner-ground-timing-progress/summary.json`. Fresh source 209,
independent fresh-fill KiCad 210 and Gerber 211 retain 217/217 connections, all 49 DDR
signals, 298 ground ports and 1,032 required numeric ports. All 280 placements, RAM90,
four layers and 824 full-depth vias are preserved. DRC errors/warnings/opens/dangling
copper and shorts are zero. Source/fresh-filled native checks pass except three
bus-skew failures: 19.293662 / 25.185093 / 24.480252 mm versus 0.635 mm. Pairs pass.
The build exits 1 for matching; the qualification wrapper exits 0. The b70590b
checkpoint and frozen evidence remain. Distributed growth trials that broke ground
are rejected; 215 native ground errors reflected the whole-net assertion, while
KiCad identified three stranded pads. Checked outer spans were restored while
retaining inner-layer tuning. Further recovery 212/217/220 is unqualified and must
not replace the checked entry. Preserve native whole-net assertions and runtime pins;
fresh numeric/ground/Gerber checks remain mandatory. Electrical clock/stackup/timing,
PDN, Linux and measured shell fit remain unfinished. Keep fabricationReady false.
