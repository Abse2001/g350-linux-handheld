# Fresh manual clock source and independent KiCad connectivity

The two DDR clock paths now reproduce in fresh editable source and pass the original native continuous-geometry checks and independent KiCad 10.0.6 connectivity checks. The remaining 47 DDR interconnects are missing from this source checkpoint. It is not a complete routed board; `fabricationReady=false`.

| Actual Linux scope | Result | Time / peak owned RSS |
| --- | --- | --- |
| Source capture 77605 | Passed | 4.251 s / 848,908,288 bytes |
| Strict types 61948 | Passed | 38.804 s / 1,850,462,208 bytes |
| Fresh Core 41840 | All 37 controls passed | 49.243 s / 1,486,913,536 bytes |
| Native/original clock API 42626 | Passed, all 18 physical checks zero | 16.254 s / 819,253,248 bytes |
| Pinned CLI export 87907 | Passed | 10.188 s / 920,604,672 bytes |
| Offline KiCad 94957 | CAD child passed; outer negative-expectation gate failed | 28.191 s / 56,553,472 host bytes |

Clock planar lengths, including the actual local Top fanouts, are 21.174700 and 21.087924 mm: skew **0.086777 mm**, below the original 0.127 mm pair limit. Each uses two genuine full-through barrels with active Top/Inner1 transitions. No synthetic via-length marker supplies matching credit. Electrical delay remains unqualified.

The fresh source retains all 49 original logical DDR connections and 98 named nets, 280 hardware components, 1,161 contacts, 225 genuine vias, 165 retained reference paths and 96 signal Top fanouts. Four duplicate clock fanouts are explicitly suppressed. This is a **manual-source fork**: three public Bus representations preserve the serialized original pair membership/skew, while the original DifferentialPair properties and 0.12 mm gap are retained by an inverse proof and the original continuous-check API. Automatic Core SRJ differential-pair discovery is not equivalent and must not be used for this fork.

The raw CLI export declares the 96 signal vias as net 0. Actual `pcbnew.LoadBoard`/`BuildConnectivity` assigned their authentic nets from connected copper: all 96 numeric pad/Top fanout/via nets agree, all 96 pad-to-via connections pass, and both clock paths connect their real CPU and RAM pads. Reference vias also have nonzero nets. The strict CAD child exited 0. The Root outer guard expected a negative net-0 diagnostic and therefore exited 2; the failed expectation, original post-audit and positive CAD observations are preserved separately. No export-ownership adapter was run or adopted. No raw Source/export bytes were rewritten.

KiCad inspected a separate zone-free diagnostic copy, removing only four zone spans while holding every footprint/via/segment expression byte. Its inventory is 505 footprints (280 hardware plus 225 empty via placeholders), 225 physical vias and 461 segments across four copper layers. No SaveBoard, refill or all-rule DRC was performed. Source and complete board/solver dependencies held, all owned host processes and the offline container were removed, and cgroup OOM deltas were zero.

| Exact evidence | SHA256 |
| --- | --- |
| Fresh Core raw | 7793a13abbc457569cb15c1a9bc549ce585dbd75ac85acd6e384441557075c06 |
| Core controls | 661c4ae8def5022f06a51ffdb1dbbee7ab9de7cbc12c2086bbe57c6911aa1138 |
| Native ownership/physical report | 55f3b2a9629532e24d74ad3527e155d9491a921b7a6253a6e51d192597a2a159 |
| Original fresh KiCad export | 540b9d2c5259a06e18f0be3706fe818fd86db444ed431ef7997c772998aa36d7 |
| Actual narrow KiCad report | c96541c82f98c6844c1c194e5eaa7e7f62277ae7ff9b214025c0c7e55c386fbd |
| Actual CAD collection | 95c4462595710d909d90481bf7377416873f05bf79c6506920b682e9061620fa |

The separate 314-file Source/data archive preserves capture, types, Core, Native and CLI evidence. Root independently tested fresh restoration, every hash/size/mode, repeat, verify-only and seven conflict/corruption cases plus seven unsafe paths. The exact tracked command verified 314 existing files and created zero in the prepared filesystem. Read `TI_DDR_CLOCK_MANUAL_SOURCE_DATA_RESTORE_2026-10-14.md` and its validation JSON. Dependencies, resolver symlinks, vendor models and KiCad image are reconstructed separately; historical authorizations are evidence only. CAD data will be retained separately without modifying the sealed Source/data archive.

The user permits DDR on all four signal layers with redesigned references. Full 49-signal routing/matching, continuous reference coverage and return paths, electrical/package/via timing, impedance, complete power distribution, whole-board DRC and exact shell fit remain open. Frozen evidence, hardware sources, runtime pins and reviewed native checks remain unchanged.
