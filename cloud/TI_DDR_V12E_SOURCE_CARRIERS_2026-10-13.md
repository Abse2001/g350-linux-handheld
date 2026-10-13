# V12e source, carrier and closed-routing checkpoint

No new complete 49 DDR interconnect is accepted; the board is not ready to order and `fabricationReady=false`. DDR may use all four physical layers under the user's latest instruction. Reference redesign and timing remain open.

The actual V12e author source moves one Bottom RAM decoupler and its two existing full-through reference vias/stubs rigidly +1.4 mm X. All 280 parts,49 CPU/RAM signal contacts, original logic and constraints remain. Fresh pinned Core geometry `0e2ce064…` passes all 17 unchanged native placement/reference checks. Its first strict forward comparison failed; a separate pure successor proved the two changed CAD URL strings resolve to identical preserved assets and the two existing antipad rings follow their vias. The failed comparison stays preserved.

| Completed scope | Result | Limit |
| --- | --- | --- |
| V12e actual source/native17 plus narrow parity | Pass | Placement/reference checks, not 49 routed channels |
| E local dogbones, four frame orientations | All 49 individually and jointly; 76 via records | Local escapes only |
| C local dogbones, four frame orientations | All 49 individually and jointly; 96 via records | Local escapes only |
| C actual React carrier metadata | Pass | Only BYTE0 Top→Bottom and RESET Bottom→Top allowed/preferred lists change; existing geometry/native17 reused |
| E public routing with D carrier assignment |1200-second wall stop; no natural output | Source/dependencies held, zero OOM, owned group empty |
| Private selection observer |43 controls per engine pass on Node/Bun |73 original calls and132 published rows per engine; these controls do not qualify a new producer origin or routing benchmarks |

The E routing tool session was lost during a transport interruption. Its terminal state is recovered from the completed guard postaudit; the tool-wrapper exit was not returned and is not invented. The earlier D local-fanout natural failure remains separate. Neither failure proves physical infeasibility.

The new C carrier sidecar is `786455d8…`; the broad physical input remains `426114af…`. C keeps command/clock on Inner1 and byte1 on Inner2; byte0 uses Bottom and reset uses Top. Actual final-tree comparison checks every other prop/type/key/child unchanged. Core's known omission of bus layer metadata is explicit; no fresh C Core/native measurement is claimed.

Runtime remains Node 25.6.1 / Bun 1.3.14 / tscircuit 0.0.2821 / Core 0.0.2107 / CLI 0.1.2258 / checks 0.0.242 with the reviewed native patch. Full routing, TI class spacing/exposure, continuous references/returns, controlled impedance, PDN, electrical timing,168 remaining non-DDR routes, complete CAD and manufacturing checks and exact shell fit remain unfinished. The Core-to-CLI physical-via boundary needs actual raw-Core-case qualification before full 49 export acceptance.

The accompanying hash-indexed archive preserves immutable source and completed evidence only. New active producer files, changing status/checkpoint files, installed dependencies, credentials and protected local edits are excluded. Archive/root restoration and updated Start are not yet tested; historical absolute controllers and old launch receipts are evidence, not new execution authority. See the validation JSON and archive proposal for exact hashes and restoration limits.
