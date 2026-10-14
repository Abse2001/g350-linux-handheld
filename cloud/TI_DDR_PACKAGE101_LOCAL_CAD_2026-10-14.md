# CPU/RAM local power copper: actual CAD follow-up

Fresh KiCad 10.0.6 CAD independently verifies all **101 package approaches and 64 retained capacitor loops**, reaching their owned full-through vias without reference planes. It preserves 280 footprints, 1,161 logical contacts, 1,165 copper lands including four plated lands, 129 vias and 165 trace records. The intended RAM25/HS8 GND junction is physically connected. This advances the [local source/native milestone](TI_DDR_PACKAGE101_LOCAL_APPROACHES_2026-10-14.md); it does not qualify the DDR interconnects or an order-ready board. `fabricationReady=false`.

| Actual Linux check | Result | Time / peak owned RSS |
| --- | --- | --- |
| Tested physical-via CLI, one fresh export | Passed | 10.204348 s / 873,058,304 bytes |
| Offline KiCad 10 inspector | Application passed; outer count gate failed | 21.867910 s / 52,662,272 host bytes |
| Separate readonly count derivation | Passed, reused existing CAD | 1.442794 s / 106,598,400 bytes |

The failed outer gate expected 168 segments. Exact source/raw/native UUID ownership proves **169: 65 retained HS segments plus 104 package segments**. The old constant overlooked the retained RAM7 GND two-segment dogleg. The separate successor keeps every other CAD predicate, refuses zero or native-coordinate-collapsed pairs, and proves each trace's segment geometry, layer, width, rail and UUID ownership. Minimum source segment length is 0.025 mm. The original failure remains preserved.

Only 129 source-owned empty via placeholders were removed from a fresh copy. All other raw bytes, including all **four physical zone expressions**, remain exact. Physical expression count is derived; it need not equal the two logical reference owners. No SaveBoard, refill or routing occurred. Every actual scope was collected with an empty owned process group, zero cgroup OOM deltas and unchanged source/dependencies. The offline Docker image/lifecycle also held.

| Exact evidence | SHA256 |
| --- | --- |
| Fresh raw CAD | 1e3ea7600823a42330ed22844dd2d3f79d9e3577416902e88d216b306da20d8e |
| Cleaned CAD | fbb7da9b879c36a0373ad33d9628ff6cf71f5755dd4d24013a3a38d1e257993a |
| Native CAD graphs | dc31c923903a019de2bc480edefde0114868b5a69abcab4d3ae9e76dd36a1408 |
| Derived-count Root collection | 422ecd4bb98416052ffe14657726d410b8e23b1927d341e44d793fdeb969160c |

The new data archive contains 43 regular indexed files, 5,951,821 logical bytes and 600,614 compressed bytes; SHA256 `3fc11f31e54df75241fb1f13b5400602b481cd10b86b77216d44a89baa63f7a4`. Payload hash/size/mode readback passed. Root fresh restoration created43 files, independently checked for hash/size/mode. Repeated restoration and verify-only passed; a differing file was refused before new writes. Live restoration verified43 existing exact files and created zero. See `TI_DDR_PACKAGE101_CAD_DATA_RESTORE_VALIDATION_2026-10-14.json`. These are data-only tests. The unchanged safe restorer preserves regular indexed data. Operational reconstruction also needs the prior 73-file package and 91-file HS archives and their ancestors; dependencies, images, models, credentials and authorization tokens are omitted.

Continuous filled references and return paths for the custom four-signal-layer arrangement, complete supply distribution, 49 DDR routing/timing/impedance, full custom-polygon geometry, full-board DRC and shell fit remain open. Frozen evidence and canonical hardware remain unchanged.
