# TI AM3352 DDR3 routing audit — 2026-10-12

This is a read-only requirements audit for the G350 Top/Bottom DDR request. It
does not qualify a route, modify hardware sources, select manufacturing details,
or establish fabrication readiness. The source-bound project contains **49 DDR
signals**, not the 50 claimed in the pasted historical text.

## Source and current-document comparison

The frozen TI source is **SPRS717L, revised March 2020**,
`reference/am3352/am3352.pdf` and its indexed text. The official user URL
<https://www.ti.com/lit/ds/symlink/am3352.pdf> was fetched through the inherited
proxy with TLS verification enabled. Its downloaded PDF is byte-identical to
the frozen PDF: SHA256
`ec145b6b19a7ff35118bb0ec06b5ae9c51aa97ccdf4da935f2176d9168af0205`.
The frozen text SHA256 is
`13b2c98b7e8812cedd065d4aa7949a17da56903589a6f3aa0fe73d61eec19c0b`.
`am3352-pages-174-188-layout.txt` retains the original PDF table columns;
collapsed plain text alone can misidentify a typical value as a minimum.

TI §7.7.2.3.3 (printed p170; text lines 7840–7847) states that this is a PCB
design/manufacturing timing specification and that its specific requirements
take precedence over generic application guidance. The DDR3 section also applies
to DDR3L unless explicitly stated otherwise (lines 7807–7810).

## Stack, planes, placement and keepout

| Rule | Exact source | Audit interpretation |
| --- | --- | --- |
| At least four PCB layers; at least two signal layers | p174–175, Tables 7-61/62, lines 8033–8060 | Use Top signal / Inner1 GND / Inner2 power / Bottom signal. Inner2 is globally a split-power plane, but must be continuous **VDDS_DDR = DDR_1V5 throughout the DDR region**. |
| One full GND and one full VDDS_DDR reference beneath DDR; zero plane cuts and zero intervening layers | p175 Table 7-62 rows 3–6; lines 8057–8072 | Both reference planes must cover the whole DDR routing region. Trace-to-plane proximity follows the actual laminate. Vias, antipads, necks, fills and remote splits need geometry review. |
| Prefer initial routing on Top; Bottom routes must not cross a power-plane split | p174 Table 7-61 note 1, lines 8043–8045 | Top/Bottom-only signals fit the specified four-layer arrangement; this is not proof that an arbitrary existing pour is a qualified reference. |
| Ground reference preferred to power reference | p175 Table 7-62 note 2, lines 8068–8069 | Preference does not prohibit Bottom referencing continuous DDR power. Provide the required return bypass where the reference changes. |
| X1 ≤1000 mil=25.4 mm; X2 ≤600 mil=15.24 mm; Y offset ≤1500 mil=38.1 mm | p176 Figure 7-50/Table 7-63, lines 8086–8108 | Measurements are device center to device center, with figure-specific axes. Minimize X1 and Y for margin. Do not substitute pad Manhattan length for these placement dimensions. |
| Non-DDR to DDR keepout spacing 4w; no non-DDR signals on the same DDR routing layer inside the region | p176–177 Table 7-63/§7.7.2.3.3.5, lines 8102–8124 | The keepout encompasses all DDR circuitry/routing. Non-DDR signals there are allowed only on layers separated from DDR signal layers by GND. No GND or DDR-power breaks are allowed. |

Four-layer source declarations already name Top/Bottom signal layers, unbroken
Inner1 GND and Inner2 DDR_1V5. Declarations are intent, not filled-copper proof.
Current solver-native models describe obstacles and signal routing, not a
complete qualified power/reference plane geometry.

## Net classes and exact signal count

Printed p179, Tables 7-66/67 (text lines 8212–8225), defines CK, DQS0, DQS1;
ADDR_CTRL associates with CK, DQ0 associates with DQS0, and DQ1 with DQS1.

| Project class | Required physical nets in this one-x16 project | Count |
| --- | --- | --- |
| BYTE0 | D0…D7, DQM0, DQS0, DQSn0 | 11 |
| BYTE1 | D8…D15, DQM1, DQS1, DQSn1 | 11 |
| COMMAND_CLOCK | A0…A14, BA0…BA2, CSn0, CASn, RASn, WEn, CKE, ODT, CK, CKn | 26 |
| Asynchronous RESET | RESETn | 1 |
| Total | 48 synchronous +1 asynchronous | **49** |

The canonical mapping SHA256 is
`bd009131249a734e2ae0297b2150678f769108dbdfa617c5a3862d89de3fd8d5`.
Its 49 unique source IDs and logical names agree with the memory mapping. The
selected Micron MT41K256M16 x16 device has **A[14:0]**, whereas TI's generic
diagram covers A[15:0]: Micron printed p2 Table 2, text lines 73–80, and p20
Table 4, lines 1003–1014. CPU D3/pin40 is DDR_A15; the RAM has no A15 input.
A15 is absent from the project DDR connection list; this audit does not claim
that the full-board source explicitly marks this CPU pin no-connect. No
DDR_CSn1 appears in the CPU DDR interface or the project memory mapping; do not
confuse GPMC_CSn1 with a second DDR chip select. VREF, ZQ, supply and GND wiring
remain additional required support connections outside the 49 signal count.

## Length, skew, pair coupling and spacing

| Rule | Exact source | Required interpretation |
| --- | --- | --- |
| CK/ADDR_CTRL main-route skew ≤25 mil =0.635 mm | p186 Table 7-68 row 2, lines 8490–8497 | Match the applicable CK and address/control main routes. Stubs/terminations have distinct definitions and limits. |
| DQ intrabyte skew ≤25 mil and DQS-to-associated-DQ skew ≤25 mil | p188 Table 7-69 rows 3/5, lines 8575–8592 | Each byte comprises its eight DQ, DM and associated strobe pair. Matching bytes to one another is neither required nor recommended (p187 note, lines 8545–8547). |
| DQS pair skew ≤5 mil =0.127 mm; CK AS+/AS− and CK termination stubs also have 5-mil skew limits | p187–188 Tables 7-68 rows 9/12 and 7-69 row 4, lines 8508–8512/8580 | The project retains its stricter complete-pair 0.127 mm guard. Do not relax it from a partial stub reading. |
| CK and ADDR_CTRL nominal length lies within CACLM±50 mil =±1.27 mm | p187 Table 7-68 row 13/note 9, lines 8513/8530–8531; p186 definition, lines 8463–8488 | CACLM is the largest pad-to-pad Manhattan length among this class plus300 mil=7.62 mm. Require actual complete routes and the relevant topology accounting; skew-only checks are insufficient. |
| Main A1+A2 length ≤2500 mil=63.5 mm | p186 Table 7-68 row 1, line 8492 | It is a maximum, not the intended target. |
| CK/ADDR_CTRL A3 ≤660 mil=16.764 mm; A3 skew25 mil mirrored /125 mil=3.175 mm nonmirrored; AS ≤100 mil=2.54 mm, AS skew25 mil | p186–187 Table 7-68 rows 3–7, lines 8494–8497/8507 and notes4/5 | A3 concerns the two-device topology; do not invent that stub in the one-device topology. |
| CK AS+/AS− length ≤70 mil=1.778 mm | p187 Table 7-68 row 8, line 8508 | Named topology stub. **Not a general license for1.778 mm of arbitrary uncoupled differential routing**. No universal maximum uncoupled-length allowance was found in this DDR3 section. Preserve the solver's reviewed physical pair-spacing/coupling guards. |
| AT length500 mil=12.7 mm TYP; AT ADDR_CTRL skew100 mil=2.54 mm TYP; CK AT skew5 mil MAX | p187 Table 7-68 rows10–12/notes6–8, lines 8510–8512/8527–8529 | TI says AT length may increase for convenience but should be minimized; minimizing ADDR_CTRL AT skew is recommended, not required. Do not convert TYP values to hard maxima. |
| DQ byte nominal length DQLM0 /DQLM1 appears in the **MAX** column | p188 Table 7-69 rows1/2, lines8577–8578; layout extract retains columns | DQLMn is the largest Manhattan length for that byte. Preserve this literal source fact and flag applicability/accounting for review. Do not invent a ±tolerance, arbitrary meander allowance or silently ignore this row because a skew-only checker passes. |
| ADDR_CTRL-to-ADDR_CTRL and same DQ-class center spacing ≥3w | p187–188 Tables7-68 row16 /7-69 row7, lines8516/8583 | At existing w=.1016 mm, normal spacing=.3048 mm centers; equal-width edge gap=.2032 mm. |
| CK or DQS pair-to-other net and interclass DDR center spacing ≥4w | Tables7-68 rows14/15/18 /7-69 rows6/9, lines8514–8518/8582–8585 | Existing w=.1016 mm gives.4064 mm centers, equal-width edge gap=.3048 mm. BYTE0 and BYTE1 are different DQ classes. Pair partner spacing is set by differential impedance, not by4w. |
| Limited reduced-spacing exception | Table7-68 note10, lines8532; Table7-69 note8, line8593 | Center spacing may fall to minimum **for up to1250 mil=31.75 mm of routed length**. CK/ADDR note explicitly writes minimum(w); DQ note says minimum without assigning a new number. Respect actual positive physical copper clearance and impedance simultaneously. Count the union of exposed lengths per path; do not reset the allowance at every short segment/neighbor. |

Static geometry arithmetic was performed on the canonical native initial input
SHA256 `61b7d6fe3cd67cbe1c61272c81f6cd6732c01d1d9b83697d809709d99c3ece4e`:
largest command/clock Manhattan length=**16.0 mm**, DDR_A14/source_trace_39;
CACLM=**23.62 mm**, nominal range **22.35–24.89 mm**. Both byte Manhattan
maxima are **14.4 mm**. These are geometry references, not routed-length
results; the final replay must reproduce the same geometry before using them.
`native-manhattan.json` records every source-bound endpoint calculation.

For a **new opt-in routing input only**, the derived bus fields are
`BYTE0.maxLength=14.4`, `BYTE1.maxLength=14.4`,
`COMMAND_CLOCK.minLength=22.35`, `COMMAND_CLOCK.maxLength=24.89` (mm).
RESET has no invented nominal bound. Keep all existing bus/pair skew fields,
physical widths/clearances and frozen fixtures unchanged. Recompute these
values if the actual placement changes; do not carry them into a moved board
without a new pad-endpoint audit.

Length accounting remains explicit: TI's diagrams/text describe PCB routes
between device pins, including PCB package approaches. They do not specify
internal package delays, a via-barrel depth calculation, or the project's
1.6-mm transition convention. Existing solver `lib/route-lengths.ts` counts
planar XY centerline route length plus all same-net supplied fixed copper,
including owned escapes. Its documentation explicitly excludes via depth and
package delay. The bounds above are a source-derived **planar** constraint
proposal; the final PCB transmission-line/flight-time accounting still needs
review rather than being silently replaced by geometric via depth.

Current frozen pairs all retain edge gap **0.12 mm** and skew **0.127 mm**;
no `maxUncoupledLength` is provided. Original exterior coupling checks require
zero separated exterior intervals. At w=.1016 mm, their conservative miter
allowance computes maximum edge gap
`(w+.12)/cos(π/8)-w+.002 = .1402581115847945 mm`, with sampling error included.
The shared-section and full exterior checks serve different regions; a passing
annotation cannot hide an uncoupled exterior trunk. These are reviewed solver
geometry guards, not a TI impedance guarantee or a TI universal uncoupled limit.

TI does not mandate equal signal-via counts or exactly two signal vias. The
project's optional uniform-count search policy is separate: it makes both its
planar length model and its additional1.6 mm-per-transition geometric checker
capable of passing the unchanged.635/.127 limits. That bookkeeping is not an
electrical via-delay calculation and is not a TI rule.

## Impedance, dimensions and termination

Table7-62 (p175 lines8061–8078) lists routing feature4 mil and trace width4 mil
in **TYP** columns, escape land18 mil=.4572 mm TYP /20 mil=.508 mm MAX, hole
10 mil=.254 mm TYP. Note5 requires an18-mil land for the minimum-layer-count
via-channel escape. Existing source uses w4 mil, land18 mil and hole10 mil.
This is an exact-source observation, not a manufacturer capability guarantee.

Single-ended Zo is **50 Ω TYP,75 Ω MAX, MIN blank**. Nominal50 Ω/100 Ω is
the typical choice, not a universal fixed value. Each trace segment requires
the chosen Zo±5 Ω AC impedance control (Table7-62 row12); CK/DQS pair spacing
must produce **2×chosen Zo** (Tables7-68/69 respective pair notes). The source
does not state a separate numeric ±differential tolerance in these notes.
Exact laminate/copper/mask geometry, supplier-controlled impedance and pair
coupling are still required; an estimated isolated-trace impedance or nominal
board thickness cannot prove them. No general signal-neckdown waiver was found
in the audited section. DDR_VREF narrowing is expressly allowed, but that is a
different net and rule (§7.7.2.3.3.10, p179 lines8236–8242).

CK/ADDR_CTRL require the specified termination scheme (§7.7.2.3.3.9). Rcp is
Zo±1 Ω, Rtt is Zo±5 Ω, termination values uniform within the class; source
series termination at the driver is expressly disallowed (p187 Table7-68
rows19/20 and note13, lines8519–8520/8537–8538). DQ/DQS use built-in ODT;
external data termination is disallowed (p188 Table7-69 note2, line8587).
The one-x16 point-to-point schematic without VTT termination is shown by TI,
but TI explicitly requires signal-integrity analysis with the actual PCB
details before adopting it (p179 lines8230–8235). This audit preserves existing
components and does not assert termination/ODT qualification.

## Decoupling and return paths

- p177 Table7-64 (lines8130–8145): CPU VDDS_DDR and each RAM need at least
  two bulk capacitors and20 µF total each. Placement priority goes to HS
  bypass and DDR routing before bulk bypass.
- p178 Table7-65 (lines8153–8194): CPU at least20 HS capacitors /1 µF total,
  RAM at least12 HS capacitors /.85 µF total per device. 0201 package TYP,
  0402 MAX. CPU cap to nearest VDDS_DDR/VSS terminal ≤400 mil=10.16 mm,
  RAM cap to corresponding terminal ≤150 mil=3.81 mm. Three CPU caps should
  be underneath the CPU between the VDDS_DDR/GND clusters.
- CPU pad-to-connection-via35 mil=.889 mm TYP /70 mil=1.778 mm MAX;
  capacitor pad-to-via35 mil TYP /100 mil=2.54 mm MAX;
  RAM supply/GND pad-to-via35 mil TYP /60 mil=1.524 mm MAX.
- Each HS capacitor needs at least two connection vias (one supply, one GND);
  each RAM power/GND terminal at least one. **This capacitor rule is not
  exactly two vias per DDR signal.** Sharing exceptions are specified in
  notes7–9: extra capacitor may share only from opposite PCB side; same-side
  capacitor may share a RAM via with a wide connection shorter than150 mil;
  up to two pairs of RAM supply/GND terminals may share a via.
- §7.7.2.3.3.7.1 (p178 lines8195–8200) and Table7-68 note3 (p187
  lines8523–8524) require additional bypass when signal-layer transitions
  change the return reference between GND and VDDS_DDR. Use as many as
  possible and minimize signal vias. No numeric maximum return-cap-to-signal
  via distance is specified here; do not invent one or accept a remote cap
  merely because a supply net is connected.
- DDR_VREF is half VDDS_DDR, nominal20 mil=.508 mm trace with0.1 µF bypass
  near each device connection; narrowing allowed (p179 lines8236–8242).
  ZQ/VTP and actual power/reference wiring require separate source and
  physical checks.

## 400 MHz applicability and outstanding qualification

User-selected400 MHz yields tCK2.5 ns /800 MT/s. TI Table7-58 (p170,
lines7815–7821) permits tCK2.5–3.3 ns; Table7-60 (p174 lines8019–8031)
specifies a compatible DDR3-1600-grade device at tCK2.5 ns. One x16 part is
supported (Table7-59 and §7.7.2.3.3.1).

Micron MT41K256M16TW-107:P is the4-Gb x16,96-ball TW package. Frozen Micron
Table56 (printed p80, text3864–3876) allows **CL6/CWL5 at2.5–3.3 ns**;
its1.5-V note (line2371–2372) retains the same speed timings. Do not use the
1866-mode CL13/CWL9 at this operating point. Minimum tRCD/tRP13.91 ns,
tRAS34 ns and tRC47.91 ns give respective ceil bounds6/6/14/20 clocks at
2.5 ns; these are not register encodings or a full boot sequence. PLL/EMIF,
ODT, calibration, refresh/temperature and the remaining parameters need review.

No accepted Top/Bottom49 route, full-board connectivity, impedance control,
plane-return qualification, power integrity, electrical timing, programmed
DDR operation or measured shell fit is established by this audit.
**fabricationReady=false.** All frozen sources and tracked hardware remain
unchanged; only ignored research files were created.
