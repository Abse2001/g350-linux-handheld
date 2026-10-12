Continue `experiments/am3352-g350-ti-top-bottom-ddr-v5-layout.circuit.tsx` for
the new TI placement/reference experiment. This is a fresh routing input,
not a completed board. The earlier checked 26/49 Top/Bottom checkpoint and
all frozen hardware evidence remain preserved. `fabricationReady=false`.

The board remains four layers and nominally1.6mm: Top signals, Inner1 GND,
Inner2 DDR_1V5 reference in the CPU/RAM region, Bottom signals. DDR is
restricted to Top/Bottom. Read `TI_DDR_ROUTING_RULES_2026-10-12.md` for the
TI source and complete requirements. Actual source has49 DDR signals:
48 synchronous signals plus RESETn; no extra50th connection was invented.
The0.635mm bus and0.127mm pair skew limits, all pin mappings,280 parts,
1161 original component contacts and runtime/checker pins are preserved.

Nine100nF decouplers move on Bottom to clear the routing corridor and improve
the documented package-center distances. A fresh V2 initializer exposed
five missing Bottom escape pairs near RAM9/RAM11. V5 revises RAM9 to
(-7,8.55) and RAM11 to(-5.65,1.8). Assigned supply/ground center distances
are at most3.461575mm, within TI's3.81mm RAM limit. Same-side courtyards
clear with a0.05mm comparison margin. Actual V5 initialization still needs
verification; the preceding failed diagnostic is retained.

One capacitor reference loop is now real source copper: RAM7 power via
(6.65,8.55), ground via(6.45,7.95), both standard0.4572mm lands/0.254mm
drills through all four layers. Its Bottom0.2mm stubs are0.629884mm and
1.518644mm, with orthogonal/45-degree segments. The initial V3 different-net
via gap0.128035mm failed the native0.150mm rule; the revised gap0.175256mm
passes. Exactly two signal vias is not a TI requirement; these are the two
separate terminals of this one bypass capacitor.

Verified on Linux with Node25.6.1, Bun1.3.14 and official KiCad10.0.6:

- Pinned Bun `tsci build --routing-disabled --disable-parts-engine` passes.
  Node launching `cli.mjs` failed before Circuit evaluation because its
  dependency uses a directory import; use the CLI's Bun shebang and source
  `cloud/env.sh`. No dependencies or native checks were changed.
- Exact source replay preserves the original932 traces/98 nets/8 buses,
  217 connections/1032 active contacts/298 original ground contacts and only
  the nine declared part moves. Two via pseudo-components/four endpoint
  aliases and two bypass traces are checked separately from that inventory.
- Project TypeScript and all17 native physical checks pass. The fresh source
  contains zero DDR carrier traces; its only copper traces are the two bypasses.
- Fresh KiCad export/load/serialization/refill verifies all1161 original
  numeric contacts, both full-depth vias and both RAM7 pad-to-via-to-plane
  connections. Both reference fills have one island at this partial stage.

The converter's two empty via placeholder footprints are removed only from
a new CAD copy; the two physical vias and all280 real footprints remain.
Refill reconstructs the source's0.12mm zone clearance and0.1016mm minimum
feature instead of the converter's0.15/0.25mm defaults. The raw export is
preserved. This is not proof that references remain continuous after DDR,
package power and peripheral copper are added.

Restore/review the hash-indexed evidence archive named by
`artifacts/g350-ti-layout-reference-2026-10-12.manifest.json`. It retains
fresh source/CAD, validation scripts/results, exact source closure and failed
export/reference revisions. The KiCad image/archive stays under ignored
`.cloud-tools` with the existing reconstructors.

Next: capture the V5 native input including both real bypass barrels/stubs,
verify native escape recovery, route all49 DDR signals with Bus Lanes,
qualify TI lengths/spacing/returns, connect every supply/ground and remaining
board net, then run fresh all-rule/all-severity CAD and all-layer shorts.
400MHz/nominal1.6mm are analysis defaults; exact manufacturer stackup,
impedance/electrical timing, firmware and measured shell fit remain open.
