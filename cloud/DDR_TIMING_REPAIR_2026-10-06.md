# Rotated G350 DDR timing repair — 2026-10-06

The original user-reviewed 49/49 four-layer outcome remains frozen under
`checks/integrated/g350-ram90-ddr49/`, including the saved four-layer image.
All timing work uses separate source entries, caches and output directories.

The new candidate entry is
`experiments/am3352-g350-ram90-three-pairs-safe-replay.circuit.tsx`.
DQS0 and clock received checked tuning jogs. DQS1 was rerouted on outer layers,
normalized at its terminal barrel, shortened from 47.293576 to 31.324860 mm,
and its complementary strobe was lengthened to match. Existing inner-layer
routes remain; the board still has four copper layers and 139 standard vias.
These are geometry lengths including 1.6 mm per full-depth via, as used by the
native checker. They are not a substitute for package/stackup electrical timing.

A first DQS1 tuning jog passed all ten native physical checks but KiCad found
two 0.098724 mm via/track clearances, below the unchanged 0.1016 mm rule.
That candidate was rejected. The search now explicitly checks manufacturing
via/track clearance and shifts jog positions along their original segments.
The replacement passed independent KiCad manufacturing DRC with zero errors.
No checks, rule severities, tolerances or bus limits were weakened.

| Group | Original skew mm | Repaired candidate skew mm | Limit mm |
| --- | ---: | ---: | ---: |
| DDR_BYTE0 | 20.053810 | 20.053810 | 0.635 |
| DDR_BYTE1 | 29.681463 | 22.704895 | 0.635 |
| DDR_COMMAND_CLOCK | 19.919262 | 19.919262 | 0.635 |
| DDR_DQS0_PAIR | 2.554802 | approximately zero | 0.127 |
| DDR_DQS1_PAIR | 19.337830 | approximately zero | 0.127 |
| DDR_CK_PAIR | 4.085717 | approximately zero | 0.127 |

The checked pair lengths are DQS0/DQSn0 32.831524 mm, DQS1/DQSn1
31.324860 mm, CK/CKn 24.444104 mm. Three whole-bus skew failures remain.
The original 280 component placements are preserved from the rotated baseline;
power/reference copper and peripheral routing remain unfinished.
`fabricationReady` remains false.

The exact editable-source replay completed all 49 routes and retained all 280
component placements. All ten native physical checks, the added manufacturing
via/track guard, all-layer Gerber shorts and independent KiCad 49/49 connectivity
pass. KiCad reports zero manufacturing errors, 602 warnings and 499 reported
unconnected items (capped). The complete build correctly exits 1 with 881 open
ports, 70 missing traces and the three remaining whole-bus skew errors.

Evidence is `checks/integrated/g350-ram90-timing/summary.json`, native checks,
KiCad connectivity/DRC, execution metadata, source log and the new four-layer
image. `source-replay-evidence.tar.gz` retains the exact compiled source and
its frozen import graph. `timing-trials.tar.gz` preserves rejected/planned
geometry and its reports. Both hashes are recorded in the summary.

Replay after `source cloud/env.sh` into a fresh output directory:

```bash
node scripts/run-g350-ddr-phase.mjs experiments/am3352-g350-ram90-three-pairs-safe-replay.circuit.tsx dist/g350-ram90-timing-next G350_RAM90_THREE_PAIRS_SAFE_REPLAY 180 four-ddr 700
```

A separate whole-bus trial accepted 32 local 0.6 mm additions and reduced each
whole-bus skew by 0.6 mm; none meets its limit. Those additions are unqualified
for source promotion. Continue from the checked source candidate, then replay
and independently check any subsequent whole-bus repairs. Whole-bus incremental trials are separate diagnostic
outputs and must not replace a source-qualified candidate without full replay
and independent checks.
