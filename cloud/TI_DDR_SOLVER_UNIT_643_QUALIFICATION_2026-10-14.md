# G350 solver unit and constructor qualification — 2026-10-14 UTC

The stacked Bus Lanes candidate passed the normal complete unit invocation: **643 passed, 0 failed across 189 files**. Root 3987 returned 0 in **132.284979 seconds**, with **786,661,376 bytes** peak owned RSS, zero OOM events, an empty owned process group, and unchanged source/dependencies. This qualifies the recorded solver source for unit correctness. The original eleven-case baseline stage is running at documentation time; candidate/comparison and all-eleven acceptance remain pending. Current 49-signal DDR connectivity, timing, reference-plane redesign and board ordering remain unqualified; `fabricationReady=false`.

The unpublished private stack starts at canonical Bus Lanes `c1151212be7b9de4b34b07436d135d874e6c0466`:

| Commit | Change | New changed paths |
| --- | --- | ---: |
| `c2b8b24efd96c789a17a58b8908aebc1043fbb53` | Necessary coupled-handoff length bound, preserving bevel allowance and final acceptance | 3 |
| `9ee651ea2e403ba8d0b12b5f104fcd6fa04080c2` | Cartesian X/Y membership oracle instead of millions of serialized point pairs | 1 |
| `3673861b82e2459508e934e0d28c0efdc05e9b3e` | Include domain count in the compatibility-cache key; four regressions | 2 |
| `3249dc4112387bf3b6cce15c1b2b03727607fafe` | Exact scalar point/rectangle clearance; three oracle regressions | 2 |
| `d7f7c1254d34dfdd2853f069d7277c79ce6ebf5e` | One-pass scalar outline raster clearance, hot grid call and three oracle regressions | 3 |

There are eleven changed paths in total. The 908-file qualification source includes **three qualification-only original-generator witnesses outside the private commits**. The 643 result is this actual invocation, not a separately run private-tree suite.

The cache fix separates an empty assignment `[]` from a missing candidate domain `[[]]`. Regression oracles retain both query orders, the default and explicit budgets, and public unresolved-selection behavior. Search budgets and conflict checks stay unchanged.

Outline rasterization was the material constructor bottleneck: the full native grid checks 3,633,468 cells against 14 perimeter edges. The new scalar entry computes each original edge projection once, preserves winding, epsilon, clearance/NaN decisions, live vertices and custom-predicate fallback. Existing public geometry methods remain unchanged independent oracles.

| Completed scope | Actual evidence |
| --- | --- |
| Fresh outline types/focused checks, Root 28510 | Both application steps returned 0; 30 passed/0 failed across 8 files. Original guard returned 2 and qualified false because it expected 28, missing two loop-generated pipeline cases. |
| Separate count correction | Metadata-only receipt preserves original guard 2/false and interprets the same genuine closed application execution. No application rerun. |
| Exact 69-file prefix plus native cases, Root 78560 | 228 passed/0 failed across 70 files; reference constructor **876.988797 ms** versus **4497.473849 ms**, approximately **5.13× faster** in this observation. |
| Complete normal suite, Root 3987 | 643 passed/0 failed across 189 files. |

The phase observation retains the same full/clipped grids (3,633,468/9,801 cells), original assertions and 5000 ms timeout, identical solved routes, nine expansions and one completion call for each search. Logging can perturb timing; this is a measured constructor comparison, not an all-eleven routing benchmark. The earlier rectangle-only change passed correctness but improved this envelope by only 0.26%, which is noise.

Earlier 637-test invocations remain preserved at 635/2 and 636/1. The nine-case isolated old/new comparison was a focused subset, not a complete-suite pass. The [633-test report](TI_DDR_SOLVER_UNIT_QUALIFICATION_2026-10-14.md) and its archive remain intact, including resource stops, query-count failures, the guard-edit race and V5 all-eleven disqualification. Later success does not rewrite those outcomes.

Evidence paths below are relative to `/workspace/bus-lanes-solver`:

- Full: `.cache/g350-canonical-outline-raster-fullsuite-sourceonly-next/EXECUTION-postaudit.json`, SHA256 `8190819345c2906436d2407dfa383080bb11655720c044184bf00759f45a56c2`; Root collection `.cache/root-routing-progress/outline-scalar-fullsuite-COLLECTED-root.json`, SHA256 `79df921e70c3561cb93b3cb1fcf6f8935d6365fb2a4c2630656dc580ed44fdbd`.
- Corrected focused metadata: `.cache/g350-canonical-outline-focused-count30-metadata-correction-sourceonly-next/COUNT-CORRECTED-postaudit.json`, SHA256 `fe7c3fc82d21b5ad8704326459c4e6e484d714475338966707160dbc332f9fa0`.
- Phase: `.cache/g350-canonical-outline-raster-prefix-phase-count30-sourceonly-next/EXECUTION-postaudit.json`, SHA256 `fa9403a325803fa39b0048199593700c1aee6154841e5284bc96e86cbd3e6725`; Root collection `.cache/root-routing-progress/outline-scalar-prefix-phase-COLLECTED-root.json`, SHA256 `c759002e702f02184901c2b1a556690d54970fc9b8ee8598a3baab254b1591b3`.

Installed Node 25.6.1, Bun 1.3.14, tscircuit 0.0.2821, Core 0.0.2107, CLI 0.1.2258, board checks 0.0.242 and reviewed native patch `1a8af494…` remain untouched; separate benchmark dependency pins also remain fixed. No lockfile, hardware source, frozen evidence, accepted board, fabrication status or installed runtime was changed. Source adoption and pushing have not occurred. DDR on all four layers still requires the requested reference-plane redesign and electrical qualification.
