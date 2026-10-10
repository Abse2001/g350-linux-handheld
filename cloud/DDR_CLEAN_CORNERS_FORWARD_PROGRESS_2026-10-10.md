# G350: clean D8 corners and forward DDR matching

Latest checked continuation (2026-10-10 UTC): use
`experiments/am3352-g350-full-board-ground-preserving-clean-corners-replay.circuit.tsx` and read
`cloud/DDR_CLEAN_CORNERS_FORWARD_PROGRESS_2026-10-10.md` plus `checks/integrated/g350-clean-corners-forward-progress/summary.json`.
Fresh source 836 / KiCad 837 / Gerber838 retain all 217 connections,49 DDR,
298 grounds,1,032 numeric pads,280 placements,RAM90,four layers and824 original
standard through-vias. Native physical/manufacturing/ground checks, all-rule
KiCad errors/warnings/opens/dangling copper and all-layer shorts are zero.
Byte0 passes 0.574882 mm; byte1 4.211624 mm and
command/clock 4.410969 mm still fail 0.635 mm. All pairs pass 0.127 mm.
Source exit 1 is exactly those two failures; complete independent qualification exits 0.
D8 now has zero corners below 25 degrees. Seven completed byte1 rounds814 and
three completed command rounds815 are retained snapshots, not entire parent
runs780/781. Selective cleanup811/816 and merge 817 preserve every original hole,
CPU/RAM endpoint, peripheral trace, placement, logical constraint and runtime pin.
Exact planned834 canonical DDR copper and physical hole records reproduce in source.
The existing two bounded A0 barrel moves remain unchanged relative source 770.
Bottom DDR copper is restored exactly from checked source 770; CASn is retuned
on Top only. No new hole, removed hole or failed topology trial is promoted. Public pinned
BusLanes trials 787/788/800/801 find no complete qualifying route. Fine-grid809
passes an independent clearance control; board trials 808/810/812/813 fail the
unchanged overlap/self-short guards. Keep those planning helpers experimental.
Native1.6 mm per transition is not qualified electrical delay. Clock/stackup/
package/via models, impedance/coupling/returns, PDN/footprints, Linux and measured
shell fit remain open. fabricationReady=false; the board is not ready to order.
Preserve source 770/737/699/643/610/591/565/540/532/319 and all frozen evidence.
Further edits require fresh source and complete independent qualification.

| Native group | Source 770 mm | Source 836 mm | Limit mm |
| --- | ---: | ---: | ---: |
| DDR_BYTE0 | 0.574882 | 0.574882 | 0.635 |
| DDR_BYTE1 | 5.461624 | 4.211624 | 0.635 |
| DDR_COMMAND_CLOCK | 6.210969 | 4.410969 | 0.635 |

The focused forward searches use all four authored layers, exact original barrels and complete unchanged physical guards. A9 remains restricted to Inner2 during command growth. Snapshot 814 binds completed byte1 round 7 to matching full physical/fresh-ground hashes;815 binds completed command round 3. Their parents are stopped/incomplete and must not be called completed eight-/six-round executions.

Repair 797 removes D8's final15.575-degree corner using real planar copper, shortening its grown route3.791056 mm without a new shortest outlier. Cleanup 785 shortens D15/D14;789 adds real1.2 mm bends to their floors. D8 regrowth 811 adds real1.2 mm while retaining zero acute corners. Explicit overlay 816 selects only D8/D14/D15, checks all foreign records and original holes/endpoints, and refuses any bus regression; negative control799 exits 1 and writes no candidate. Merge 817 then combines the disjoint byte1 and command edits with full physical/fresh-ground and nonregression checks. No count, width, clearance, continuity, logical bus limit or pair assertion is weakened.

Failed planning stays separate.786 preserves existing acute-corner triples while screening real two-via detours, but finds none. Public Core 0.0.2107 BusLanes787 cannot lengthen D9;788/800 find no complete D12/CSn0 topology;801 cannot obtain CASn tuning clearance. Only public solved outputs are eligible. Their failed post-route branches remain experimental and are not positively verified. Reduced-barrel794/795 and fixed-layer790–792 find no clearance-preserving channel. Physical-only 805 is longer56.394906 mm and is not retained. The first finer-grid invocation807 exposes a missing via-grid option and exits 1; the completed fix is tested separately in 809. It demonstrates a25-micrometre raster failure and12.5-micrometre success with independently calculated copper clearances0.104944/0.109200 mm, above the unchanged0.1016 mm rule. Fine-grid board trials 808/810/812/813 still fail overlap/self-short checks and are rejected. Reserving untouched own-wire sections is a proposal safeguard, not a waived check.

The alternate short-D9 regrowth 793 is incomplete and unqualified; snapshot 802 records its completed second step only. Its combination with shortened neighbours803 fails a physical overlap guard before creating a candidate. Neither that short carrier nor its intermediate regrowth is accepted. Rejected paths, immutable execution copies and completed snapshot hashes are retained as planning evidence. Guarded-grid trials use the JavaScript bridge; separate C++ controls belong to runtime-tool validation.

Fresh source 836 preserves its entire imported definition graph and pinned runtime, completes all three phases with no routing errors, and exits 1 solely for the two native bus-skew errors. All-rule KiCad 837 and every-layer Gerber838 complete independently with zero errors, warnings, opens, dangling tracks/vias and shorts, with no ignored severities or exclusions. Exact planned834 canonical wire/via geometry and every physical hole record bind to the fresh source. This is a connected checked PCB with unfinished timing qualification, not fabrication approval.

The first fresh-source attempt 819 completes all phases and native physical/ground checks, but independent820 exits 5 for a Bottom GND zone open. Numeric diagnostic 827 identifies exactly one missing ground pad, C_DDR_RAM_2.pin2; all 49 DDR connections remain connected. Island removal is already ALWAYS, so dropping an orphan does not repair this attached pad. That candidate is rejected. Recovery828 restores every Bottom DDR span from the prior independently verified source 770, with all other copper and original holes preserved. Top-only CASn growth829 checks and fixes all non-Top geometry, retaining the same command-group skew after real new Top copper. Immutable834 is completed round 4 of that stopped five-round parent, not the entire parent execution. Planning-only preflight 835 passes every KiCad rule and all 217 connections,1,032 numeric pads and298 ground pads before the final fresh-source replay. The recovered candidate is then rebuilt from editable source 836 and independently qualified in 837/838. No ground error or DRC severity is waived; failed820 and827 reports remain intact.

Fresh-source attempt 831 exits 1 after its child receives SIGKILL, with no compiled artifact and no forced timeout. Cgroup memory events report two OOM kills, and four exact owned paused planning jobs held about10 GiB. Their completed snapshots are preserved before those incomplete jobs are stopped to release memory. Retry 836 uses identical input geometry and source definitions.831 is failed resource evidence, not a checked board.

All frozen KiCad 10.0.5 evidence and hardware sources are preserved; new exports use the tested isolated Debian KiCad 10.0.6. The two pre-existing user-modified scripts remain unstaged with combined diff SHA256349912589330f6030862a7c26f22a5d8a8a9b8bbe09f9a04fc74a28bdbd21fb8. The old default entry is not substituted for this checked continuation.

compiledCircuit: `dist/g350-ddr-ground-preserving-clean-corners-source-836/compiled.circuit.json` SHA256 `c30da726262185a29e5a7c05009a97553ae454147c81a4d2f4c6d0632298d936`

freshFilledCircuit: `dist/g350-ddr-ground-preserving-clean-corners-verified-837/fresh-filled.circuit.json` SHA256 `aa8cd2719f47d8d586f049f5f00400cae33630c8bd76efd3490032b4b607ba99`

independentBoard: `dist/g350-ddr-ground-preserving-clean-corners-verified-837/filled/ground-reference.kicad_pcb` SHA256 `036f7828e43bfaa2ce6ebef6376db52ce74686215e5001daeecf6828334a9b2e`

snapshot: `dist/g350-ddr-ground-preserving-clean-corners-verified-837/pcb-all-layers.png` SHA256 `c9c6e43aba9f0ce78ac5c8b3787ce622ac8a6f2fa5552eadfadcf3dd6b2b28fc`

The complete Start script `cloud/START_CLEAN_CORNERS_FORWARD_CHECKED_2026-10-10.sh` was directly tested in844, actual outer exit0, SHA256 `b2208559733dd8ac615eff2ca66a97a394bdfc88bad2d150dbb7d13c1ea92db9`. It verifies all11 upstream pins, the reviewed native patch, KiCad APIs, all25,814 frozen evidence files, every connected checkpoint and four C++ routing-tool controls. Install is retained unchanged from the previously tested646 revision. All five new archives pass archive verification, fresh/repeated/in-place restoration and refusal to overwrite edited evidence. This verifies the prepared filesystem; a new managed task has not been tested. Saving the draft does not activate or publish it.
