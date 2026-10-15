# G350 DDR24 Linux checkpoint — 2026-10-15

The proposed 24-connection board passed fresh source capture, strict TypeScript, all 29 Core controls, 18 native physical checks, 24 genuine CPU-to-RAM graphs, 111 original solver API predicates, and a fresh pinned CLI export. Independent KiCad connectivity validation remains pending: its first attempt stopped at the VFS disk reserve before container creation. The last fully checked milestone remains Source23 (23/49); do not adopt or label the candidate fabrication-ready.

The CLI export contains 280 real parts, 507 footprints including via aliases, 227 physical through vias, 287 traces, 961 nonzero segments, 98 local signal approaches and four copper layers. It preserves the provisional 76 × 118 mm outline and all 49 original signal requests. The user's current arrangement allows DDR on all four layers with redesigned references.

## Measured planar lengths

Byte0 has 5/11 present and 0.527590595 mm spread. Byte1 has all 11 present and 0.627102255 mm spread, below the existing 0.635 mm planar limit. The loaded command/clock cohort has eight signals and 0.085443358 mm spread. DQS0, DQS1 and CK pair skews are 0.047004883 mm, approximately zero and 0.083220514 mm respectively, below the existing 0.127 mm pair limit. DQS1's two distinct coupling sections were checked separately.

These measurements exclude layer-dependent propagation and active via travel. Reference continuity, impedance, package compensation, electrical timing, complete49 routing, full-board DRC and shell fit remain unqualified. A separate sensitivity audit found that mixed layers materially change via-inclusive geometric matching; no measured electrical-delay claim is made.

## Actual Linux validation

The board runtime remains Node 25.6.1, Bun 1.3.14, tscircuit 0.0.2821, Core 0.0.2107, CLI 0.1.2258 and checks 0.0.242 with the reviewed checks patch. Upstream source is for inspection. KiCad is the existing Debian 10.0.6 image, `sha256:11b9360b20752e87f20942639e229b0d111e96f6e30b1bd1cb2eaafce9f26cfc`; the ignored image archive and frozen KiCad10.0.5 evidence are preserved.

Root collection sessions 9465/95941/43066/80755/76367/8435 passed source capture/types/Core/native/API/CLI respectively. Session10372 was a startup identity refusal, not a physical-check failure. Session68388 hit the CLI's 1 GiB RSS cap; its completion remains unknown. The unchanged exporter passed session8435 with a 2 GiB cap: 31.748 s, peak owned RSS 1,140,785,152 bytes, zero OOM events.

Session29982 derived genuine source-zone byte pins successfully. Its CAD wrapper then refused before container creation: installed-image size 1,519,935,209 bytes; available VFS storage 3,275,755,520 bytes; the original two-copy-plus-256MiB budget required 3,308,305,874 bytes. No KiCad report was produced. Both owned process groups were independently observed empty and the guard absent; the container status was not independently queried afterward. A bounded resource-policy successor is in preparation. No routing rule or hardware geometry was changed to address this resource issue.

## Restored source and evidence

`cloud/artifacts/g350-ti-ddr-source24-through-api-source-data-2026-10-15.tar.gz` preserves 98 exact source/data files (25,369,084 logical bytes), with 210 verified references to the preserved Source23 archive. Its SHA256 is `bd072ca47eea8e1b2d4c88612f9444e8137f361083b973a8d9bfc5f7f98774f7`; index SHA256 is `8c85472bbbf03d5092f6d382781435f6b805d9fb80bc655a4e3ebebfde43860a`.

The tested `scripts/restore-g350-source24-through-api-source-data.py` restores only absent regular files at their original `/workspace` and `/tmp` paths. It verifies the preserved Source23 base first. Thirteen fresh/idempotent/corruption/collision/symlink/mode/base and overlapping-root controls passed; a subsequent actual restore verified 98 existing exact files and wrote none. No SDK, image, historical authority or nonce is restored by this helper. Restore the older Source23 archive before this extension.

The subsequent CLI/CAD delta preserves 45 more exact source/data files (9,330,957 logical bytes), including the successful fresh CLI export and the CAD45 resource refusal. Its archive SHA256 is `c447f8ca7cc28cd52d9e14fc9260eb90bde40790dbfb46b16d7b286b22c54fb1`; index SHA256 is `badac1ce75c281dd156842ab2b91c18695f57d24daa5f317d816597af074d61e`. The tested `scripts/restore-g350-source24-cli-cad-delta-source-data.py` verifies all 98 prior files and 211 preserved base files before restoring anything. Twenty-one controls passed, including fresh restoration, idempotence, changed prerequisites, validly rebound overlapping archives, corruption, collisions, symlinks and modes. Restore this delta after the 98-file extension. The prior failed CLI's completion remains unknown; its partial export is not accepted.

The adjacent four-layer PNG is a read-only engineering plot of the actual Core/native/model JSON. Colored paths show the candidate24; dashed lines show25 missing requests. It is not a fabrication or successful49-routing screenshot.

DDR_RESETn has a separately reviewed, unexecuted Source25 candidate with no new vias or ports. Source3 Top proposals remain unaccepted after full-junction checks; a newer CPU dogbone relocation has a promising Inner1 route in source-only geometry checks and still requires complete qualification. The solver's C30 candidate passed644 existing regression tests; a one-line doomed-search cancellation successor and its new tests remain unexecuted. All11 release benchmarks remain pending for that successor. `fabricationReady=false` throughout.
