# Connected G350: shorter byte1 paths and second matching batch

Latest checked continuation (2026-10-10 UTC): use
`experiments/am3352-g350-full-board-shorter-byte1-second-batch-replay.circuit.tsx` and read
`cloud/DDR_SHORTER_BYTE1_SECOND_BATCH_2026-10-10.md` plus `checks/integrated/g350-shorter-byte1-second-batch-progress/summary.json`.
Fresh source770 / KiCad771 / Gerber772 retain all217 connections,49 DDR,
298 grounds,1,032 numeric pads,280 placements,RAM90,four layers and824 standard
through-vias. Native physical/manufacturing/ground checks, all-rule KiCad
errors/warnings/opens/dangling copper and all-layer shorts are zero.
Byte0 passes 0.574882 mm; byte1 5.461624 mm and
command/clock 6.210969 mm still fail0.635 mm. All pairs pass0.127 mm.
Source build exit1 is exactly those two failures; complete qualification exits0.
D8 removes three existing acute corners and shortens5.380863 mm; one acute
corner remains. DQM1 shortens5.461572 mm, with its floor adjusted by real0.1 mm
copper. Original pad endpoints, all foreign copper, placements and constraints
stay exact. A0's same two bounded middle-barrel moves are retained; all824
original hole IDs/dimensions/full depth remain. Exact planned copper reproduces
in source. Joint public BusLanes11/37-lane trials find no complete route and
are not promoted. Snapshot763 is completed round2, not the entire8-round parent.
Keep runtime pins, reviewed native patch and every existing physical assertion.
Native1.6 mm per transition is not electrical delay. Clock/stackup/package/via
models, impedance/coupling/returns, PDN/footprints, Linux and measured shell fit
remain open. fabricationReady=false; the board is not ready to order.
Preserve source737/699/643/610/591/565/540/532/319 and frozen evidence.
Future edits require fresh source and complete independent qualification.

| Native group | Source737 mm | Source770 mm | Limit mm |
| --- | ---: | ---: | ---: |
| DDR_BYTE0 | 0.574882 | 0.574882 | 0.635 |
| DDR_BYTE1 | 5.561624 | 5.461624 | 0.635 |
| DDR_COMMAND_CLOCK | 6.464305 | 6.210969 | 0.635 |

The completed second batch763 is frozen from the eight-round parent724 only
when its candidate hash equals the completed report's full physical and fresh-
ground results. It retains31 units in round2 after33 in round1. Its third round
was incomplete during this qualification and is not promoted. Source731's
bounded owned-A0 barrel changes merge in766 without conflicting route edits or
bus regression. Every other original physical hole stays exact.

Relaxation750 reduces DQM1 from54.884696 to49.323124 mm. Acute-window repair751
and754 reduces D8 from54.884696 to49.503833 mm and removes three of four acute
corners without introducing new acute vertices. A real0.1 mm bend in765 brings
DQM1 to49.423124 mm so it does not undo D9's latest progress. Overlay767 explicitly
selects only those two source-replayed routes, requires immutable pads/holes/
placements/source definitions, checks every foreign trace, and reruns full
physical, manufacturing, via-count, continuity, thickness, constraint and fresh
four-layer ground checks. No complete bus regresses any input. It ignores only
regenerated pour membership annotations when reconciling source representations;
no copper geometry or assertion is omitted. Source770 reproduces exact planned
canonical wire/via geometry and every exact planned physical hole record.

Failed planning is preserved.749/752 refuse unsuitable acute baselines before
routing.757 was invoked before its input merge finished;764 used a mistyped
input path. Both exit1 before candidate edits; corrected runs are separate.
Partial corner relaxation758 and equal-length real comb762 find no retained
proposal. Offset-hole detour755 creates no new holes. D12 trials753/760 are
physical-only legal but longer56.483562/56.394906 mm and are rejected; generator
exit0 is not source/CAD qualification. BusLanes759 cannot meet the shorter D12
carrier target, and761 finds no alternate-layer planar route.

Pinned Core's public BusLanes is also tested jointly:768 uses11 byte1 lanes with
inner1/inner2 terminals;773 permits bottom access at the existing full-depth
holes.774 plans37 byte1 and command/clock lanes together, leaving byte0 and the
rest of the board fixed. Scratch middle-hole removals are explicitly recorded,
never applied to the accepted source. All searches finish exit2 without timeout
or signal and leave source bytes unchanged. Their post-route positive validation
branches remain untested because no complete route is produced. Keep these
helpers experimental. No failed, longer, partial or disconnected route is promoted.

Source770 completes all three routing phases in447.362 seconds, actual exit1,
with exactly two pcb_bus_length_skew_error records, no forced timeout/signal and
unchanged source definitions/runtime pins. Existing mechanical notices remain.
Independent771/772 completes with exit0, including every KiCad severity and
exclusion, all217/217 logical connections,1,032 numeric pads and298 grounds,
standard full-depth holes, reconstructed native fills and all-layer Gerbers.
One D8 acute corner remains; zero DRC does not establish signal integrity.

All frozen hardware/evidence and previous checked checkpoints are preserved.
The user's two pre-existing modified scripts remain unstaged with unchanged
combined diff SHA256349912589330f6030862a7c26f22a5d8a8a9b8bbe09f9a04fc74a28bdbd21fb8.

compiledCircuit: `dist/g350-ddr-shorter-byte1-second-batch-source-770/compiled.circuit.json` SHA256 `b9c014e8a2ae9f8b99ae4a09b4b09b8d542dcf296745b0f074575ee5d597329c`

freshFilledCircuit: `dist/g350-ddr-shorter-byte1-second-batch-verified-771/fresh-filled.circuit.json` SHA256 `06b65e530b99eeb2ada19c1611ffb1619f02cb2ca952b9e7ee772f4fbe39c4b4`

independentBoard: `dist/g350-ddr-shorter-byte1-second-batch-verified-771/filled/ground-reference.kicad_pcb` SHA256 `3783df658cc012501ec54fce0ac56cbb80bbe86b1d012d3a882c4f990d85076d`

snapshot: `dist/g350-ddr-shorter-byte1-second-batch-verified-771/pcb-all-layers.png` SHA256 `10c936083d708ad075bafde1ea2e5bd925d3ca176cc972f5cf8d541463665648`

The complete Start commands were directly tested in778, actual outer exit0.
Exact Start SHA256 `485d46d63df335e1719deb0e062ffa42a64d25f78c6a5fddfccce068610c02b0`. They verify the pinned tools, KiCad APIs,
all25,814 frozen files, every connected checkpoint and routing-tool controls.
Install is retained from its previously tested revision. Both new archives pass
archive, fresh/repeat/in-place restoration and edited-file-refusal controls.
These checks verify this prepared filesystem; fresh managed-task restoration
has not been demonstrated. Saving a draft does not activate or publish it.
