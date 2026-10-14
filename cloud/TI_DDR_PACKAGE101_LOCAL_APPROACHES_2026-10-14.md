# Package101 and HS64 local copper milestone

Fresh pinned Core now reproduces all101 CPU/RAM package rail/ground approaches on Top and all64 local high-speed capacitor loops on Bottom. Every branch reaches a physically owned full-through via. Actual native17 plus the strict owned via/trace/pad manufacturing guard report zero violations. This qualifies local power/ground approaches, not the49 DDR signal interconnects, filled reference planes, electrical timing or an order-ready board. `fabricationReady=false`.

The source retains280 real parts,1,161 original contacts, original217 board links, named rails/source pins/constraints and every accepted64 HS physical stub/barrel. It appends65 canonical full-through vias and101 distinct Top branches; seven canonical sites reuse accepted HS vias. Result:129 vias and165 local trace records. The source adds166 literal elements to the accepted1,870-element HS source tree (2,036 total). These additional branch records must not be confused with the original217 logical board links. All49 DDR solver requests remain unchanged.

| Local package inventory | DDR power | Ground/tied ports | Total |
| --- | --- | --- | --- |
| AM3352 CPU |7 VDDS_DDR |38 literal VSS plus17 preserved special/control ground ties |62 |
| DDR3 RAM |18 VDD/VDDQ |21 VSS/VSSQ |39 |
| Both packages |25 |76 |101 |

Only literal CPU DDR/VSS and RAM DDR power/ground pins use the applicable1.778/1.524 mm local path bounds. Special CPU domains and analog/control ties retain their original semantics and the2.54 mm proposal bound without a TI DDR timing claim. The32 retained high-speed capacitors still have64 numeric terminal-to-owned-via graphs. Bulk capacitors, PMIC-to-DDR supply distribution and continuous filled-reference connectivity require further qualification.

The last three RAM approaches use0.15 mm Top copper: RAM24 reuses HS8's power via `(1.2,9.8)`, RAM25 uses a new GND via `(.4,8.975)`, and RAM26 uses a new power via `(-.4,9.775)`. Their actual path lengths are1.365685425,0.555330086 and1.340685425 mm. The new RAM25 land intentionally touches only the registered old HS8 GND pad729/port730/source_port730 and Bottom trace55/source_trace987. Actual geometry proves positive connected annulus/strip and annulus/pad contact; its0.127 mm-radius drill misses both old copper shapes. All original pad/strip records remain exact. Every foreign or unregistered pad/trace still receives the unchanged clearance guard; no global same-net exemption or foreign-owner rewrite is used.

The first strict Core forward check failed after successful rendering because seven previously unused reused-via Top aliases acquired their derived connectivity-map key. The failed scope remains preserved. A separate readonly successor proves that only SourcePort1167/1171/1175/1215/1225/1227/1269 gain that previously absent field; each equals its exact original Bottom alias/barrel/retained cap trace and new numeric package branch key on the same original rail. Every other original SourcePort field remains strict. The65 known foreign-reference antipad unions are independently compared with the accepted HS64 BREP, without geometry repair. Core was reused unchanged; source capture, typecheck and rendering were not repeated for this diagnostic.

| Actual Linux stage | Result | Time / peak owned RSS |
| --- | --- | --- |
| Exact pure React source capture |1,870 retained elements plus166 declared additions |3.384437s /536,600,576 bytes |
| Actual source TypeScript, Node4096MiB heap |Pass |27.574812s /1,823,862,784 bytes |
| Direct pinned Core |Render passed; initial forward comparison failed; native unrun in this scope |38.775823s total /1,204,314,112 bytes |
| Readonly seven-alias forward and native qualification |101 package plus64 HS graphs, all18 native/manufacturing counts zero |9.928122s /477,048,832 bytes |

Each actual scope was collected with zero cgroup OOM deltas, an empty owned group and unchanged source/full board dependencies. The readonly stage also holds the existing imported numerical package trees. Compatible CPython3.12.14 uses the already-installed ignored `python-routing` target (NumPy2.3.5, Shapely2.1.2, GEOS3.13.1); no installation or ABI substitution occurred. Board runtime stays Node25.6.1, Bun1.3.14, tscircuit0.0.2821, Core0.0.2107, CLI0.1.2258 and checks0.0.242 with reviewed native patch1a8af494… and unchanged lockfiles/inspection references.

| Evidence | SHA256 |
| --- | --- |
| Accepted exact Core |ed33a0a335b1fbf0da9adcdeacaa954b655c3c4964c600efb6ef3c72aef4040e |
| Final grouped source owners |fffd02510548c16606eff4f6489da9860e45af82aca1cbc8e053a1201bc148a5 |
| Original source/capture/type/Core packet |1e82222c2c68acbce05f5057da6e7d19d3aecf101ee95c1de9ca028adbf49c83 |
| Seven-alias readonly successor |ed0a719c809da1d631af6df3db2c496323fcac66556cc67dfcbe56229cb723a6 |
| Strict source forward proof |429cb3e29fc38c09ea1a69d8eeae3efb38a4cac830a9050bbf284cad130ba73c |
| Native/physical101+64 graphs |99ce86ce927006668067f1c1b84bcdf937da64cc010457026f5fda6d2003ff68 |
| Actual readonly Root collection |e5009c09c9daed72daed1117dfb931fbb0e6feb2f8e14facb707a4a0dd73c95b |
| Actual readonly postaudit |93066b82f4bb7f2059f6be37f9c0254f5a311df1ce3c762f1951b53f658989b8 |

The compact data/source archive `g350-ti-ddr-package101-local-approaches-evidence-2026-10-14.tar.gz` contains73 regular indexed files:6,826,213 logical bytes,372,413 compressed bytes, SHA256 `6e2221ed9ccde2fa7e2897f39a46759ebb28fe307c048a4a5047a242a511e71f`. Every member was read back for exact hash/size/mode. Root tested the safe data restorer against this exact index: fresh temporary restoration created73 files; independent hash/size/mode inspection passed for all73; repeated restoration and verify-only passed with zero changes; a differing destination was refused before any new destination was written. Live restoration verified73 existing exact files and created zero. See `cloud/TI_DDR_PACKAGE101_DATA_RESTORE_VALIDATION_2026-10-14.json`. These tests execute only Python standard-library data restoration. The archive requires the retained HS32, V12e-source and all-four-layer evidence prerequisites plus the pinned installed runtime/resolver/image state. It omits dependencies, numerical wheels, symlinks, credentials and live processes. It is data preservation, not independent operational reconstruction, full Start validation or source/CAD replay acceptance.

Fresh physical CLI/KiCad129-via export and independent101+64 numeric connectivity are the next required checks. New CAD must remove only the129 source-identified empty via placeholder footprints while retaining every real barrel and all other bytes, and prove the local paths without using filled planes to mask opens. The custom all-four-signal-layer reference design, continuous adjacent filled copper/returns, full supply distribution, DDR49 routing/timing/impedance, full-board CAD/DRC and exact shell fit remain open. Frozen evidence and all hardware sources are preserved; no canonical hardware promotion or fabrication publication follows from this milestone.
