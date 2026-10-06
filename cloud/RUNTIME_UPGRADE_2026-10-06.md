# Runtime upgrade and routing continuation — 2026-10-06

The requested latest tscircuit release is now installed. Registry versions checked
in this session are pinned in package.json and package-lock.json:

| Package | Previous | Current |
|---|---|---|
| tscircuit | 0.0.2744 | 0.0.2745 |
| core | 0.0.2088 | 0.0.2095 |
| props | 0.0.687 | 0.0.689 |
| checks | 0.0.239 | 0.0.240 |
| CLI | 0.1.2237 | 0.1.2251 |
| capacity-autorouter | 0.0.958 | 0.0.959 |
| circuit-json | 0.0.515 | 0.0.517 |

The latest checks release still contains both previously reviewed defects:
via-to-pad clearance reads the pad-to-pad rule, and copper-contact distance throws
on coincident endpoints. The same two corrections were reviewed and ported to
0.0.240, without disabling checks or changing clearances. Patched checks SHA256:
`7bb83632137db56a698d91dc75ace0e74561e51dfcfb2bd9c6928a2280c45b2a`.
Cloud verification and the phase runner now require the updated versions/hash.
Node 25.6.1, Bun 1.3.14 and isolated Debian KiCad 10.0.6 are retained.

## Upgrade validation

A separate ignored `.cloud-tools/latest-runtime` install replayed the unchanged
editable byte0 source. Every one of its **21 non-error PCB record types** exactly
matches the previous frozen circuit, including all components, pads, tracks,
vias, planes and outline. The 280 source components, 1,161 source ports and 930
source traces also match exactly. The original frozen files are unchanged.

That first build with uncorrected checks failed with `Illegal Parameters` during
routing DRC. After porting the reviewed corrections, `runAllRoutingChecks` on
its compiled circuit completed with only the expected **818 disconnected-port
and 108 missing-trace errors**. These are unfinished routes, not passing full DRC.
The latest CLI's all-layer Gerber shorts check reports zero shorts.
Typecheck and current runtime/solver/hash checks pass. npm's locked installation
was exercised with `npm ci --legacy-peer-deps --ignore-scripts`, followed by the
explicit reviewed patch.

Bun's fresh resolution attempted a blocked GitHub API tarball request. Its lock
records were instead synchronized from the authoritative npm lock: exact package
metadata and registry integrity values were copied unchanged; the existing
Git-pinned dependency record remains unchanged. Bun then successfully validated
and normalized the result with `bun install --frozen-lockfile --lockfile-only
--ignore-scripts`. A fresh Bun dependency installation is not claimed; use npm ci
for dependencies, as the cloud setup already does.

The eleven upstream source checkouts retain the handoff manifest refs for
inspection. They are not substituted for the current runtime packages. The earlier
`LINUX_VALIDATION.md` remains a historical record of the initial environment;
this report supersedes its runtime version/hash list.

## Independent seeded-strobe candidate checks

Fresh results are preserved in
`checks/integrated/g350-byte1-seeded-strobes-linux-20261006/`.
These checks bind the existing handoff's frozen seeded-strobe compiled circuit
SHA256 `422b953063e3e6b92502f0a8376f092d397923ca405eed978ba40c664509734a`;
they do not claim a new source replay under the upgraded runtime.

All five previously ignored project rule severities were restored to error,
with no per-item exclusions. KiCad normalization/refill, exact local footprint
serialization, final DRC, numeric pad/plane connectivity, package escapes and
read-only stencil verification were executed. Results:

- **13/49 DDR connections**, including both byte1 strobes; 36 remain open.
- **Zero physical DRC errors**, but **421 warnings**: 403 silkscreen warnings
  and 18 dangling escape-via warnings, plus 499 reported/capped board opens.
- All 101 package power terminals, 141 full-depth vias and both filled planes
  pass the scoped plane checker; all 22 exact package escapes pass.
- Byte0 planar skew 0.207792 mm and byte1 strobe pair skew 0.077497 mm pass
  their 0.635 mm and 0.127 mm limits. Whole byte1 and command/clock timing fail
  because their channels remain incomplete.
- SMT stencil metadata passes, but eight unassociated through-hole apertures
  remain an open qualification gate.

The qualified report binds final board/report hashes and records limitations.
The default remains the checked byte0 board at **11/49**. No hardware source,
placement, routing cache or default export was promoted or changed.

## Remaining prerequisites for the full requested result

This is not a 100% routed board and it has not achieved zero complete-board DRC
or zero electrical timing errors. `fabricationReady` remains false.

The original-shell internal PCB perimeter, mounting/port coordinates and assembly
clearances are not measured. A manufacturer-approved four-layer stackup and
impedance/package/via-delay qualification are also missing. These inputs are
needed to finalize physical placement, trace geometry and DDR electrical timing;
planar length matching alone cannot establish zero timing errors. Continue the
remaining byte1, command/clock/reset, power and peripheral work only with explicit
scope and fresh checks; preserve the incompatible historical routing fixtures.
