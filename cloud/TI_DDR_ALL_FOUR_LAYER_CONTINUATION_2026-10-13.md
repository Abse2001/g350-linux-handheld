Four-layer DDR continuation — 2026-10-13 UTC

The latest request allows DDR signals on all four copper layers with reference
planes redesigned accordingly. The current C allocation uses COMMAND_CLOCK on
Inner1, BYTE1 on Inner2, BYTE0 on Bottom and RESET on Top. This is a custom
reference design; it is not TI's literal Top/GND/DDR-power/Bottom arrangement.
No current CPU-to-RAM interconnect has qualified all 49 DDR signals. Continuous
references, impedance, electrical timing and the rest of the board remain open.
`fabricationReady=false`; this checkpoint is not ready to order.

Hardware remains 280 parts on four layers. CPU/RAM and their original pin/net
identities are preserved; RAM is at (1.2, 6.2) mm with 270-degree rotation. The
qualified E placement moved C_DDR_RAM_7 and its two owned reference barrels and
stubs rigidly +1.4 mm X. Its actual Core JSON is
`0e2ce064e896db1d087474716d2e82b86155dbe28eecf28ce1727e73a466fee1`;
the original 17 native placement checks returned zero errors. Later C layer and
CA-length metadata reuse that measured geometry and those checks explicitly.
No new Core or native placement pass is inferred from a metadata capture.

Collected routing and test outcomes

Root routing session 78137 used the runtime128 conservative handoff-length
prune and actual C input. It stopped at its original 1,200-second wall limit
(1,200.394780 seconds total; peak owned RSS 1,199,022,080 bytes). Wrapper exit
was 2 and child exit -15 with `WALL_STOP`. There was no natural result or natural
solver failure, no accepted 49-link route, zero OOM events and an empty owned
group. Source and dependencies stayed exact. This is an unresolved bounded
attempt, not proof of infeasibility or an accepted timing result.

The separate joint local fanout capture returned 49 local connections, 96
full-depth via records and 288 wire primitives in one call. Its child exited 0
in 0.564651 seconds, with zero OOM and an empty owned group. The tool session
was lost; the wrapper exit remains unknown. The complete guard post-audit
supports only the recorded child result. Historical 196 individual/four joint
controls were reused, not rerun. These local wires are not complete CPU-to-RAM
routes or independently accepted copper.

Root 9839 completed a separate grid-phase diagnostic against two actual RAM
through-vias, preserving the full obstacle scene and 96 local fanouts. Original
coarse search (54 cells) and an unaligned intermediate search (72 cells) failed
with zero expanded nodes. Phase-aligned search passed with 100 cells and 17
expanded nodes; the original fine fallback also passed, with 902 cells and 79
expanded nodes. Neither successful diagnostic segment added a native issue.
The fixture's two existing unknown-trace-connection issues on the fixed
reference aliases remained unchanged; its overall native result is not a clean
board pass. Probe endpoints are diagnostic points, not hardware ports. The
scope exited 0 in 0.497745 seconds with peak RSS 72,105,984 bytes, zero OOM,
source/dependencies held and an empty owned group. The pitch-aligned helper
remains default-off and unadopted; original coarse/fine searches stay unchanged.
This shows one local grid-alignment improvement, not completed DDR routing.

The minimal canonical handoff-prune patch passes TypeScript and 33 focused tests
with 226 assertions (Root 97338, exit 0). Two full-suite attempts on the same
frozen source stopped at the original 1 GiB owned-RSS limit: Root 88659 after
40.600612 seconds and Root 7897 with `--smol` after 38.324106 seconds. Both have
wrapper exit 2, child -15, `OWNED_RSS_STOP`, zero OOM and empty owned groups.
Their tests are incomplete; neither establishes a full-suite pass. A same-source
2 GiB `--smol` successor, Root 5452, completed naturally in
181.398330 seconds with 632 passing tests and one timeout failure (633 tests,
186 files). Child exit was 1 and wrapper exit 2; peak RSS was 1,308,762,112 bytes,
with zero OOM and an empty owned group. This is a completed failing suite, not
a pass. A later normal-mode successor is outside this closed checkpoint.
The earlier
runtime128 overlay has 701 plus nine distinct passing test bodies across two
runs, with its original full-suite hook failure preserved. That composite is
not a single full-suite pass. All-eleven benchmark/regression qualification and
a verified stacked fix PR remain unfinished; historical V5 benchmark failure
is not relabeled as acceptance.

Fresh TI length metadata

The actual C endpoint audit gives maximum command/clock Manhattan length
14.6 mm. TI SPRS717L, printed p187 Table 7-68 row 13/note 9, defines CACLM as
that maximum plus 7.62 mm and nominal length as CACLM ±1.27 mm. The corrected
CA window is therefore **20.95–23.49 mm**, centered on 22.22 mm. The old
21.15–23.69 mm window came from V7's 14.8 mm placement and was carried through
V9's +0.2 mm Y move and V10. Both bounds change by -0.2 mm; the upper bound is
tightened. BYTE0 and BYTE1 have no authored minimum and retain maxima 13.2 and
14.4 mm. Bus skew 0.635 mm, pair skew 0.127 mm, widths, gaps, clearances,
cohorts, identities and all hardware geometry remain unchanged.

Root 69934's pure React capture passed in 3.798788 seconds, comparing 1,746
elements and changing exactly two CA props. Its group emptied with zero OOM,
and source/dependencies held. The sealed fresh-TI input bridge verifies that
actual capture, outside Root collection, endpoint arithmetic, original C
provenance and exact two-field native sidecars. It does not qualify electrical
delay, reference planes, routing or fabrication. The previous C/D failures,
original source-comparison failures and E/runtime128 wall stops remain intact.

Selected durable receipts

| Record | SHA256 |
| --- | --- |
| Runtime128 routing collection | e816353f4fc6866db71b70c244e69553bb8b7f662ffb3cdd784387c27cdccb1e |
| Recovered joint local capture | 13934207006e5a885c7ecb189d5282aad2d0197537af9a0ca4e676d2b57538c0 |
| Raw joint local geometry | 2a8d5723b71bd6714302ded0ad610b870eb287aaec92fef4eed0625973d9c6bb |
| Actual-via grid-phase collection | ebc1feafbf65bc148e00b014cc6a1b58d51e8e8cf06fcfd5179b7412b9c6cbae |
| Actual-via grid-phase result | 28b7859ce9a0337bc864e2171766d01cfc8a656f3ff26226fd68e2e635672309 |
| Canonical focused collection | c8847cfb416145d05cc5a20385b17d5316c43d40a189502b67b5675da0bec75a |
| Canonical full-suite RSS stop | b4cdde8badb70e0f544e5df61d13dc8ba84d37ce08125f49194434cc59cb8ba1 |
| Canonical `--smol` RSS stop | aa2aa8a62455d7737523ffe963988eede56e2f2dcd8295f3f101cce7c49b74bb |
| Canonical 2 GiB `--smol` failing suite | fbe69c0244c670d42c304fe742b1a46909d9ec0e5e153d46e413f5b980d9b4a1 |
| Fresh TI capture collection | b658ddbf03cd49719a38cd25172a828b84f3e28530b4f5067eea86492c01a207 |
| Fresh TI qualified input bridge | cb19b56776e6f58b43c6134ebec10f6d1c89220597e9ef27e2a0f625b93aa37a |

Receipts are retained in the solver's ignored `.cache/root-routing-progress`;
the fresh TI source and bridge are in the board's ignored
`.cloud-tools/ti-ddr-v12e-c-fresh-ti-window-*-next` directories. A data-only
archive preserves selected newly closed evidence; complete runtime restoration
and a new Start block are untested. Selection manifests may name inherited or
retained ignored files outside that payload. Source `cloud/env.sh` before
continuation. Keep lockfile
runtime versions, the reviewed native checker and all eleven inspection pins.
The physical-via exporter integration has its own Linux report. Existing frozen
hardware evidence and the four pre-existing hardware edits remain preserved.

The new data-only artifact is
`cloud/artifacts/g350-ti-ddr-all-four-layer-closed-evidence-2026-10-13.tar.gz`
with its adjacent `.manifest.json`. It contains 398 payload files plus one
internal index: 25,177,308 logical payload bytes compressed to 2,492,022 bytes.
Every archive member was checked as safe, unique and regular, with exact hash,
size and mode; selected original sources and the four protected edits stayed
exact before/after. Archive SHA256 is
`66e56eb62d81aa1678ad0a18085d505761880cc06e6dcc437cdd889d7675bd6c`;
external manifest SHA256 is
`41184bdd4a11d04ccc925658dbb10e718c74cda4e8e15a001546cf8867b15d23`.
The validation record is
`cloud/TI_DDR_ALL_FOUR_LAYER_ARCHIVE_DATA_VALIDATION_2026-10-13.json`.
No restoration, solver import/test, native check, route or new Start worker ran
for this archive. Installed dependencies, image, huge baseline documentation,
mutable progress, nested Git metadata and the active normal-mode successor are
excluded. The earlier indexed source/carrier archive remains a prerequisite;
this selected payload does not establish standalone operational closure.
