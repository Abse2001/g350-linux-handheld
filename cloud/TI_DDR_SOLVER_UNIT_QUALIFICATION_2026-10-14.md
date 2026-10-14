# G350 solver unit qualification — 2026-10-14 UTC

The minimal coupled-handoff change and its separate test-memory change passed the complete unit invocation: **633 passed, 0 failed, 561,678 assertions across 186 files**. Root 39636 returned0 in170.367 seconds, with773,263,360 bytes peak owned RSS, zero OOM events, an empty owned process group, and unchanged source/dependencies. This establishes unit qualification. All-eleven benchmarks, the current49 DDR interconnect, electrical timing/reference redesign, and ordering remain unqualified; `fabricationReady=false`.

The private source is based on Bus Lanes commit `c1151212be7b9de4b34b07436d135d874e6c0466`. Runtime/test commit `c2b8b24efd96c789a17a58b8908aebc1043fbb53` changes exactly three paths:

- `lib/coupled-pair-routing.ts`: reject a coupled rail handoff only when its necessary planar length exceeds the existing remaining bus budget, including an allowance of up to three trace widths for bevel shortening. Search budgets and the final completion gate stay unchanged.
- `lib/coupled-handoff-length-bound.ts`: uncapped calls prune nothing; fixed terminal copper is included through the existing remaining-length API.
- `tests/coupled-handoff-length-bound.test.ts`: four focused cap, bevel, fixed-copper and mutable-input controls.

Separate private commit `9ee651ea2e403ba8d0b12b5f104fcd6fa04080c2` adds only the fourth path, `tests/grid-native-length-bounds.test.ts`. Its membership oracle stores the full Cartesian grid's X/Y coordinate sets instead of millions of serialized point pairs. The full reference grid, every clipped-point membership assertion, all six cases, route/work/geometry checks and original 5000 ms timeout remain. Solver grid behavior is unchanged. Both commits are unpublished. Installed pins remain Node 25.6.1, Bun 1.3.14, tscircuit 0.0.2821, Core 0.0.2107, CLI 0.1.2258 and board checks 0.0.242 with the reviewed native patch; benchmark dependencies remain on their separate locked pins. No lockfile or installed package changed.

| Completed scope | Actual result |
| --- | --- |
| Minimal canonical types/regressions, Root 97338 | Types0;33 tests passed,0 failed,226 assertions |
| Exact original c115 grid baseline, Root 63876 | Qualified diagnostic closure; test child1,5 passed/1 existing5000ms timeout,6 cases |
| First oracle scope, Root 21588 | Types0; all six native cases passed, large case2197.11ms; external witness failed its count requirement |
| Corrected oracle scope, Root 76172 |7 passed/0 failed,9920 assertions; independent parity covers1249 queries, preserving the >1000 requirement |
| Complete unit invocation, Root 39636 |633 passed/0 failed,561678 assertions,186 files |

The original successful typecheck is explicitly reused for the corrected witness/full suite because the 905 source files and native test block stayed identical. Only the external witness adds two real CPU/RAM pad-centered phase fields; its query count is 1249 = 961 + 144 + 144. The 633-test invocation includes three qualification-only original-generator parity witnesses, which are **not** in either private commit. The independent Cartesian witness runs in the focused scope, outside full-suite test discovery.

Earlier outcomes remain preserved: Root 88659 and7897 stopped at 1 GiB RSS without summaries; Root 5452 naturally returned632/1 with the original grid timeout; Root 11082 hit 2 GiB RSS and also recorded that timeout. Root 49187's5/1 baseline output remains unqualified for original guard conservation because metadata changed during its worker. Root 98211 failed the strict 24 GiB prefork reserve before any child. The measured successor uses 2 GiB owned RSS, 26 GiB shared threshold and 2 GiB reserve on the 32 GiB machine, with unchanged 60/300-second scope budgets and 5000 ms tests. Root 21588's actual 961-query failure and the earlier incorrect 1132-query description are retained, rather than lowering the assertion.

The broader V5 experimental source is excluded. Its historical 706-test pass does not erase its separate all-eleven case 2 timeout at 3600 seconds; the remaining nine cases were unrun and V5 remains disqualified. Earlier V5-based handoff qualification also retains its 701-pass/1-beforeAll-failure invocation and nine unrun bodies; later isolated success is not a single full-suite pass.

The full postaudit is `.cache/g350-canonical-prune-cartesian-oracle-witness-v2-fullsuite-successor-next/EXECUTION-postaudit.json`, SHA256 `86f775db328f11228f80a6c67a75de71de01b9e2ab0ea3f78ec640fc9d9efc19`. Its Root collection is `.cache/root-routing-progress/canonical-cartesian-witness-v2-fullsuite-COLLECTED-root.json`, SHA256 `9af2c5b06f751d9a89d28cf25f9d7f3161563d9ad48c3f4c0fcfd5b75bad2f06`. Paths are relative to `/workspace/bus-lanes-solver`.

The accompanying archive plan selects unit patches, helpers, witnesses and closed receipts/logs only. It is not built or restore-tested. Historical controls are evidence, not fresh execution authority. The frozen operational all-eleven controller `c6af2931…` is unchanged and has no benchmark acceptance recorded here.
