# Rotated RAM: 49/49 DDR connectivity candidate — 2026-10-06

The new editable entry is `experiments/am3352-g350-ram90-float-safe-replay.circuit.tsx`.
RAM is rotated 90 degrees; its bottom bypass capacitors moved to x=±8 mm and
ZQ resistor to (10, -7) mm to clear standard via escapes. All 280 components
remain. Four copper layers are used, with inner layers prioritized for data.
This is a signal-routing experiment, without qualified power/reference pours.
The existing default and all frozen evidence are unchanged.

Native bus_lanes bootstrap attempts hit search limits. Checked manual escapes,
four-layer carrier routing and negotiated rip-up completed the 49 CPU-to-RAM
signals. Route normalization removes redundant loops; snapping via landing
coordinates by less than 1e-8 mm prevents microscopic source-replay reversals.
The accepted output is actual editable-source replay, not a merged diagnostic.

Verified on the pinned runtime (tscircuit 0.0.2745, core 0.0.2095, checks 0.0.240,
capacity-autorouter 0.0.959; reviewed checks patch unchanged), with KiCad 10.0.6:

- 49/49 numeric CPU-to-RAM pad connections independently verified by KiCad.
- All ten native physical checks pass; all-layer Gerber shorts: zero.
- 139 full-depth standard vias, land 0.4572 mm / drill 0.254 mm, four layers.
- KiCad manufacturing DRC errors: zero. There are 602 warnings and 499
  reported unconnected items (the report is capped; this is not a total count).
- Native source errors remain: 881 unconnected ports, 70 missing traces,
  and six DDR length/skew failures. The overall build correctly exits 1.

| Group | Actual skew mm | Limit mm |
| --- | ---: | ---: |
| DDR_BYTE0 | 20.053810 | 0.635 |
| DDR_BYTE1 | 29.681463 | 0.635 |
| DDR_COMMAND_CLOCK | 19.919262 | 0.635 |
| DDR_DQS0_PAIR | 2.554802 | 0.127 |
| DDR_DQS1_PAIR | 19.337830 | 0.127 |
| DDR_CK_PAIR | 4.085717 | 0.127 |

The native checker includes 1.6 mm per full-depth via. Planar matching alone
cannot qualify these routes. A bounded manual length-tuning trial improved
some signals but did not pass all groups; it is not promoted. Native refinement
also failed its approach-corner precondition. No limits were weakened.

Evidence: `checks/integrated/g350-ram90-ddr49/summary.json`, native check output,
KiCad connectivity/DRC, source execution metadata, logs and the compressed
`source-replay-evidence.tar.gz`. Extract the archive to a new output directory
when continuing; it preserves the source import graph and the exact compiled
candidate. Its SHA-256 is recorded in the summary. Original frozen archives
are untouched.

Replay in a fresh output directory after `source cloud/env.sh`:

```bash
node scripts/run-g350-ddr-phase.mjs experiments/am3352-g350-ram90-float-safe-replay.circuit.tsx dist/g350-ram90-next G350_RAM90_FLOAT_SAFE_REPLAY 180 four-ddr 700
```

Next: restructure/match all DDR groups while preserving checked connectivity,
restore and validate power/reference copper, route remaining power/peripheral
nets, qualify package/via delays and impedance/return paths, and verify the
original shell dimensions. `fabricationReady` remains false. This candidate
is not a powered, timing-qualified, fully routed board.

## Saved four-layer image

The user-reviewed 49-signal image is retained at
`checks/integrated/g350-ram90-ddr49/ddr49-four-layer.png`. It draws actual
source copper, with each of the four layers shown separately. Recreate it with
`MPLCONFIGDIR=/tmp/g350-mpl XDG_CACHE_HOME=/tmp/g350-cache python3 scripts/render-g350-ddr-layers.py CIRCUIT_JSON OUTPUT_PNG`.
It is a routing-connectivity illustration; the original six timing failures
remain part of that frozen baseline. Timing repairs use separate candidates.
