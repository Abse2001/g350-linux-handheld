# Clean whole-board DDR middle shortcut — 2026-10-07

Continue `experiments/am3352-g350-clean-full-board-middle-shortcut-replay.circuit.tsx`.
Source 144, independent refill/export 145 and isolated Gerber 146 retain all
217/217 connections, all 49 DDR signals, 280 placements, RAM at 90 degrees,
four layers and 824 standard full-depth 0.4572/0.254 mm vias. Non-DDR trace
geometry, logical constraints and numeric port definitions are exactly unchanged;
derived pour annotations renumber on 102 trace records as fills change.
`fabricationReady` remains false; this is a checked continuation, not an order.

| Bus | Previous checked skew | New checked skew | Limit |
|---|---:|---:|---:|
| Byte0 | 34.278647 mm | 33.771477 mm | 0.635 mm |
| Byte1 | 37.400514 mm | 36.800514 mm | 0.635 mm |
| Command/clock | 28.530389 mm | 27.930389 mm | 0.635 mm |

D2's checked middle shortcut removes 0.507170 mm. Eight small native-checked
signal extensions from trial 131 are retained. All three differential pairs
still pass 0.127 mm. Native length includes a fixed 1.6 mm allowance per via;
it does not prove electrical delay or impedance. Full DDR timing needs the
requested target clock and manufacturer's actual four-layer stackup, plus
package/via delay, coupling and return-path qualification. These inputs remain
unspecified. Native whole-bus matching also remains unfinished.

Fresh editable-source replay completed in 480.469538 seconds, without timeout
or changed definitions. All three routing phases finished with zero phase
errors. The complete build exits 1 solely for three DDR bus-skew errors.
Full native checks on fresh source and the exact fresh-filled reconstruction
have zero other errors, including source width, connectivity, contiguity,
dangling, placement and strict via/track manufacturing clearance.

Independent KiCad 10.0.6 checks all 1,032 required numeric ports and every
multipart pad, including all 298 ground ports. All 217 connections pass.
Fresh fills on all four layers have zero DRC errors, warnings, unconnected
items or dangling copper. No rule is ignored and no per-item exclusion exists.
All-layer Gerber shorts exits 0. Previously checked assembly markings move only
from same-side Silk to Fab; exact footprint library identities are regenerated.

The current tscircuit package is 0.0.2759, rechecked against the registry.
Board runtime remains Core 0.0.2107 / CLI 0.1.2258 with all checker/solver pins
and reviewed checks SHA256 unchanged. Separately installed Core 0.0.2108
completed a 584.696650-second source replay: every record except project
metadata exactly matches checked source 123. It is retained as an isolated
upgrade trial and does not silently change the board locks. Typecheck passes;
all 25,814 original evidence files still match their frozen hashes.

## Rejected recovery and manual work

Trials 127/128/133 were stopped after approximately 51/47/30 minutes with
incomplete router models. Best model groups were 184/198, 182/198 and 162/198;
these model groups are not the 217 independently required connections.
Independent snapshot 134 of the branch-width trial has only 170/217 required
connections, 72 reported opens and three via-centering errors. It is rejected.
All inputs, best candidates, logs, stop records and geometry rasters are retained.

The detour planner now recognizes retained physical through-vias on all four
layers and supports existing middle-via spans, six transition budgets and
0.025 mm via sites. Actual clearance, full-depth-via and native checks remain
unchanged. Trial 139 passes all native physical/manufacturing checks and is
qualified by source 144/independent 145 above. Other direct/middle shortcuts
fail to find a useful shorter path or time out; they remain preserved.

D6's apparent long detour in 147 is rejected: its physical via lands bypass
parts of the routed length. Manual loop/landing repairs 149/150 still fail
self-short checks. Repair 151 removes the actual bypasses and passes native
physical checks, but shortens D6 to 20.038452 mm and worsens matching relative
to combined trial 143. It is not promoted. No checker was disabled to count
bypassed copper as usable timing length.

The exporter now resolves input/output arguments to absolute paths. This fixes
tsci double-prefixing a project-relative output path; the failed attempt and
successful real relative-path export are both retained. Stage-budget adaptation
still uses the pinned CLI and does not modify its installed code.

Machine summary: `checks/integrated/g350-middle-shortcut-progress/summary.json`.
Snapshot: `dist/g350-clean-full-board-middle-shortcut-verified-145/pcb-all-layers.png`.
Preserve every older checked checkpoint and frozen hardware source. Restore
only the checked source archive during normal startup; rejected recovery rasters
are preservation evidence and should not be restored automatically.

Restore checked source and trial evidence with:

```bash
source cloud/env.sh
python3 scripts/restore-g350-routing-evidence.py checks/integrated/g350-middle-shortcut-progress/checked-source-and-trials-135-152-manifest.json
```

The four rejected-recovery-127/128/133/134 manifests preserve stopped recovery
rasters separately and have passed member/hash validation. They are omitted
from normal startup. The exact saved Start bash block passes and performs no
hardware routing. All original checked checkpoints remain preserved.
