# Physical via export validation on Linux

Validated 2026-10-13 on Debian 13 with Node 25.6.1, Bun 1.3.14 and retained official KiCad 10.0.6 / pcbnew 10.0.6+dfsg-1. Board runtime remains tscircuit 0.0.2821, Core 0.0.2107, CLI 0.1.2258, checks 0.0.242, props 0.0.695 and Circuit JSON 0.0.520, with unchanged lockfiles, reviewed native checks and all eleven pinned inspection references.

Core deliberately omits physical via.layers from persisted logical route points; their separate pcb_via records retain full physical spans. The pinned CLI previously rebuilt another narrower logical via beside the through-via, producing duplicate XY/net/dimensions/UUID. The new isolated exporter preserves explicit layers and, when they are absent/empty, inherits only a uniquely corresponding existing physical via span. Matching requires a known net ownership, exact XY, explicit projected dimensions and a native physical interval covering the logical endpoints. Ambiguity is refused. Net/dimension-aware deduplication prevents foreign records from merging. The original layer conversion and complete final serialization body are unchanged; frozen JSON is never normalized.

## Actual results

- The new single-file portable constructor passes fresh/repeat/verify. All **25 source-method controls pass**, covering explicit/missing/empty metadata, endpoint-only full spans, blind ranges, foreign/unknown nets, coordinate/land/drill mismatches, ambiguity, connected-source-net fallback, missing/nonfinite dimensions and conflicting aliases. These tests use the actual copied stage source with constructor-time net map/layer count unset.
- A **fresh actual pinned Core render passes** in 1.869327 s. Two Top-only SMT pads at ±3 mm connect through two full-span .4572/.254 mm vias at ±1.5 mm and an Inner1 .1016 mm carrier. Saved route points demonstrably omit.layers; separate native via records retain all four layers, dimensions and ownership. No pcb_trace_error is present.
- **Four raw CLI exports pass**, in 30.763947 s. The original/new export pair consumes that exact untouched Core JSON. Original output has four raw vias; new output retains precisely the original two through-via blocks, with all remaining file bytes unchanged. New-resolver absent/empty route-only exports are whole-file byte-identical to previously completed original baselines. All four exporter exits are recorded as zero.
- **KiCad 10 read-only inspection passes**, with exactly two full F.Cu↔B.Cu THROUGH vias, unchanged coordinates/dimensions/UUIDs, two Top-only SMT pads, three exact Top/Inner1/Top segments and one common nonzero net. Physical pad-to-pad and pad-to-both-vias connectivity pass. No normalization, SaveBoard or refill occurs.

All scopes preserve source/fixtures/prerequisite results and the complete board dependency tree ce3d0f53: 16,975 files, 570,741,826 bytes, 26 links and 1,820 directories. Constructor/Core/raw scopes use the existing budgets and finish with zero OOM and empty owned groups. The native wrapper finishes in 25.368602 s; host peak RSS is 50,589,696 bytes. Its host guard does not establish Docker daemon/container RSS limits. Existing read-only/init/tmpfs wrapper policy and exact image identity remain unchanged; no same-image container remains afterward.

Earlier explicit-layer-only patch 557013be passed eight tiny raw/native controls and three route-only comparisons. Those are preserved historical results, not proof of the missing-layer Core boundary. Its initial six-export worker remains failed at 60.441489 s: four exit0 receipts and a fifth raw file with unknown terminal result. A separate two-export successor completed the unfinished full-span pair and all three comparisons in 14.224520 s. No prior exit or whole-scope pass is inferred. The new actual Core boundary tests above supersede that incomplete adoption proposal.

## Evidence and integration

Ignored packets are retained under `.cloud-tools/ti-ddr-cli-physical-via-native-record-resolver-next` and `.cloud-tools/ti-ddr-cli-native-record-kicad-control-next`. Earlier explicit-layer packets and failed/partial runs remain intact.

| Record | SHA256 |
| --- | --- |
| Tested new portable helper | fa7faca3fd0b5f95026707e243c7f8037359d2c8212dffeedebed77441f9dba4 |
| Constructor and 25 controls collection | 22924247017224357f085fd38daecf261c888bfe82627b646aa0e0aaa5a03eb0 |
| Actual Core collection | d96cab8c98a647472e6c8246b57ea8375a78c3ae79204eb9100d93a983096ceb |
| Raw export collection | 0592abee5cf8ce05c4f335c940ce23304e2e6d5332ca77ce95edbb9848d85de9 |
| Raw byte comparison | 2cc3f259b37a6d176b26fdca5db5411e87d8b7ddc1f84225eec213cf996e24eb |
| Native collection | b771c2122456a8e41f1f66ef1668971c50033e58dbf6142dc3e8adee440caf00 |
| Native report | 46a2c8305760cbbdfd67bfcfbe42472f62888348bd68edd146b24f147c7a7326 |

New copied main/lib hashes are 87829b4a91b15fee69d1b59c10f18fa6d808c4066894984ad863ede0aaddccce and 7e4b8ae0a9e0f644fa334407dcef7752a0ff5fd82188ed2e158479898fe261b9; original installed main/lib remain 2135bc7f5e27b72ddfaa9b65586c905897e4222f989328ebc0434b1d1961c19c and f8e3a22d8ad16de08817404b6d6580e09b67cc7651c69c95f2b745aacb194066.

Final-path integration now passes: after fetching `codex/cloud-handoff` at 91bbd8f, the canonical helper creates `.cloud-tools/cli-physical-vias` in 1.932278 s, repeated preparation verifies it in 0.265357 s, verify-only passes in 0.186211 s and `START_CLI_PHYSICAL_VIAS_2026-10-13.sh` passes in 0.215452 s. All four actual exits are 0; manifest SHA256 a2f11f467503b57ebb9d3c64e911e0e424330c8edd4857f8c06069c96bef9be0 stays identical. Both reconstructed bundles equal the tested hashes above. The complete installed dependency tree, four pre-existing hardware edits and original tested Start shell remain unchanged. Only the four-line setup hook and four new helper/documentation files were applied; the complete installer was not rerun for this addition. Saved configuration, publication and fresh-task restoration are separate actions. No full CLI suite, full 49/Core replay, TI reference/impedance/timing compliance or fabrication acceptance follows from this tiny fixture. Frozen KiCad 10.0.5 and hardware evidence stay unchanged; fabricationReady remains false.
