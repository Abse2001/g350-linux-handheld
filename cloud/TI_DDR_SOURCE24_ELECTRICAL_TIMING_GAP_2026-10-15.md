# Source24 electrical-timing gap audit — 2026-10-15

Core39, Native41 and API42 prove 24 physical CPU-to-RAM routes; 25 of 49 requests remain missing. This audit changes no routing or checker rule. The existing loaded planar reports remain matched. Their 0.635 mm limit measures planar copper only, with zero length assigned to layer changes.

The user defaults are 400 MHz DDR clock (2.5 ns period; 1.25 ns DDR unit interval) and a 1.6 mm four-layer board. An exact manufacturer stackup, layer propagation, package delays, impedance and reference-plane qualification are unavailable. The following is geometric sensitivity, not electrical-delay validation.

Assume symmetric outer spacings h = 0.10 / 0.15 / 0.20 mm: Top depth 0, Inner1 h, Inner2 (1.6 − h), Bottom 1.6 mm. Each checked signal has two existing full-span barrels; active series distance is 2 × carrier depth. Thus Inner1 adds 0.20 / 0.30 / 0.40 mm; Inner2 adds 3.00 / 2.90 / 2.80 mm; Bottom adds 3.20 mm. Unused barrel portions are open branches and are excluded from series distance, but still need electrical modeling.

| Loaded cohort | Present/full | Checked planar skew mm | +vias at h=.10 mm | h=.15 mm | h=.20 mm |
|---|---:|---:|---:|---:|---:|
| DDR_BYTE0 | 5/11 | 0.527591 | 0.527591 | 0.527591 | 0.527591 |
| DDR_BYTE1 | 11/11 | 0.627102 | 2.963814 | 2.863814 | 2.763814 |
| DDR_COMMAND_CLOCK | 8/26 | 0.085443 | 3.085443 | 2.985443 | 2.885443 |

Loaded Byte0 is entirely Inner1, so equal vertical additions preserve its skew. Byte1 spreads from shallow Inner1 `source_trace_40` to Bottom `source_trace_26`; CA/clock spreads from Inner1 CK− `source_trace_34` to Bottom `source_trace_46`. Under all three illustrative assumptions their via-inclusive spreads exceed the 0.635 mm geometric reference. This does not turn the unchanged planar checks into failures and does not establish an actual TI timing violation.

| Differential pair | Actual carrier layer | Checked planar skew mm | Pair skew after equal vertical additions |
|---|---|---:|---:|
| DQS0 | inner1 | 0.047005 | 0.047005 |
| DQS1 | inner2 | 0.000000 | 0.000000 |
| CK | inner1 | 0.083221 | 0.083221 |

Both members of each pair use the same layer and depth, so this simple model preserves intra-pair skew. DQS0 and CK use Inner1; DQS1 uses Inner2. This does not require equal flight times between separate byte lanes. CA timing must use its clock relationship and actual layer delays.

Source14 exposes another gap: its Top portion is 9.941076 mm and its Inner1 carrier only 2.731371 mm. Other loaded Byte0 signals have approximately 1.131371 mm on Top. The 8.809706 mm difference in Top-versus-inner allocation can change delay even with the same total geometric length and via depth. No propagation velocity is assumed here.

Next, select the exact four-layer stackup and qualify a continuous reference/return path for each used layer. Compute per-layer and via delay plus CPU/RAM package delay, then tune actual cohort delays. Prioritize shallow Inner1 Byte1 `source_trace_40` against its deep peers and Inner1 clock against deeper CA signals; reduce layer/depth differences where feasible and rerun physical checks after every change. Preserve the checked Source14 route until a replacement is verified. Complete all 49 routes and full-cohort validation, then verify controlled impedance, via stubs/discontinuities, reference transitions and electrical margin.

No SDK, router, Core, native/API, CLI or CAD application was executed. All input SHA/size/mode bindings held before and after. `electricalTimingPassed`, `referenceQualified`, `all49Accepted` and `fabricationReady` remain false.

Evidence: Core39 `85c99a61…`, Native41 `601a7ead…`, API42 `8e7d3589…`; full hashes and per-signal scenario values are in the companion JSON.
