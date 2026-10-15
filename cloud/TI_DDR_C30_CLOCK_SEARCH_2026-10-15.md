# G350 clock-search diagnostics — 2026-10-15 UTC

The checked editable board remains **23/49 DDR channels connected, 26 missing**, with 98 dogbone vias. Neither clock diagnostic adopted copper or changed the board. `fabricationReady=false`; full routing, reference-plane and electrical-timing qualification remain open.

Both runs used the same current 49-request input (`631ac370…`) and unchanged c30 solver source (`c30fbbd1…`): clock pair `source_trace_33/34` on Inner1, 2,362 fixed copper primitives plus 98 owner terminal disks, and all original routing predicates. The earlier four partial public rails were excluded from hard copper as in the captured dense first-visit context. Limits remained 40,000 pair yields, 90 seconds and 2 GiB owned RSS; the allocation witness retained only its last eight events.

| Actual run | Outcome | Time / peak owned RSS | Meaning |
| --- | --- | --- | --- |
| 35, legacy first visit; tool 30459 | 40,000 yields; nonnatural cap; zero returned rails | 37.327178 s / 643,731,456 B | The diagnostic completed, but clock routing did not. All last-eight allocation events were legacy; compact fallback had not been reached. This is not a natural-null/no-route result. |
| 36, direct existing compact search; tool 64637 | 90-second wall stop; wrapper 2, child −15 | 90.283815 s / 528,244,736 B | No final diagnostic or raw pair result was written. Natural completion, yield count and returned carrier count remain **unknown**, not zero or a demonstrated 40,000-yield cap. |

Run 36 deliberately called existing `routeCoupledPair(input,pair,fixed,negotiation,false,true)`. It changed search order (`directCompactOnly=true`, `exactOriginalFull49Call=false`), while preserving geometry and predicates. Its witness observed 989 allocation events; all last-eight events were compact. Run 35 observed 2,916 events. These bounded witnesses describe search activity, not accepted routing.

Both tool sessions were collected. Recorded owned groups were independently empty and guard PIDs absent; OOM deltas were zero, and Source, both SDK trees, Git metadata and workspace free-space floors held. No clock pair was accepted. Preserve both outcomes; do not repeat an unchanged run or increase its limits without a new, evidence-based hypothesis.

Current c30 regression verification is green: **644 passed / 0 failed** across 189 files (649,237 expectations), plus **9 passed / 0 failed** focused controls with the DDR allocation observer disabled (117 expectations). The focused DQS0 pair returned naturally after 5,573 yields. This does not qualify the clock, full49 routing or all eleven benchmarks. The historical f940 benchmark had ten accepted cases and one `control-inner1` timeout; its unknown original wrapper status remains unknown.

The accompanying [JSON report](TI_DDR_C30_CLOCK_SEARCH_2026-10-15.json) records full source/receipt hashes, exact measured execution values, null unknown outcomes and repository-relative evidence locations. It contains no private authority or nonce. These reports were prepared with source/data reads only; the report author did not execute the SDK or router.
