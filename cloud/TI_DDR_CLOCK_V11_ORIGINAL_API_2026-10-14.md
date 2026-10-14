# Actual clock-only original solver API check

The V11 clock candidate passed the unchanged solver geometry functions in actual
Root tool session **50372**, exit **0**. This is a two-clock planning result,
not an accepted 49-signal route, fresh Core/CAD result or electrical timing pass.
`fabricationReady=false`.

| Clock | Inner1 carrier | Both fixed Top stubs | Whole planar length |
| --- | ---: | ---: | ---: |
| DDR_CK / source_trace_33 | 20.043329344 mm | 1.131370850 mm | 21.174700194 mm |
| DDR_CKn / source_trace_34 | 19.956552719 mm | 1.131370850 mm | 21.087923569 mm |

Pair skew is **0.086776625 mm**, below the unchanged **0.127 mm** limit. Both
clock lengths lie within the selected CA planar window of **20.95–23.49 mm**.
Full-path and segment visibility, self-clearance, conventional angles, shared
and exterior pair spacing, coupling and the clock-only length/window checks
passed. The physical input retains all 26 CA requests, 1,298 obstacles, 261
fixed traces and all three differential-pair definitions. The qualification
view deliberately selects only the two completed clock signals; the other DQS
pairs and complete CA cohort remain unqualified.

The explicit clock-only reporting helper is bound by source manifest
`b80647c2d81cf24d28d3ffd38c6226f4a5ba0ed35731570845cc664c624e8492`.
Its original engine functions were unchanged. Source and installed solver SDK
were verified before and after execution. The application took **0.235723 s**,
used **65,167,360 B** peak owned RSS, had zero OOM events, and its owned PGID
**366701** was empty afterward.

This short, read-only check explicitly overlapped the known long benchmark
session 42982. It used a 60-second / 512-MiB child budget, a 30-GiB shared-memory
threshold and a 1-GiB prefork reserve. The long benchmark was still active and
was never claimed collected. The original session 3786's wrapper failure on
unrouted DQS rows and session 47950's earlier 26-GiB prefork refusal remain
preserved in the prepared filesystem; neither is rewritten as a pass.

Exact copied result, execution audit and actual Root collection are under
`checks/integrated/g350-ti-ddr-clock-v11-api-2026-10-14/`; `manifest.json` binds
their bytes. The copied Root audit SHA256 is
`897161ece178a37ab983612d9dca66af896afba7441454140643f5ee22091a09`;
the actual execution postaudit SHA256 is
`31672c711037854dcf23295b7ce047418ad0fdedf86902cd55bb8a50296ac4d1`.
These are historical DATA, not a self-contained runtime restoration archive.

The source-only clock fidelity proposal retains the original logical clock IDs,
uses real Inner1 ports on the existing barrels and assigns three PCB paths to
each original clock. Actual Source capture, type checking, pinned Core,
numeric connectivity, manufacturing checks and KiCad 10 remain required. Two
physical Top-to-Inner1 transitions per clock remain separate from planar length;
the historical 1.6-mm route-marker model is not an electrical delay model. See
[the all-four-layer electrical report](TI_DDR_ALL_FOUR_LAYER_ELECTRICAL_SCREEN_2026-10-14.md).
