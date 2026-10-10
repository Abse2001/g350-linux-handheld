# Connected DDR timing fallback with RAM ground restored

Fresh source 532, full KiCad 533 and Gerber 534 pass independent qualification
(wrapper exit 0). Source build exits 1 solely for two bus matching failures.
All 217 connections, 49 DDR signals, 298 ground ports, 1,032 numeric ports,
280 placements, four layers, RAM90 and 824 standard through-vias are retained.
Native physical checks, all-rule KiCad errors/warnings/opens/dangling copper and
all-layer Gerber shorts are zero; no rules or exclusions are suppressed.

| Bus | Native spread mm | Limit mm |
| --- | ---: | ---: |
| Byte 0 | 0.574882 | 0.635 |
| Byte 1 | 8.033572 | 0.635 |
| Command/clock | 18.300328 | 0.635 |

All differential pairs pass 0.127 mm. The earlier trial 497/515 stranded RAM
pins 92 and 94 despite passing native ground checks. Restoring one BA1 span
removes 7.2 mm of tuning and clears that independent ground open. Preserve this
qualified fallback; the constant-length neck repair is qualified separately.

Entry: `experiments/am3352-g350-full-board-integrated-ground-safe-timing-replay.circuit.tsx`.
Summary: `checks/integrated/g350-integrated-ground-safe-progress/summary.json`.

```bash
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-integrated-ground-safe-progress/connected-source-532-534-manifest.json
```

Native length uses 1.6 mm per transition and is not actual delay. Clock/stackup,
package and via delay, impedance/return paths, PDN/footprints, Linux and original
shell fit remain unqualified. **fabricationReady=false; do not order.**
