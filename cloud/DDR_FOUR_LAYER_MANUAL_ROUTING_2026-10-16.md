Current partial Source checkpoint: **actual223 / Source228, 47/49 DDR paths**.
The two missing nets are D12/source26 and DQM0/source30. Actual223 passes all 47
route physical checks. Fresh225 validates all six critical conductors and all
five bus/pair/shared/coupling/exterior report APIs in both actual DQS1 views.
Source224/capture227/Core228 reproduce 47 connected and two pending numeric-pad
graphs, with all 35 fidelity controls passing and 227 real fullspan vias.

Fresh native230 completes 16 focused checks: physical10 and the other five
geometry checks return zero findings; three bus-skew failures remain unfiltered.
Auth231 authenticates all 227 via owners and reports zero foreign via-to-track
violations. The completed literal audit covers all 14 fresh BREP pours, 227 vias
and 937 routed wire segments across 47 owners: zero violations, minimum foreign
edge gap 0.11832052949719676 mm against 0.1016 mm. These checks do not establish
reference-plane continuity, TI compliance, electrical timing, CAD or fabrication
readiness. The accepted default board remains 32/49.

The separate evidence folder is `.cloud-tools/ddr-four-layer-post209-2026-10-16`.
Candidate223 SHA256 is
`ddaa4efd8d20f16cefca89b9166e834a956113194beed6f0f13903e346e36ea0`.
Preview: [four-layer Source228 snapshot](artifacts/g350-four-layer-partial47-source228-2026-10-16.png).
Yellow dashed connections identify the two missing nets.
CA204's length-tuning changes have not been combined with this 47-path model.
Source209 remains an independent 46-path timing fallback with its own immutable
archive and checks below. `all49Accepted=false`; `fabricationReady=false`.

The [portable Source228 archive](artifacts/g350-four-layer-partial47-source228-2026-10-16.tar.gz)
contains 196 regular files and 172 workspace restore targets. It is 10,505,776
bytes, SHA256 `4fff876a140edbd45cffdc445bd82d7b45a5abcedc630b8ea5633a4d1d9937f1`.
Its [manifest](artifacts/g350-four-layer-partial47-source228-2026-10-16.manifest.json)
requires the Source209 archive first. The [restoration validation](artifacts/g350-four-layer-source228-restoration-validation-2026-10-16.json)
records a fresh isolated extraction under umask077, exact hashes/sizes/modes and
normalized tar headers for all 196 members, a second extraction restoring zero
files, and successful verification of all 172 workspace targets. The frozen
post209 folder and both archive checkpoints remain immutable.

The later merged233 candidate has separate Core236/native237/auth238 results.
It is outside this archive and requires its own literal-pour audit; Source228's
pour result does not qualify that different geometry.

Independent46-path timing fallback: **CA204 / Source209,46/49 DDR paths**.
Source209 passes all35 fidelity controls; native213 has zero findings in
the original physical10 and the other five focused geometry checks, with
three bus-skew failures retained. Auth214 covers all226 real via owners.
The exact15-pour aggregate covers226 vias and7447 routed-wire segments
with zero foreign edge-margin violations at0.1016mm. Ten additional CA
ordinary nets reach the minimum window;13 of26 total CA nets are in it.
D12/source26, D7/source32 and D5/source43 remain pending. Ordinary matching,
TI/reference/electrical/CAD qualification and fabrication readiness remain
unfinished. This is a partial working candidate, not the default board.

Current candidate SHA256:
`454b1b02ca5fa4a8bdce8e4e752097090cc8a28d449360c075be65bc6d1be86f`.
Preview: [four-layer Source209 snapshot](artifacts/g350-four-layer-partial46-source209-2026-10-16.png).
All historical checkpoints below remain saved.

The [portable Source209 archive](artifacts/g350-four-layer-partial46-source209-2026-10-16.tar.gz)
contains597 regular files with exact indexed modes. It is31,488,547 bytes,
SHA256 `c4cfe7d590a67368586ef49a6178dbc6b6519576a654a690d8f5ef91be0b9178`.
Its [manifest](artifacts/g350-four-layer-partial46-source209-2026-10-16.manifest.json)
covers the frozen routing workspace and the whole Source33B factory folder.
Later routing experiments are outside this immutable checkpoint.
The [restoration validation](artifacts/g350-four-layer-source209-restoration-validation-2026-10-16.json)
records a successful isolated restore of all597 members, exact hashes/modes,
an idempotent second restore and verification of all404 workspace targets.

Restore the older Source32 archive before this archive. The existing cloud setup,
pinned solver dependencies and predecessor Source29 restore chain must already
be in place; see the [Source32 checkpoint instructions](TI_DDR_SOURCE32_LINUX_CHECKPOINT_2026-10-15.md).
Run from the board repository with a restrictive umask so the original factory
sources retain0600. The dedicated Source32 restorer maps its historical
`workspace/` and `temporary/` members to their correct roots:

```bash
cd /workspace/g350-linux-handheld
umask 077
source cloud/env.sh

python3 scripts/restore-g350-source32-through71-source-data.py \
  --manifest cloud/artifacts/g350-ti-ddr-source32-through-cad71-source-data-2026-10-15.manifest.json \
  --manifest-sha256 88355cb25a68816e1cd6e2133e66b52feff010387cfc1f1e56af8ecc1b964d68 \
  --archive cloud/artifacts/g350-ti-ddr-source32-through-cad71-source-data-2026-10-15.tar.gz \
  --base-manifest cloud/artifacts/g350-ti-ddr-source23-core-native-cli-cad-public-failure-2026-10-14.manifest.json \
  --source24-api-manifest cloud/artifacts/g350-ti-ddr-source24-through-api-source-data-2026-10-15.manifest.json \
  --source24-cli45-manifest cloud/artifacts/g350-ti-ddr-source24-cli-cad-delta-source-data-2026-10-15.manifest.json \
  --source24-through47-manifest cloud/artifacts/g350-ti-ddr-source24-cad46-cad47-small-source-data-2026-10-15.manifest.json \
  --source26-through52-manifest cloud/artifacts/g350-ti-ddr-source26-through-cad52-source-data-2026-10-15.manifest.json \
  --source29-through60-manifest cloud/artifacts/g350-ti-ddr-source29-through-cad60-source-data-2026-10-15.manifest.json \
  --restore

python3 scripts/restore-g350-routing-evidence.py \
  cloud/artifacts/g350-four-layer-partial46-source209-2026-10-16.manifest.json

python3 scripts/restore-g350-four-layer-routing-workspace.py --restore
python3 scripts/restore-g350-four-layer-routing-workspace.py
```

The new archive restorer applies and verifies each optional manifest `mode`,
including0600/0644 independently of umask. It refuses to replace differing local
content or modes. For older manifests whose archive path is only a basename,
it first checks the project path and falls back to the manifest's directory only
when that project path is missing. Legacy315-member archive verification and
isolated changed-content/changed-mode preservation fixtures pass. Neither
restorer runs a routing SDK or promotes the default board.

The complete restore order is Source32 (including its predecessors), Source209,
then Source228. After the Source32 and Source209 commands above, continue:

```bash
cd /workspace/g350-linux-handheld
umask 077
source cloud/env.sh

python3 scripts/restore-g350-routing-evidence.py \
  cloud/artifacts/g350-four-layer-partial47-source228-2026-10-16.manifest.json

python3 scripts/restore-g350-four-layer-routing-workspace.py \
  --saved-directory .cloud-tools/ddr-four-layer-post209-2026-10-16 --restore
python3 scripts/restore-g350-four-layer-routing-workspace.py \
  --saved-directory .cloud-tools/ddr-four-layer-post209-2026-10-16
```

The archive helper restores indexed file modes independently of umask and
preserves differing local files or modes by refusing replacement. The workspace
helper reconstructs only missing recorded inputs and verifies all existing ones.
This restores the partial diagnostic layout and evidence without running a
routing SDK, changing the default board, or accepting the two missing routes.

Historical verified partial checkpoint: **actual197,46/49 DDR paths**.
The three-owner body-via repair preserves A6, the other43 route bodies, all263
fixed reference/fanout paths and the original49 rules. All46 mixed physical
checks, joined numeric-pad geometry and all critical C31/bus/pair/shared/
coupling/exterior reports pass in both DQS1 views. Missing: D12/source26,
D7/source32 and D5/source43. This is a partial candidate, not the default board.

Saved candidate: `.cloud-tools/ddr-four-layer-manual-2026-10-16/VIAREPAIR197_byte0-result.candidate.json`.
SHA256: `589f5b00ea4e0bd4f3141c7586d465a59eb50f066cb9fbc283528025721a9fd6`.
Four-layer image: `PARTIAL197_FORTY_SIX_FOUR_LAYER_SNAPSHOT.png` in that directory;
yellow dashed connections mark the three missing nets.

Fresh editable Source198/capture199/Core200 reproduces46 paths and passes all35
fidelity controls: all280 parts,1165 lands,165 reference traces and129 reference
vias are held; all226 fullspan vias and actual layer aliases are real. Exactly
46 of the original49 numeric-pad graphs connect. Raw Source200 is saved as
`g350-partial46-core200-raw.json` with SHA256
`6e2e250803c2bc5d255877fcec14f13627381b357b27407da61e15945ab64bf5`.

Fresh native201 completes the focused16 checks. The original physical10 all
return zero findings, including different-net via spacing: the five old185
failures are repaired against the unchanged0.15mm rule. Contiguity, dangling,
routing constraints, inline via counts and copper-pour shorts also return zero.
Three bus-skew failures remain: byte0 6.619853849mm, byte1 2.318677724mm and CA
17.438700934mm, each above0.635mm. These are planar observations; ordinary
matching and electrical delay are unfinished. Other16 original native checks
were not retested; their full185 findings, including width/readiness warnings,
remain retained as historical evidence without exclusion or inherited pass.

Fresh202 independently authenticates all226 via/alias owners and finds zero
foreign via-to-track violations at0.1016mm. Pure203 tests the regenerated14
literal BREP pours against all226 vias and41 changed-owner wire segments:
zero violations/unknowns/unsupported objects; minimum foreign edge gap is
0.11832052949719676mm. Pure204 expands this to all46 routed owners and928 real
wire segments, again with zero violations. These tests prove only their stated
physical scopes; they do not establish continuous reference planes or return
paths, controlled impedance, TI compliance, electrical timing, CAD or fabrication
readiness. `all49Accepted=false`; `fabricationReady=false`.

The separate SDK204 CA matching branch retains46 paths, passes all46 mixed
physical/critical checks and makes34 tuning commits in62 calls. Ten additional
ordinary CA owners reach20.950002mm: eleven ordinary owners including A6 and
both clocks,13 of26 CA owners, are now in the window. CA skew improves to
15.8185999mm and remains unmatched.
That branch is saved separately. Source207/capture208/Core209 now reproduce
its46 paths and pass all35 fidelity controls, retaining the three explicit
pending nets. Native213 now completes16 focused checks: physical10 and
contiguity/dangling/constraints/via counts/pour shorts have zero findings;
the three bus-skew failures remain. Fresh214 authenticates all226 vias
and finds zero foreign via-to-track violations. The pinned215+216 aggregate
covers every one of the15 actual fresh BREP pours against all226 vias and
7447 real routed-owner wire segments, with zero foreign-margin violations
at0.1016mm. Bounded215partial77 is excluded; completed216 supplies that pour.
It is the current verified partial working baseline; primary197/Source200 is
retained as an earlier checkpoint, and the default board is unchanged. SDK203's proposed CPU dogbones
failed physical preflight and were not adopted. Earlier sections below are history.

The separate205 RAM-cycle branch passes all45 mixed physical checks, its three
atomic RAM dogbones and all critical reports in both DQS1 views. It releases D1
pending refill and therefore has45 paths, not46. It is a new critical-profile
experiment awaiting its own Source/Core/native/pour checks; primary197 is held.


SDK206 tested the two CPU southeast approaches and manual arc changes. Both
the retained and final46-path scenes pass their mixed physical checks, but no
missing net was added. It remains a separate no-improvement experiment; the
three pending owners and verified primary197/Source200 are unchanged.

SDK210 refills D1/source31 in the205 RAM-cycle profile and restores46 paths,
with all45 prior paths preserved, all46 physical checks and critical reports in
both DQS1 views passing. D1 is11.4536776mm; the same three owners remain
pending. This separate clock/fanout-profile branch has no fresh Source/Core/
native/pour validation and does not replace primary197.

SDK211 retains46 physically checked paths and adds none. Scope212 was
stopped by memory admission before SDK spawn; its closed guard receipt is
saved as an admission event, not an execution. A reserve RAM+0.5mm plan
clears its tested fixed geometry but tightens placement-based TI caps by
the same amount as the path-floor improvement; it supplies no extra timing
budget and has not been adopted.

# Four-layer DDR routing continuation, 2026-10-16

Routing remains in progress. `fabricationReady=false`.

The accepted Source32 checkpoint still has 32/49 DDR channels. Source33B
reproduces 33/49 in fresh Core/native checks but has further qualification
pending. Neither checkpoint has been replaced by the experiments below.

The current working placement is CPU `(0,20)`, RAM `(1.2,7.4)`, RAM rotation
270 degrees. DDR may use Top, Inner1, Inner2 and Bottom, as authorized by the
user. Reference-plane continuity, impedance and return-current qualification
remain required before electrical timing can pass.

The new critical-pair experiment jointly validates all six DQS0, DQS1 and clock
conductors against one four-layer fanout model. Actual C31 validation and all
three bus, pair, shared-spacing, coupling and exterior-spacing reports pass.
The exact result is preserved in
`.cloud-tools/ddr-four-layer-manual-2026-10-16/CRITICAL127_COMMON6_PASS.json`
(SHA256 `42f4a2a64674c1b22574931e914161b589aea2550df38075aa9c8f20d396e128`).
This is a routing-model result; editable-source, native and CAD checks have
not run on this candidate. Ordinary signal bodies are released in this model.

The fixed first-byte candidate has all 11 paths, but D2/source3 and D3/source42
still need length tuning. Its saved geometry is `BYTE0_110_RECOVERED.json` in
the same directory. Do not combine independent cohort passes without checking
their copper together. The common-scene test identified conflicts between that
candidate and the second strobe pair.

The second byte must have coordinated fanouts. The fresh DQS1 RAM barrels at
`(6,5.4)` and `(6.8,5.4)` occupy the old D8/source1 and D14/source41 escape
sites. The old coordinated DQS1 sites are `(5.2,6.2)` and `(6,6.2)`. A partial
native-Top fallback found only five of the nine ordinary byte1 carriers.
Actual133 restored the coordinated family. A manual0.2mm drag of four D15 vertices preserved its full length and cleared the new CPU barrels. All15 paths (full byte1 plus DQS0 and CK) pass together in that routing model, including both authored DQS1 coupling views. Its exact saved checkpoint is `COMMON133_FIFTEEN_PASS.json`.

An independent old-fanout CA experiment saved 23/24 ordinary CA paths. CKE can
be routed after releasing A10 or A12, but the released lane then needs rerouting.
These seeds are diagnostic alternatives and are not locked into the common
data-byte scene.

Keep the actual 0.635 mm cohort and 0.127 mm pair limits, 0.1016 mm traces,
0.4572/0.254 mm fullspan vias and every physical assertion. Placement-based TI
limits for the present numeric pads are 11.8 mm for byte0, 14.2 mm for byte1,
and 19.75–22.29 mm for CA. The working CA intersection keeps the stricter
20.95 mm minimum. The repaired clock further limits other CA signals to
21.847198714172402 mm when that clock is held. Frozen evidence, hardware
sources, runtime pins and the reviewed native checks patch remain unchanged.

The shared four-layer routing search releases ordinary byte1 timing meanders
while holding the six checked differential conductors. Actual138 found31
ordinary paths. Fine-grid actual141 added DQM0/source30 and D15/source13,
for **39/49 paths in one candidate**. This remains unmatched and has not had
editable Source/native/CAD replay. The candidate is
`JOINT141_PARTIAL39.json`; the layer snapshot is
`PARTIAL141_THIRTY_NINE_FOUR_LAYER_SNAPSHOT.png`. The remaining owners are
1,5,26,29,32,37,42,43,46,48. Do not report39 as the accepted board count.

An isolated RAM/support-group y−1.2mm planning experiment preserves all
hardware identities and grows the copper aisle from0.8164 to2.0164mm. Its
critical6 pass after a paired0.2mm DQS1 drag, but the global search reached
only32/49 paths. It is not a fresh Core placement and is not preferred over
the current39-path candidate. Recomputed TI limits are intersected with all
historical Source assertions rather than relaxed.

A diagnostic releasing all ordinary bodies found10 of the original12
missing requests under the same limits. Holding those10 first then refilling
the others reached only24/49. This establishes routing-order conflicts,
not physical impossibility. Next trials use controlled ordinary ripups and
real layer changes within an individual carrier. C31's ordinary carrier
validator is single-layer; a mixed carrier needs explicit per-layer copper
and all-layer barrel checks plus genuine editable Source/native replay.
No result may claim a whole mixed-carrier C31 pass by ignoring its vias.

TI's usual four-layer arrangement reserves the inner layers as continuous
references. The authorized all-four-signal-layer experiment additionally
needs a demonstrated continuous reference/return solution before it can be
called TI compliant or electrically ready.

The former primary candidate is actual157, **44/49 nominal paths**, in
`SOURCE21_157_REPAIRED44.json`. Actual149 added CKE48 with two new through
vias; actual151 recovered D8/source1 and flipped D3/source42's RAM approach.
Actual156 used real numeric Top pads instead of forcing unused dogbone sites,
adding source37 and source5. Five remain: source26,29,32,43,46.

Independent fullspan/per-planar-run checks now pass43 of those44 paths.
Source8's true numeric-pad retrace was removed, and Source21's two acute
Top joins were reauthored at both true numeric pads. Source34 still returns
too close to its own CPU via; a smooth local clock-bank repair is pending.
C31's ordinary whole-carrier API remains single-layer; the mixed result uses
real planar validators plus explicit fullspan land/drill/transition/self checks.
Actual155 positive and negative geometry controls pass: correct incident
contacts pass, the genuine old Source8/34 defects reject, and repaired/new
paths pass. This is not fresh editable Source/native/KiCad qualification.

Ordinary matching has deliberately not run yet. Current partial planar skews
are6.619853849mm (byte0,9/11),1.918686664mm (byte1,9/11), and17.462243252mm
(command/clock,25/26). These are unfinished routing-candidate measurements,
not electrical timing passes. The remaining target is0.635mm per cohort and
0.127mm per differential pair, plus the preserved absolute limits and later
reference/impedance/return/delay qualification. `fabricationReady=false`.

`PROGRESS.json` in the saved directory records current experiments and hashes.
Source scripts and exact inputs/results are saved there for continuation.
Require all 49 numeric-pad connections in one model, complete editable-source
replay, native checks, KiCad checks, Gerbers and reference/electrical checks
before promoting a new board checkpoint.


Actual160 checks all44 joined numeric-pad graphs with native geometry and real
per-planar-run C31/self checks; all44 pass. This does not override the separate
clock34 own-via return defect. Actual158 sparse3/4-new-via and actual162 true
Top/Top pre-release searches did not add a path.

Actual163 found four genuinely clear local clock34 curve repairs. They shorten
that conductor by0.023542–0.024959mm and therefore exceed the original0.127mm
clock-pair skew. Actual165 tested actual Bus Lanes refinement and smooth tuning
on all four repairs; none restored matching. These remain diagnostic shapes,
not accepted replacements. The next clock trial shortens the longer conductor.

Actual164 restores the previously matched complete second byte. All11 restored
paths and all22 approaches pass independent physical checks, and both authored
DQS1 coupling views still pass. Exact collisions require releasing seven other
ordinary bodies, leaving39 paths. This is an alternate routing seed rather than
an improvement over the primary44. All frozen evidence remains unchanged.
The current44-layer snapshot is `PARTIAL157_FORTY_FOUR_FOUR_LAYER_SNAPSHOT.png`.


The newest primary candidate is **actual169:44/49 paths**, saved as
`CLOCK169_byte0-result.candidate.json`. It shortens the genuine CPU-side clock33
arc and its nonshared RAM approach while retaining the independently clear
clock34 curve repair. All44 carrier graphs pass the independent physical
checks in one current scene. Clock pair skew is **0.126999500mm**, with total
planar lengths21.315656196mm and21.188656696mm. Clock C31 validation and shared,
coupling, exterior and joined-native-geometry checks pass. Numeric pads,
fullspan holes, other42 bodies, all reference material and physical limits
remain exact. This is still a routing-model result, without fresh editable
Source/Core, board-native, KiCad or electrical acceptance. Five remain missing:
D12/source26, D13/source29, D7/source32, D5/source43 and A6/source46.

The working partial model includes signal carriers on all four copper layers;
it is not the documented TI arrangement of outer signal layers and inner
reference planes. No continuous-reference or impedance pass is implied.
A separate named-stackup geometric diagnostic is saved as
`CURRENT157_PARTIAL_CENTERLINE_DIAGNOSTIC.json`; it counts actual active vertical
travel and explicitly does not calculate electrical delay or qualify timing.

Once the archives above are restored, the saved routing workspace can be checked
without invoking an SDK:

```bash
source cloud/env.sh
python3 scripts/restore-g350-four-layer-routing-workspace.py
```

Add `--restore` to reconstruct missing hashed `/tmp` inputs, tested Source and
helpers. The tested command refuses differing existing files, preserves frozen
evidence and points the copied solver Source at the pinned solver dependencies.
It performs no routing and does not promote any board candidate.


Actual171 combines the three checked CPU dogbone moves with actual169's repaired
clock in one45-path scene. All45 physical/own-terminal and numeric joined-geometry
checks pass. All three pair groups pass C31, bus/pair length, shared spacing,
coupling and exterior checks in both authored DQS1 views. Actual172's RAM26
SW dogbone passes all-layer/physical preflight and preserves45 but adds no route.
Actual173 widens A6's search to the left and retains45; three cases reach their
2,000,000 expansion bounds and a fourth hits the declared2,000,000-cell ROI cap.
These bounded searches do not establish global infeasibility.

The repaired-clock data constructor was executed successfully on actual171,
including exact working-branch/request inverse chains. Original49 rules remain
literal; its separate ordinary43 search profile intersects the held clock with
CA maximum21.823656696368694mm. The restoration helper verified156 saved files.
A separate isolated smoke test reconstructed a missing hashed file and verified
it again, without running a routing/CAD SDK or replacing existing differing files.

Actual180–182 correct and verify the separate partial editable replay chain.
The Source pcbPath frame is the CPU component origin `(0,20)`, not an individual
ball position. Every one of1165 physical lands is matched bijectively, including
the three lands per pin on `L_LCD_BL`. All45 routed original numeric graphs are
connected; D12, D7, D5 and A6 retain real local approaches/barrels but no body.
The raw Source182 and35-control result are saved under the ignored workspace.
Rejected Core179 used the wrong frame and must never be used as a board input.
The frozen full49 projector/overlay/checker are unchanged.

Actual183 tests a real1.2mm CPU26 south prefix on Inner1 and Inner2, then searches
all four layers. It preserves45 checked paths and adds none. Actual184 rotates
`C_DDR_CPU_16`90 degrees and moves it0.15mm left in a separate planning packet,
preserving its real part and reference vias and explicitly rerouting its two
0.2mm Bottom reference approaches. Its pads/body/drills, new CPU26NE dogbone,
reference approaches and all45 retained signals pass changed-scene physical
checks; it adds no signal. This placement plan is not applied to Source182.
Neither bounded search proves global infeasibility. Controlled coordinated
fanout and ordinary-route changes remain the next routing step.

The saved-workspace verifier now checks254 hash-indexed files without SDK
execution. The latest Source replay is partial; all49 acceptance, whole-board
matching, electrical timing, reference-plane/return paths and fabrication remain
false or unqualified. Actual185 runs fresh native diagnostics on Source182,
retaining all missing-connection and timing findings without exclusions.

Actual186 completes an independent authenticated manual-via foreign-track
clearance diagnostic on exact Source182. All225 physical vias have real,
unambiguous Source/PCB alias identities; zero foreign via-to-track clearance
violations are found at0.1016mm. Only declared SourceTrace ports/nets union
logical ownership. Copper proximity does not merge nets. This pass does not
qualify own-net reentry, via-to-via clearance, timing or the complete board.

Actual188 adds A6 without releasing or moving any of the existing45 bodies.
Its manual path uses Inner2 around the left side of the packages, one new
standard fullspan via at`(-6.4,3.02)`, then Inner1 to the real RAM approach.
Only the RAM barrel's active-layer metadata changes; all physical endpoints,
barrel positions, reference paths and hardware remain fixed. A legal left-side
pocket gives20.975373721398466mm whole planar length, within the actual held
clock intersection20.95–21.823656696368694mm. The new via also clears every
existing barrel by at least0.15mm. All46 per-run/barrel checks, actual numeric
joined geometry and all critical C31/bus/pair/shared/coupling/exterior reports
pass in both DQS1 views. The older five native via-to-via failures remain
explicit and require separate repairs. Actual189 projection and190 editable
capture pass; actual191 is the fresh Core replay, not inherited45 qualification.

Actual191 completes with all35 controls passing, exactly46 original DDR graphs
connected and three disconnected,226 standard fullspan physical vias and every
hardware placement/land/reference path held. Raw Source191 is saved separately
from the45-path Source182 used for native185/186 diagnostics.

Actual192 rejects all54 proposed local body-via slides: neighboring ordinary
copper would violate existing physical checks. No failed geometry is adopted.
Actual193 proves a real13.720646mm D12 Inner1-to-Bottom portal route, but its
five-body trade recovers only source30 and4, leaving43 total paths. It does not
replace the46-path candidate. Source30's short route remains explicitly unmatched.

The native rule audit distinguishes two original board settings:
`min_via_edge_to_pad_edge_clearance=0.1016mm` governs via-to-pad, while
`min_pad_edge_to_pad_edge_clearance=0.15mm` governs different-net via-to-via
lands. The native via-to-pad function explicitly prioritizes the former.
The optional0.15mm via-to-SMT supplement in trial193 was unnecessarily strict;
future trials use the actual0.1016mm via-to-pad rule and retain the required
0.15mm via-to-via check. No frozen board setting or native assertion is changed.

Actual187's separate D7 Bottom topology passes after releasing exactly three
ordinary bodies. D1/source31 refills, but source13 and30 remain missing, leaving
44 paths. It is not preferred over46. Below-minimum raw proposals are retained
for later matching and never mislabeled as accepted or matched routes.
