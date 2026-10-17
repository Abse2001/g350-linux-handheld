Latest editable checkpoint: **Source333 / Model328**, all49 actual CPU/RAM connections, both byte groups matched and18/26 command/clock minima. Read [the current Source333 report](DDR_CA18_EDITABLE_SOURCE_2026-10-17.md) first. It supersedes the older counts below and retains all four signal layers, original rules and runtime pins. Full timing and board qualification remain unfinished; fabricationReady=false.

Previous editable checkpoint: **actual299 / Source313, 49/49 DDR paths, both data bytes matched**. DDR signals use Top, Inner1, Inner2 and Bottom. The new Source24 Bottom tuning body uses 0.31 mm pitch and passes its scoped foreign-DDR 3W/4W spacing audit. All 35 fresh source controls and all 49 real CPU/RAM numeric-pad graphs pass. Hardware identities, fixed references, original rules and reviewed runtime pins are preserved.

Byte0 planar spread is **0.5771666935 mm** and Byte1 is **0.5769421603 mm**, both within 0.635 mm. All three pair skews pass 0.127 mm. Sixteen of 26 command/clock members reach the retained 20.95 mm minimum; ten remain short. Full command/clock spread still fails at **17.6628187566 mm**. Planar matching does not qualify electrical delay.

Native314 and Native316 complete all 32 original native checks on the same exact Source313 raw, controls and plan, with no exceptions. All **951 findings** remain: one command/clock skew finding, 70 source declarations lacking qualifying PCB traces, 718 port-connectivity findings and 162 thickness warnings. None of the thickness warnings directly names a current DDR signal declaration; unresolved warning identities are zero. Auth315 authenticates all 234 vias with zero foreign via-to-track violations or ownership failures. This is not a full-board pass.

On 2026-10-17, bounded audits325/326 and coverage327 complete the scoped foreign-copper margin audit of **all 19 literal Source313 pours**, all 234 authenticated vias and all 5623 DDR wire segments across the 49 owners. There are zero margin findings; minimum foreign copper-edge gap is **0.1183205295 mm** against the unchanged 0.1016 mm rule. The [complete coverage report](artifacts/g350-source313-all19-literal-pour-coverage-2026-10-17.json) reconstructs every required comparison roster. Audit325 reached its time limit after 16 completed pours; its unfinished pour93 contributed no comparisons. Audit326 separately completes pours93/98/99. The aggregate excludes the partial entry and retains the original reports. This does not qualify reference continuity, own-net reentry, PDN connectivity, pads, full-board routing, TI guidance, impedance, electrical delay or fabrication; later physical models do not inherit these results.

The [Source313 pour increment](artifacts/g350-source313-scoped-all19-pour-margin-2026-10-17.tar.gz), SHA256 `ecdbf50bc83fc7231e9969bacfe1d2d3d2dcba7eb2fc3aabd7155cca0efce040`, preserves both whole audit reports and the aggregate in 26 members, 2,167,315 compressed bytes. Its [manifest](artifacts/g350-source313-scoped-all19-pour-margin-2026-10-17.manifest.json) requires Source313 and its preceding lineage; it is a separate branch from Model318. The [restoration test](artifacts/g350-source313-all19-pour-restoration-validation-2026-10-17.json) verifies all normalized archive headers, all member hashes/sizes/modes, isolated extraction and all242 existing local/prerequisite targets before and after the original helper's zero-write restore. The saved directory is `.cloud-tools/ddr-source313-pour327-2026-10-17`; extract into task-owned `/tmp` before invoking the workspace helper.

| Source313 layer | DDR owners using layer | Nonzero DDR wire segments |
| --- | ---: | ---: |
| Top | 49 | 361 |
| Inner1 | 19 | 1644 |
| Inner2 | 21 | 2180 |
| Bottom | 17 | 1438 |

Owners can use several layers. This follows the user's all-four-signal-layer choice; TI's standard four-layer arrangement reserves the inner layers for continuous ground and DDR power. Continuous references, impedance, SI, full-board routing and shell fit remain open. `fabricationReady=false`; the board is not ready to order.

The [Source313 archive](artifacts/g350-four-layer-both-bytes-ca16-connected49-source313-2026-10-16.tar.gz) contains 44 files, is 2,372,540 bytes, and has SHA256 `6204924e3299369cfe4be5e54f983187879f34f983560cef5583b7704a7467ed`. Its [manifest](artifacts/g350-four-layer-both-bytes-ca16-connected49-source313-2026-10-16.manifest.json) requires Source209 → Source228 → Source248 → Source257 → Source272-v2 → Source289 → Model299 after the earlier Source32 lineage. The [restore validation](artifacts/g350-four-layer-source313-restoration-validation-2026-10-16.json) passes all 44 extracted file hashes/sizes/modes and verifies all 220 actual local/prerequisite targets and the existing dependency link before and after the helper's zero-write restore. The saved directory is `.cloud-tools/ddr-four-layer-source313-2026-10-16`. A task-owned `/tmp` extraction destination avoids duplicating evidence on the nearly full workspace filesystem; pass its full saved-directory path to the existing workspace helper.

Latest separate physical model **actual328** retains all 49 paths and both matched byte groups and reaches **18/26 command/clock minima**, with eight short. Source25 reaches **21.1965717360 mm** using two new genuine standard fullspan vias. Only four bodies change from Model318:20/23/25/36. Sources23/36 keep their exact whole lengths; Source20's clearance repair shortens it from 13.9921041221 to 12.1001310191 mm, still below minimum. Other45 bodies, matched37, foundation, placement, pin mapping and original rules remain literal. All four copper layers remain in use.

The [actual328 validation](artifacts/g350-four-layer-model328-root-validation-2026-10-17.json) binds the exact 53.62-second bounded run: all49 before/after physical checks, four complete numeric-pad joins, both critical five-API/C31 views, real-width reference/PDN/pad checks and both whole11-member byte checks pass. Every new Source25 wire and changed20/23/36 wire passes its exhaustive foreign-DDR 3W/4W audit. Fresh SDK self checks recompute every pair involving a new edge and confirm zero introduced nonlocal3W self failures, including all130 separate Bottom-run pairs. The old617 Source23 and11488 Source36 preferred-self failure pairs and older foreign-spacing failures remain explicit; whole-route TI qualification is false. The earlier unexecuted proof with a 0.2983566 mm new23 self gap is retained as rejected; the corrected bend measures 0.3082152495 mm against0.3048 mm.

Full command/clock spread remains **17.6628187566 mm**, because Source0 still sets its minimum. Remaining short owners are0/19/5/20/7/22/8/9. This standalone Model328 snapshot excludes the later Source333 replay and its fresh native/via-authentication evidence, described in the current report. Source313's234-via pour proof is not inherited by Model328 or Source333. Electrical timing, reference continuity, TI qualification and fabrication readiness remain false.

The [Model328 archive](artifacts/g350-four-layer-ca18-model328-source313-base-2026-10-17.tar.gz), SHA256 `81ca12343d2bbf9fa73d9266f8a9c6d61c7016372e6cb533d82c9a9a91c4bd16`, preserves66 files in10,040,003 compressed bytes. Its [manifest](artifacts/g350-four-layer-ca18-model328-source313-base-2026-10-17.manifest.json) requires Model318 and the preceding Source313 lineage. Its [restore validation](artifacts/g350-four-layer-model328-restoration-validation-2026-10-17.json) verifies every extracted hash/size/mode and all301 actual local/prerequisite targets and the existing solver dependency link before/after the unchanged helper's zero-write restore. The saved directory is `.cloud-tools/ddr-four-layer-model328-2026-10-17`. The immutable snapshot cuts at actual328; pending Source0 studies and failed/unexecuted predecessors remain explicitly unaccepted.

Previous separate physical model **actual318** retains all 49 paths and both byte groups and tunes Source37 to **21.2000 mm**, bringing command/clock minimum progress to **17/26**, with nine still short. Five 0.31 mm Inner1 trombones pass their scoped 3W self-spacing and foreign-DDR 3W/4W checks; local contiguous corner contacts are explicitly recorded. Only Source37 changes, including its first genuine inline via moved 0.1 mm southwest. The second via, other 48 bodies and foundation remain literal. All 49 before/after physical checks, the complete changed numeric-pad join, both critical five-API/C31 views and existing reference/PDN/pad checks pass. Model318 has no fresh editable-source, native-board, pour or CAD qualification. Full command/clock skew, electrical timing, TI reference compliance and fabrication readiness remain false.

The [Model318 archive](artifacts/g350-four-layer-ca17-model318-source313-base-2026-10-16.tar.gz) contains 23 files, is 1,343,381 bytes, and has SHA256 `f7090db168c637688eaaa4b6456a1de83edc0d2e3ead44a2a7458a12ec82ccc6`. Its [manifest](artifacts/g350-four-layer-ca17-model318-source313-base-2026-10-16.manifest.json) requires Source313 and the earlier lineage. Its [restore validation](artifacts/g350-four-layer-model318-restoration-validation-2026-10-16.json) verifies all 23 extracted members and all 239 actual local/prerequisite targets before and after the existing helper restores zero files. The saved directory is `.cloud-tools/ddr-four-layer-model318-2026-10-16`; the editable Source313 checkpoint is retained separately.

The separate [Source272 KiCad evidence](DDR_SOURCE272_KICAD_CONNECTIVITY_2026-10-16.md) confirms that snapshot's 49 numeric DDR connections. Its default DRC findings remain capped and include five ignored checks; it does not qualify Source313 or Model318.

Previous editable checkpoint: **actual286 / Source289, 49/49 DDR paths, both data bytes matched**. DDR signals use Top, Inner1, Inner2 and Bottom, following the user's four-signal-layer choice. This does not establish TI reference-plane continuity, impedance, spacing or electrical timing. TI's standard four-layer arrangement reserves the inner layers for ground and DDR power.

Fresh Source289 passes all 35 fidelity controls and reproduces all 49 real CPU/RAM numeric-pad connections. It retains 280 hardware identities, 1165 lands, 129 original fixed reference barrels, the two existing capacitor placement/PDN changes and 234 actual fullspan vias. The latest change moves Source42's matching from Top to Bottom to open a control-routing corridor; all 48 other bodies, both original carrier vias and the entire foundation remain literal.

| Source289 group | Whole planar spread | Limit | Result |
| --- | ---: | ---: | --- |
| Byte0, all 11 members | 0.5771666935 mm | 0.635 mm | Pass |
| Byte1, all 11 members | 0.5769421603 mm | 0.635 mm | Pass |
| Command/clock, all 26 members | 17.6628187566 mm | 0.635 mm | Fail |

Fifteen of 26 command/clock signals reach the retained 20.95 mm minimum; eleven remain short. All three differential-pair planar skews pass 0.127 mm. These centerline measurements do not qualify electrical delay. Some existing compact tuning arms remain closer than TI's typical 3W guidance; wider-spaced variants are separate, unaccepted studies.

Native290 and Native294 complete two disjoint sets of 16 checks on the same exact Source289 raw, controls and plan. Together they cover all 32 original native checks with no exceptions. The complete reports retain **951 findings**: 70 source declarations lacking qualifying PCB traces, 718 port-connectivity findings, 162 trace-thickness warnings and one command/clock skew finding. No thickness warning directly names any of the 49 DDR signal declarations. This is a complete check invocation record, **not a full-board pass**. Auth291 authenticates all 234 vias and returns zero foreign via-to-track violations or identity failures.

Source289 generates 19 literal pours. Their current foreign margins and PDN/plane connectivity have not been independently qualified; Source272's 16-pour proof is not inherited. The separate fresh KiCad export/check work uses frozen Source272 and cannot qualify Source289. Continuous returns, controlled impedance, SI, full-board connectivity, fabrication checks and exact shell fit remain open.

The [current validation summary](artifacts/g350-four-layer-source289-validation-summary-2026-10-16.json) binds the exact source, model and unfiltered reports. Candidate286 SHA256 is `adf4821e147029e694dffe97f5894fe060e9607d9510867e20a9e9b7f6fd621e`; raw Source289 SHA256 is `b7809be35568d45e117abf239edc290b2c379f9e02ec9427206798b0e60a567e`. The accepted default selection is unchanged. `all49Accepted=false`, `fabricationReady=false`; the board is not ready to order.

The [portable Source289 archive](artifacts/g350-four-layer-both-bytes-ca15-connected49-source289-2026-10-16.tar.gz) contains 156 regular files, is 15,536,110 bytes, and has SHA256 `998a6b8a90d6d31fecf55a1f3ed7c2cdf0dabab47f01311ad5793d7e05ddeb1d`. Its [manifest](artifacts/g350-four-layer-both-bytes-ca15-connected49-source289-2026-10-16.manifest.json) requires the prior Source209, Source228, Source248, Source257 and Source272-v2 archives in order, after the existing Source32 restore chain. It freezes work through actual294, including unsuccessful attempts and all native findings; later experiments are separate.

The [Source289 restoration test](artifacts/g350-four-layer-source289-restoration-validation-2026-10-16.json) passes all 156 member hashes, sizes, modes and normalized headers under umask077. Isolated extraction restores 156 files; a second extraction restores zero. It verifies all 135 local and 32 prerequisite workspace targets, seven data-only workspace evidence copies and both inherited immutable assets. The existing workspace helper's actual `--restore` branch restores zero files, and all targets and the preexisting dependency symlink remain unchanged.

After restoring the prerequisites, restore Source289 from the board root:

```bash
source cloud/env.sh
python scripts/restore-g350-routing-evidence.py cloud/artifacts/g350-four-layer-both-bytes-ca15-connected49-source289-2026-10-16.manifest.json --destination . --verify-archive
python scripts/restore-g350-routing-evidence.py cloud/artifacts/g350-four-layer-both-bytes-ca15-connected49-source289-2026-10-16.manifest.json --destination .
python scripts/restore-g350-four-layer-routing-workspace.py --saved-directory .cloud-tools/ddr-four-layer-post274-2026-10-16 --restore
```

Separate later physical model: **actual299, 49/49 paths, both data bytes matched, 16/26 command/clock signals at minimum**. Only Source24's Bottom tuning body changes from the Source289 model. Its whole planar length is 21.0394076698 mm; the other 48 bodies and foundation remain literal. The seven-row bank uses 0.31 mm pitch, with 0.306 mm minimum nonlocal center spacing. The new body passes its foreign-DDR 3W/4W audit without exceptions, with nearest foreign center spacing 0.3071671857 mm. Two local contiguous corner pairs remain below 3W; this is not whole-route TI qualification. Both actual critical views, all five routing API checks and all 49 final physical model checks pass. Ten command/clock members remain short; full command/clock skew still fails.

At this initial standalone Model299 milestone, **fresh Source/Core replay, native board, pour and CAD qualification were pending**. The later Source313 replay and its current checks are described above. Its checks and Source272's pour/CAD results are not inherited by this model. The [supplemental Model299 archive](artifacts/g350-four-layer-ca16-model299-source289-base-2026-10-16.tar.gz) is 1,325,974 bytes, SHA256 `bf63e126db40168b7bdda4031d10a9ed8e56f87d1de67118caa3fb9ff64257cb`. Its [manifest](artifacts/g350-four-layer-ca16-model299-source289-base-2026-10-16.manifest.json) requires Source289 after the five earlier archives. The [restoration test](artifacts/g350-four-layer-model299-restoration-validation-2026-10-16.json) verifies all 17 members, isolated extraction and all 180 actual local/prerequisite targets before and after the existing helper's zero-write restore. The first archive-helper attempt failed Python parsing before any payload write; its original source and failure receipt remain separate and unchanged. The corrected successor passes AST/compile review and actual build/restore validation.

After restoring Source289 and its prerequisites:

```bash
source cloud/env.sh
python scripts/restore-g350-routing-evidence.py cloud/artifacts/g350-four-layer-ca16-model299-source289-base-2026-10-16.manifest.json --destination . --verify-archive
python scripts/restore-g350-routing-evidence.py cloud/artifacts/g350-four-layer-ca16-model299-source289-base-2026-10-16.manifest.json --destination .
python scripts/restore-g350-four-layer-routing-workspace.py --saved-directory .cloud-tools/ddr-four-layer-model299-2026-10-16 --restore
```

Previous scoped pour-qualified DDR milestone: **actual268 / Source272, 49/49 DDR paths, both data bytes matched**.
DDR signals still use Top, Inner1, Inner2 and Bottom. This is the requested
four-signal-layer experiment; it does not establish TI's reference-plane,
controlled-impedance or signal-integrity requirements. TI's standard four-layer
arrangement reserves Inner1 for ground and Inner2 for DDR power.

The fresh editable Core replay passes all 35 fidelity controls and independently
connects every real CPU/RAM numeric-pad pair. All 280 real hardware identities,
1165 lands, 129 original fixed reference barrels and the two declared capacitor
placement/PDN changes are retained. The replay contains 234 actual fullspan vias.
No numeric pin or bit swaps, extra copper layers, rule changes or edits to the
raw Core geometry are used.

| Source272 group | Whole planar spread | Limit | Result |
| --- | ---: | ---: | --- |
| Byte0, all 11 members | 0.5771666935 mm | 0.635 mm | Pass |
| Byte1, all 11 members | 0.5769421603 mm | 0.635 mm | Pass |
| Command/clock, all 26 members | 17.4387009342 mm | 0.635 mm | Fail |

All three differential-pair planar skews pass the retained 0.127 mm limit.
Nine of 26 command/clock signals reach the retained 20.95 mm minimum; the other
17 still require tuning. Planar matching is not electrical timing validation.
Compact tuning arms also require TI spacing review: some satisfy the preserved
physical clearance rule but are closer than TI's typical 3W center spacing.

Fresh native273 completes the 16 focused checks without exceptions. Fifteen
geometry checks return zero findings; the remaining finding is command/clock
bus skew. All findings are retained. The other 16 legacy native checks have not
been rerun on this snapshot, so this is not a full-board DRC pass.
Auth274 authenticates all 234 vias and finds no foreign via-to-track clearance
violation. The independent literal-pour aggregate covers all 16 actual fresh
pours, 234 vias and 5097 DDR wire segments across all 49 owners, with zero
foreign-margin violations. Minimum foreign edge gap is 0.1183205295 mm against
the retained 0.1016 mm requirement.

Both new capacitor PDN lands have positive-area contacts to their actual fresh
filled polygons. The ground pour also contacts the annulus of a genuine held
ground barrel, its real Top trace and the numeric RAM ground pin. These local
contacts do not prove continuous DDR reference planes or return paths.
Independent CAD, controlled impedance, electrical delay, complete reference
continuity and full-board fabrication qualification remain open.

[Four-layer both-bytes-matched snapshot](artifacts/g350-four-layer-both-bytes-matched49-source272-2026-10-16.png).
Candidate268 SHA256 is
`fcc50ba7874af9724526a443367f70eeb42bff6179eb07ef8fd3ff929c0c6c77`;
fresh Source272 raw SHA256 is
`33584d197a1bb45a0dc76ac0a69e7016866a2369f1750c72d5eedc41ef444594`.
The first normal-memory Core271 attempt stopped at the unchanged 2 GiB owned
RSS cap; the identical source, inputs and checks passed as Core272 with Bun's
`--smol` mode. The failed receipt and its partial output remain preserved.
The accepted default remains unchanged; `all49Accepted=false` and
`fabricationReady=false`. The board is not ready to order.

The frozen checkpoint is `.cloud-tools/ddr-four-layer-post259-v2-2026-10-16`.
Its [portable Source272 archive](artifacts/g350-four-layer-both-bytes-matched49-source272-v2-2026-10-16.tar.gz)
contains 119 regular evidence files, is 13,615,307 bytes, and has SHA256
`4ebb4ac4e750534c62de43f200d01a3ad81bb0c05bae0369e87c75351cd71f4b`.
The [manifest](artifacts/g350-four-layer-both-bytes-matched49-source272-v2-2026-10-16.manifest.json)
requires Source209, Source228, Source248 and Source257 in order after the
existing Source32 restore chain. The two immutable 3D assets remain exact members
of the Source257 dependency; this increment does not duplicate or modify them.

The [restoration validation](artifacts/g350-four-layer-source272-v2-restoration-validation-2026-10-16.json)
passes isolated extraction under umask077, all 119 member hashes/sizes/modes and
normalized headers, a second extraction restoring zero files, and all 105 local
plus four prerequisite workspace targets. It also exercises the existing
workspace helper's actual `--restore` branch with zero restored files after
verifying every target and the existing dependency symlink; both stay unchanged.
The v2 manifest includes the required `solverSourceRoot` from the pinned base.
The first unpublished snapshot/archive is preserved separately with its missing
metadata entry; no frozen evidence was repaired in place.

After restoring the prerequisites, restore this checkpoint from the board root:

```bash
source cloud/env.sh
python scripts/restore-g350-routing-evidence.py cloud/artifacts/g350-four-layer-both-bytes-matched49-source272-v2-2026-10-16.manifest.json --destination . --verify-archive
python scripts/restore-g350-routing-evidence.py cloud/artifacts/g350-four-layer-both-bytes-matched49-source272-v2-2026-10-16.manifest.json --destination .
python scripts/restore-g350-four-layer-routing-workspace.py --saved-directory .cloud-tools/ddr-four-layer-post259-v2-2026-10-16 --restore
```

Historical reproducible DDR connectivity milestone: **actual253 / Source257, 49/49 DDR paths**.
D12 is now connected. DDR wires use Top, Inner1, Inner2 and Bottom, as requested.
This all-four-signal-layer experiment still requires reference-plane redesign
and qualification; TI's standard four-layer arrangement reserves the inner
layers for continuous ground and DDR power.

Fresh Source257 reproduces all 49 real CPU-to-RAM numeric-pad connections with
all 35 fidelity controls passing. It preserves all 280 real hardware identities,
1165 lands and the 129 fixed reference barrels. Two capacitors have explicit,
reviewable placement/reference deltas: C_DDR_RAM_12 X+0.79 mm and C_DDR_RAM_8
at (0, 7.9) on Bottom. The latter has two real new net-declared PDN vias.
CPU2/CPU11 dogbones, the D12 endpoint approaches and declared signal bodies
have exact inverse records; no numeric pin or bit swaps are made.

Native258 completes 16 focused checks. Physical clearance, shorts, dangling
copper, contiguity, routing constraints and via checks return zero findings;
three bus-skew findings remain. Auth259 authenticates all 234 real vias and
finds no foreign via-to-track clearance violation. Fresh literal-pour checks
cover all 14 actual pours, 234 vias and 979 routed wire segments: zero foreign
margin violations, minimum gap 0.1183205295 mm against 0.1016 mm.

The moved capacitor's new PDN lands lie wholly inside actual fresh power and
ground pours. Ground contact to a genuine held package-reference barrel is
proved through its positive-width copper annulus, real Top trace and numeric
RAM ground pin. The earlier stricter full-held-land-disk test and its negative
result are preserved. No geometry or manufacturing clearance rule was changed.
These are local PDN contacts; complete DDR return-path continuity remains open.

| Source257 group | Whole planar spread | Limit | Result |
| --- | ---: | ---: | --- |
| Byte0 | 6.6552022816 mm | 0.635 mm | Fail |
| Byte1 | 2.4000719198 mm | 0.635 mm | Fail |
| Command/clock | 17.4387009342 mm | 0.635 mm | Fail |

All three differential-pair planar skews pass 0.127 mm. Later matching work has
separate geometry and fresh checks; its results must not be attributed to this
Source257 snapshot. No electrical delay, controlled impedance, TI spacing or
reference compliance, independent CAD or fabrication readiness is claimed.
Some compact tuning arms meet the preserved physical spacing rule while being
closer than TI's typical 3W spacing; they still need SI review or redesign.

[Four-layer connected49 snapshot](artifacts/g350-four-layer-connected49-source257-2026-10-16.png).
The frozen evidence is `.cloud-tools/ddr-four-layer-post252-2026-10-16`;
resume from its `latestSourceVerifiedCheckpoint`. Candidate253 SHA256 is
`f76709a0c4cf1a19920b1e9361e7d5f994ee1671f975836f88d775e17651df87`;
fresh Source257 raw SHA256 is
`db3cc308c41304d57c37ca027de5bfa45379e149c1eb313940eed65050807d6d`.
The older Source24848 and separate Source23647 CA timing fallback remain intact.
The accepted default is unchanged; `all49Accepted=false`; `fabricationReady=false`.
The board is not ready to order.

The [portable Source257 archive](artifacts/g350-four-layer-connected49-source257-2026-10-16.tar.gz)
contains 110 regular members: 108 saved evidence files plus two exact immutable
board-relative 3D assets. It is 8,420,938 bytes, SHA256
`8e18d75892787b85fe99b13de607871dab8009a19ff03d0515a4c4b835efb3ac`.
Its [manifest](artifacts/g350-four-layer-connected49-source257-2026-10-16.manifest.json)
requires the Source209, Source228 and Source248 archives in that order after
the existing Source32 restoration chain. The [restore validation](artifacts/g350-four-layer-source257-restoration-validation-2026-10-16.json)
passes an isolated extraction under umask077, all headers/hashes/sizes/modes,
a second extraction restoring zero files, all 90 local and 23 prerequisite
workspace targets, and both asset copies. Actual board assets were read only;
only the test's owned extracted payload was removed after success.

After the prerequisite archives and workspace files are restored, restore this
increment with the existing scripts (existing differing bytes are refused):

```bash
source cloud/env.sh
python scripts/restore-g350-routing-evidence.py cloud/artifacts/g350-four-layer-connected49-source257-2026-10-16.manifest.json --destination . --verify-archive
python scripts/restore-g350-routing-evidence.py cloud/artifacts/g350-four-layer-connected49-source257-2026-10-16.manifest.json --destination .
python scripts/restore-g350-four-layer-routing-workspace.py --saved-directory .cloud-tools/ddr-four-layer-post252-2026-10-16 --restore
```

Historical reproducible routing checkpoint: **actual243 / Source248, 48/49 DDR paths**.
Only D12/source26 remains disconnected. DQM0/source30 is now connected at
11.6836294063 mm. The routing uses Top, Inner1, Inner2 and Bottom. This is the
requested all-four-signal-layer experiment; it is not TI's standard four-layer
arrangement with continuous inner ground and DDR-power planes.

The real editable replay moves only C_DDR_RAM_12 by +0.79 mm in X, translates
its two lands and reroutes its two Bottom reference connections. All 280 real
hardware identities, the other 279 placements, 1163 other lands, 163 other
reference traces and all 129 fixed reference vias are preserved. Two RAM
dogbones and the declared ordinary trace bodies change; no numeric pin swaps
are made. The original width, clearance, fullspan-via and length rules remain.

Actual243 passes all 48 model physical checks. Fresh244 passes all six critical
conductors, five original report APIs and C31 in both actual DQS1 views.
Projector245/capture246/Core248 reproduce 48 connected and one pending actual
numeric-pad graph, with all 35 fidelity controls passing. Core248 contains
229 real fullspan vias and 313 physical trace rows. Failed Core247's OBJ-loader
attempt is preserved; the stage-logging-only retry248 passed without changing
asset handling, geometry or assertions. Its earlier failure remains unexplained.

Native249 completes all 16 focused checks: physical10 and the other five
geometry checks return zero findings; three bus-skew failures remain.
Auth250 authenticates all 229 vias with zero foreign via-to-track violations.
The fresh literal-pour audit and independently checked coverage aggregate cover
all 14 actual BREP pours, 229 vias and 957 routed wire segments across 48 owners,
with zero foreign-margin violations. Minimum edge gap is
0.11832052949719676 mm against 0.1016 mm.

| Group | Routed subset length spread | Limit | Result |
| --- | ---: | ---: | --- |
| Byte 0 | 6.6552022816 mm | 0.635 mm | Fail |
| Byte 1 | 2.3907853135 mm, D12 pending | 0.635 mm | Fail |
| Command/clock | 17.4387009342 mm | 0.635 mm | Fail |

All three planar differential-pair skew observations pass 0.127 mm. This does
not establish electrical delay, controlled impedance, return-path continuity,
TI compliance, independent CAD or fabrication readiness. Only 3/26 CA signals
meet the retained 20.95 mm minimum. The separate Source236 47-path timing
fallback has 13/26 CA signals at minimum and a 15.8185999215 mm CA spread; its
timing and 15-pour results must not be attributed to Source248.

Preview: [four-layer Source248 snapshot](artifacts/g350-four-layer-partial48-source248-2026-10-16.png).
The yellow dashed line marks the pending D12 connection.
The separate evidence folder is `.cloud-tools/ddr-four-layer-post232-2026-10-16`.
Candidate243 SHA256 is
`cf4808ac8cfd61832979cfd95bec76e22605bfc43d3d0138bbbf5086cfe59720`;
fresh Source248 raw SHA256 is
`c5129a2ec734e873c209ab8cdccf2cad1753d177f1c87857ffae0cf7ff12a486`.
The later 251/252 D12 corridor tests preserve all 48 routes and both critical
views but find no qualified final path in their bounded models. They do not
prove board-wide impossibility. The accepted default remains Source32 at
32/49; `all49Accepted=false`; `fabricationReady=false`.

The [portable Source248 archive](artifacts/g350-four-layer-partial48-source248-2026-10-16.tar.gz)
contains 194 regular files and 158 workspace restore targets. It is 11,222,356
bytes, SHA256 `e5d10d729ee0fc7fed74fdafbcb169a4f78083645d81064130dc30c2809d9e24`.
Its [manifest](artifacts/g350-four-layer-partial48-source248-2026-10-16.manifest.json)
requires Source209 and Source228 in that order, after the existing Source32
restore chain. The [restoration validation](artifacts/g350-four-layer-source248-restoration-validation-2026-10-16.json)
records an isolated extraction under umask077, exact hashes/sizes/modes and
normalized headers for all 194 members, a second extraction restoring zero
files, and verification of all 158 workspace targets. Only the test's owned
extracted payload was removed after the pass; the saved board was untouched.
The final post232 snapshot closes at scope252 plus the completed
pour audit and reviewed plot; later experiments require a new saved directory.
Use `latestSourceVerifiedCheckpoint` in its `PROGRESS.json` to resume the
48-path board. Its older `primaryCandidate` entry deliberately preserves the
separate Source233/236 timing fallback.

Historical partial Source checkpoint: **actual223 / Source228, 47/49 DDR paths**.
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

The later merged233 candidate has separate Core236/native237/auth238 results
and a completed all15-pour aggregate over its exact 227 vias and 7456 routed
wire segments. It is outside the Source228 archive and is retained separately
with the newer Source248 evidence. No pour or timing result crosses scenes.

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
Source228, then Source248. After the Source32 and Source209 commands above,
continue:

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

Then restore the latest 48-path Source248 checkpoint:

```bash
python3 scripts/restore-g350-routing-evidence.py \
  cloud/artifacts/g350-four-layer-partial48-source248-2026-10-16.manifest.json

python3 scripts/restore-g350-four-layer-routing-workspace.py \
  --saved-directory .cloud-tools/ddr-four-layer-post232-2026-10-16 --restore
python3 scripts/restore-g350-four-layer-routing-workspace.py \
  --saved-directory .cloud-tools/ddr-four-layer-post232-2026-10-16
```

Read the restored post232 `README.md` and `latestSourceVerifiedCheckpoint`
before continuing. Only D12 is pending in this checkpoint; the older 47-path
fallback keeps its own geometry, counts, timing and pour evidence.

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
