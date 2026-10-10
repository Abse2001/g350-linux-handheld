# Connected G350 board with integrated byte 1 progress

Continue `experiments/am3352-g350-full-board-byte1-integrated-clean-replay.circuit.tsx`.
Fresh source 468, independent KiCad 472 and all-layer Gerber 473 verify all
217 connections, all 49 DDR signals, 298 ground ports and 1,032 unique numeric
ports. All 280 placements, RAM at 90 degrees, four layers and 824 standard
full-depth 0.4572/0.254 mm vias are preserved. The provisional outline remains
76 × 118 × 1.6 mm. Full physical/manufacturing checks, all-rule KiCad errors,
warnings, opens, dangling copper and all-layer shorts are zero, without rule
exclusions or ignored severities. Qualification wrapper exits 0.

| Bus | Native spread (mm) | Limit (mm) | Result |
| --- | ---: | ---: | --- |
| Byte 0 | 0.574882 | 0.635 | Pass |
| Byte 1 | 15.221372 | 0.635 | Unmatched |
| Command/clock | 24.150328 | 0.635 | Unmatched |

All three differential pairs pass 0.127 mm. Source build exits 1 solely for
two native bus-skew errors, with all three routing phases finished, unchanged
source definitions and no timeout or signal. Build elapsed 537.857 seconds.

Byte1 integration originally created three overlaps with matched byte0 copper.
Constant-length DQM1 and D4 repairs clear two conflicts without changing native
lengths or byte0 matching. Restoring checked D15 clears the final conflict;
restoring the full adjoining D9 fold removes its acute corner without a
self-short. Each retained repair runs unchanged complete physical checks and a
fresh locked ground fill. Cache 467 preserves the exact checked 49-path order;
only fresh source replay and complete independent checks establish this result.

The CAD delta diagnostic now skips annotation-only foreign route changes before
requiring DDR-only physical changes. It still refuses every actual foreign
copper change and verifies all track deltas, vias and placements. Diagnostic
466 passes all-rule DRC; source 468 / full qualification 472/473 independently
confirm the result. No native checker, constraint, CLI flag or DRC severity was
disabled. KiCad tools remain official Debian 10.0.6, and runtime/checker/solver
pins are unchanged from the preceding ac0dcaf checkpoint.

Native length adds 1.6 mm per transition and does not model electrical delay.
Byte0 has an 8.000 mm planar spread with 2–7 transitions; byte1 planar spread is
10.421372 mm with 2–6 transitions. Exact per-layer geometry and transitions are
recorded in source-bound `layer-lengths.json`. Target DDR clock, manufacturer
stackup/dielectrics, package and via/stub delay, impedance, coupling and return
paths remain unqualified. PDN/footprints, Linux bring-up and measured shell fit
also remain unfinished. **fabricationReady=false; this is not order-ready.**

The summary binds source/native/fill/numeric connectivity/DRC/Gerber/snapshot
hashes. Restore the checked archive with:

```bash
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-integrated-byte1-progress/connected-source-468-473-manifest.json
```

Preserve prior ac0dcaf / source443 and all original frozen evidence. Further joint
tuning 464 and D12/D9 rerouting diagnostics remain unqualified until source,
fresh numeric connectivity, all-rule DRC and all-layer Gerber checks pass.
Connection and saved environment draft20 are recorded separately in
`cloud/TIMING_CONNECTION_SAVED_2026-10-10.json`; configuration persistence does
not publish the environment or prove restoration in a new task.

Source SHA256: `429008fb7ebcfd1234d51c0b2be43963eee4cfef07c6413c77441d36c7d242ee`.
Fresh-filled SHA256: `1d3435522d2a707cc0a4267fb96d35e810175159ee9d96c2e9677cca7fabcd3b`.

The exact refreshed Start commands exit 0. The new 447-member archive passes
fresh/repeat/in-place restoration and refusal to overwrite a locally edited
member. The first Start retest failed for VFS container disk exhaustion; its
actual exit1/log are retained. Exact completed outputs and inactive cache bytes
were preserved by verified compression, restoring 3.4 GiB of headroom; retry
passes all runtime, upstream, KiCad/Python, frozen/checked evidence and geometry
controls. Install remains unchanged from tested draft19. Retain enough free
space before sequential VFS containers; do not restore large planning archives
during ordinary startup.
