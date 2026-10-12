# DDR analysis targets selected by the user

On 2026-10-12 the user selected the offered documented defaults: a **400 MHz
DDR clock** and a **1.6 mm, four-layer JLCPCB board**. Continue the current
request with DDR signal wires on **Top and Bottom only**. Inner layers remain
available for reference planes and other board connections.

At 400 MHz the clock period is 2.5 ns; DDR transfers occur on both edges,
giving an 800 MT/s transfer rate and a nominal 1.25 ns interval between edges.
These values define the analysis target. They do not establish the programmed
AM3352 DDR PLL/EMIF configuration or available setup/hold margin.

Retain the existing routing limits: 0.635 mm total copper length skew within
each matched bus and 0.127 mm within each differential pair. Include fixed
package fanouts in matching. The board checker's 1.6 mm per layer transition
is geometric accounting; use a qualified stackup and package/via delay model
for electrical timing.

The exact JLCPCB laminate construction, copper thickness, impedance guarantee,
reference continuity and propagation delay remain to be qualified. A nominal
1.6 mm overall thickness does not select those details. Earlier research is
retained under ignored `.cloud-tools/ddr-settings-research/`, including official
JLCPCB stackup/calculator inputs and frozen TI DDR guidance.

No new routing is imported by this record. The latest checked Top/Bottom board
checkpoint remains 26 of 49 DDR connections. Complete solver output, fresh
editable source, full native/KiCad/Gerber validation, electrical timing and
shell fit remain required. **fabricationReady=false; the board is not ready
to order.** Earlier documents describe the assumptions known at their own
timestamps; this record supersedes their unselected-clock statement.

The selected source parts are AM3352BZCZ100 and MT41K256M16TW-107:P, powered
from DDR_1V5. Frozen `reference/am3352/am3352.txt` lines 8019–8031 specify
the compatible memory speed grade at a 2.5 ns clock period; frozen
`reference/am3352/micron-ddr3l.txt` lines 3864–3876 explicitly permit
**CL6/CWL5 at 2.5–3.3 ns**. Micron's same-speed timing note covers 1.5 V
operation. These documents support the analysis target. Do not copy the
part's 1866-speed CL13/CWL9 settings into the 400 MHz operating point.

At 2.5 ns, rounding the documented minimum durations upward gives tRCD/tRP
at least six cycles, tRAS fourteen and tRC twenty. These are arithmetic
bounds, not EMIF register encodings or a complete initialization sequence.
Refresh, ODT, calibration and the remaining timings still need review.

Evaluate exact JLC04161H-3313 and JLC04161H-1080 templates with the existing
0.1016 mm width and 0.12 mm pair gap before selecting a stackup. A local
finite-copper/mask model can estimate impedance and delay, but cannot provide
a manufacturer's impedance guarantee. Check TI reference-plane and long-run
spacing rules separately from minimum physical clearance. The independent
source-bound review is retained in ignored
`.cloud-tools/ddr-settings-research/defaults-independent-review/`; its report
SHA256 is `68b9b70b21f51c7fee8357968165d405f9586f51a76e2a869e53b0696a4353c8`.
