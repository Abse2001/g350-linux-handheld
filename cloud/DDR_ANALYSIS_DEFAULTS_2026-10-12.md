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
