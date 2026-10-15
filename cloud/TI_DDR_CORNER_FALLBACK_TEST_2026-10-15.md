The checked board remains **23/49 DDR connections, with 26 missing**. No new copper was adopted. This report records a reproduced Bus Lanes failure and an interrupted proposed fix; it does not establish a working fix.

The focused regression uses the exact current full-49 input, SHA256 `631ac37009bb602a3a1e67d3ffe7a932669e38ee372d60b29ce196d3c76ddd6d`, with 263 fixed traces and 1,298 obstacles. It asks the original coupled-pair API to route DQS0 on Inner1, then checks endpoints, width, continuous clearance, self-clearance, declared spacing/length reports and the public validator for that explicit two-route subset. Full-49 routing and electrical timing remain separate requirements.

| Actual run | Result | Wall time | Peak owned RSS |
| --- | --- | --- | --- |
| Baseline 3801 | 2 tests passed; DQS0 regression failed as expected. Search naturally returned null after 5,568 yields. | 7.737 s | 428,097,536 bytes |
| Corner fallback 86792 | Interrupted at the unchanged 1 GiB limit before the pair returned. No completed test counts or pair result. | 21.629 s | 1,080,479,744 bytes |

The baseline's two passing controls compare successful legacy geometry/yields for both negotiation modes and verify that a failed input without a package field does not repeat identical work. The baseline failure is recorded as failed tests, not as a passing routing result.

The proposed change adds four package-corner handoff choices only after the legacy search naturally exhausts. One retry flag prevents recursion beyond that fallback; existing successful results, cancellation and all routing limits are preserved. Only `coupled-pair-routing.ts` differs among the 120 candidate library files. Independent source review found no blocking correctness issue, but execution did not prove the hypothesis.

The owned-memory guard stopped the proposed child with SIGTERM at 21.464 seconds; child exit was -15 and the wrapper exited 2. Both runs had zero OOM events, closed their owned process groups and preserved the source and pinned board/solver SDK inventories. The next step is to investigate search memory and candidate selection before another run. The 1 GiB test guard has not been raised, and the interrupted proposal has not been submitted as a fix PR.

Exact source/test/guard hashes and run receipts are recorded in the adjacent JSON. Full regression benchmarks, successful routing images, editable-source replay, native checks, fresh KiCad validation, reference planes and electrical timing remain unfinished. Existing strict-axis failures and the unset uncoupled-length bound also remain open. **fabricationReady=false**.
