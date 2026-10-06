# Rotated RAM / inner-layer DDR experiment

User-directed change: rotate RAM 90 degrees and use a four-layer board with
Inner1/Inner2 primarily carrying DDR signals through native bus lanes routing.
This supersedes the former outer-only DDR routing requirement for this experiment.

Editable entry: `experiments/am3352-g350-ram90-inner-ddr.circuit.tsx`.
The RAM remains at (0, 0), on Top, rotated 90 degrees. Its footprint becomes
12.42 x 6.82 mm. R_DDR_ZQ moves to (10, -7) to clear the rotated footprint.
All other placed components, logical DDR mapping, bus skew limits and pair
limits are retained. Old RAM power and DDR route caches are not reused.

DDR buses are restricted to Inner1/Inner2. Each native phase runs the installed
core BusLanesPipelineSolver, with standard through-vias, smooth tuning and a
bounded search. The existing shaped outline remains on the editable board;
the native pipeline uses a rectangular search domain, so outputs require
independent shaped-outline checks before acceptance.

Ground reference pours move to the outer layers. They are provisional; the
old inner DDR supply plane is removed from this experiment. DDR supply
routing, outer ground continuity, return paths, impedance and stackup timing
require new qualification. This is a new stackup experiment, not an electrically
qualified replacement for the old checked board.

The phase runner now accepts explicit `inner-ddr` as its fifth argument, while
retaining its outer-only default assertions for all prior experiment calls.
It reports `innerPlanesReserved:false` for this policy.

Initial runs detected the ZQ placement collision and correctly skipped routing.
Preserved diagnostics: `dist/g350-ram90-inner-ddr-20261006` and `...-02`.
Corrected source replay: `dist/g350-ram90-inner-ddr-20261006-03`.
Typecheck and runtime/hash assertions pass. Fabrication readiness stays false;
the accepted default is preserved until the new source passes full checks.

Corrected source reached native bus lanes byte0 with 11 connections, 1,257
physical pad obstacles and zero prior traces. It timed out at 73.352 seconds
without completed routes. The preserved board source-and-PCB debug artifact
proves the new placement; it is a pre-routing layout, not a completed board.
Source definitions stayed unchanged during this corrected run. No new DDR
channels are qualified and the default has not been replaced.
