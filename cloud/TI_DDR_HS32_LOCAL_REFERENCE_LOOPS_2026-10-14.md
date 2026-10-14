All 32 DDR high-speed bypass capacitors now have checked local copper from
their 64 numeric pads to 64 owned full-through vias. This is a local source
milestone, not a connected DDR bus or an orderable board. Package supply/ground
approaches, filled reference connectivity, all49 DDR interconnects, custom
four-signal-layer reference design, electrical timing and whole-board
qualification remain open. `referenceQualified=false`, `accepted49=false`,
`fabricationReady=false`.

The routing-disabled source appends 62 vias and 62 manual traces to the current
E/C/fresh-TI source. It preserves RAM7's original two physical traces/vias
exactly. Actual capture compares all1,746 original React elements/props and
exactly124 added elements. Full TypeScript passes on the unchanged source.
Direct pinned Core rendering produces actual JSON
`384628cd46c2b5cb5b32a94d442651eda3c604c8acf19bd85fc68b728f529769`.
The strict source comparison preserves all280 real parts,1,161 original copper
contacts,217 original logical links, numeric pins,98 nets,8 buses, original
placements and retained copper. Its two original reference pours differ only
by the explicit union of31 new foreign via antipad cuts each; their outer
outlines remain exact. The original934 source trace records are retained;
the62 additional local branches do not redefine the217 original links.

Root's collected Linux results are:

| Actual stage | Outcome | Elapsed / peak owned RSS |
| --- | --- | --- |
| Source capture26134 | Pass;1,746 original elements and124 additions |3.900302s /561,000,448B |
| Full types36214 | Pass; source/assertions unchanged |26.688115s /1,784,262,656B |
| Direct Core11804 | Render pass; subsequent verifier failed at missing Shapely import path |42.330842s complete scope /1,159,352,320B |
| Readonly retry91883 | Strict source/31-cut proofs,64 known-net graphs and all18 native/manufacturing checks pass |5.944154s /359,165,952B |

All collected scopes have zero cgroup OOM events, closed empty owned process
groups and unchanged bound source/dependency trees. The earlier640MiB and
1,280MiB V8 heap failures are preserved; they do not count as typecheck passes.
The successful full type stage uses a4,096MiB Node heap with the same source
and compiler flags. No new routing, CLI, CAD export or refill ran in the
readonly retry.

Each accepted local via has a0.4572mm land,0.254mm drill and spans all four
copper layers. Each cap stub is0.2mm on Bottom. Maximum actual cap-pad-to-via
copper length is2.499884mm, below the separate TI2.54mm limit. Native17 runs
on unchanged raw Core. The manufacturing check uses only the separately
proved own cap/stub/via metadata where a standalone authored via lacks its
trace-owner field; removing that added metadata round-trips every raw record
exactly. No geometry, rail, foreign owner or native input is rewritten.

The Linux verifier issue was an omitted import path, not a missing install.
The existing ignored `.cloud-tools/python-routing` already contains exact
NumPy2.3.5 and Shapely2.1.2 CPython3.12 wheels with GEOS3.13.1. The existing
Codex CPython3.12.14 interpreter is compatible; Debian's system Python3.13
is unsuitable for these wheels. The tested readonly wrapper inserts the
existing target before importing, checks exact versions and module/extension
locations, and passes a tiny3-4-5 geometry gate before the byte-exact strict
verifier. Imported package/library trees stay hash exact and bytecode writes
are disabled. No reinstall or global package change was needed. The supported
`scripts/verify-g350-routing-tools.py` already inserts this target; future
checks must do the same and use the compatible interpreter. Source
`cloud/env.sh` for runtime activation. Node25.6.1,Bun1.3.14,tscircuit0.0.2821,
Core0.0.2107,CLI0.1.2258,checks0.0.242 and the reviewed native patch remain
pinned. Upstream inspection checkouts do not change board runtime versions.

Durable local proofs:

| Record | SHA256 |
| --- | --- |
| Actual Core64 |384628cd46c2b5cb5b32a94d442651eda3c604c8acf19bd85fc68b728f529769 |
| Strict source-forward proof |db35a6bd009f14b98726ccd7b3ad042721b6d63dfd4ed7910670fe2fac21012d |
| Native18/64 actual graph report |6d4aa76542317f1e1b4f06fc1e9e3600306fe35f4aa0902a53e2d268e0f17e6e |
| Numerical import/version gate |8e1815eec98a7998da96a232d278bbccc76495f558951393d95324a68c0183fe |
| Collected Root91883 |36c882190799f62433808935730fdc6bfdce4e90f1bebea7d0ec737210cf05b1 |
| Readonly source/dependency post-audit |9e5c52fd3394581906b93da4c345588493656eba5a9d11be48b09336f1c44465 |

The small data/source artifact proposed for persistence is
`cloud/artifacts/g350-ti-ddr-hs32-local-reference-evidence-2026-10-14.tar.gz`
with its adjacent `.manifest.json`:91 regular payload files,13,435,499 logical
bytes,705,571 compressed bytes. Archive SHA256 is
`80de5dd72cf593d0a7c3ce062270b5b279506a238749760cc0bb5aa52f6276bc`;
manifest SHA256 is
`d470d3bcecd18bd49d6a2ab40cda03a2015bb7b967c9a2b66489ac6f335fa642`.
Every member's hash,size and mode was read back exactly; selected originals
remain unchanged. It retains the accepted overlay/owner/Core/helpers/graphs,
actual capture/type/native receipts, preserved import-path failure and prior
heap failures. The V12e source/carrier and all-four-layer closed-evidence
archives remain prerequisites for inherited sources. Installed dependencies,
numerical packages and large source/type closures are excluded. The standard
library restore helper validates indexed paths/hashes and refuses symlinks,
unsafe destinations and differing-file overwrites. Root subsequently tested fresh data restoration, verification, repeat restoration
and refusal of an existing differing file. All91 restored bytes/sizes/modes
were independently checked; the temporary directory was removed. Live Start
replay and standalone operational closure remain unqualified. See
`TI_DDR_HS32_DATA_RESTORE_VALIDATION_2026-10-14.json`. The tested source helper
is `scripts/restore-g350-hs32-evidence.py`.
This data validation does not claim standalone operational closure.

The next source-data inventory resolves all64 actual reference owners for
future fixed-copper registration:49 DDR requests plus64 provided owners give
113 semantic validation descriptors, not113 routing requests. All101 package
power/GND-net Top pads still need physical approaches:CPU7 VDDS_DDR and55
GND-net pins;RAM18 power and21 GND. CPU55 includes38 literalVSS,5 specialVSS
domains and12 analog/control ties; preserve their functions and do not apply
DDR rules blindly. The four retained22µF DDR bulk capacitors and PMIC/inductor/
output-capacitor/VREF rail endpoints also need qualified physical connections.
All64 current stubs are Bottom, and those101 Top pads have positive actual
copper gaps to every same-rail HS via. Logical source-net connectivity does
not fill these missing physical approaches.

New CAD must handle64 source-owned via placeholder components, preserving all
64 real physical barrels and280 real footprints. Fresh filled-zone checks must
bind actual pad/via UUIDs and `(zoneUuid,layer,polygonIndex)` with holes intact;
the historical exact-two-zone checker cannot qualify additional GND patches.
All-four DDR uses COMMAND_CLOCK Inner1,BYTE1 Inner2,BYTE0 Bottom,RESET Top.
This custom arrangement requires actual-route-adjacent connected reference
coverage and physical return/bypass transitions; it is not TI's literal
Top-signal/Inner1-GND/Inner2-DDR-power/Bottom-signal stack. No new49-link route,
continuous-reference, impedance, PDN, timing or fabrication acceptance follows
from these local loop checks.
