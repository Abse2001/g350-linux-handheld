# Latest tscircuit runtime verified on Linux

Registry versions checked on 2026-10-07 are installed and pinned:

| Package | Installed version |
| --- | --- |
| tscircuit | 0.0.2757 |
| @tscircuit/core | 0.0.2106 |
| @tscircuit/props | 0.0.695 |
| @tscircuit/checks | 0.0.242 |
| @tscircuit/cli | 0.1.2257 |
| @tscircuit/capacity-autorouter | 0.0.962 |
| circuit-json | 0.0.520 |

Node 25.6.1, Bun 1.3.14, isolated official Debian KiCad 10.0.6 and all eleven
upstream inspection references are retained. Hardware and frozen evidence are
preserved. This upgrade does not establish fabrication readiness.

The latest checks still contain the two previously reviewed defects. The same
via-specific rule lookup and zero-length copper-edge distance corrections were
ported without disabling any assertion or reducing a clearance. Reviewed checks
SHA256 is `1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc`.
Both real clearance negative controls pass their regression tests: invalid vias
and invalid SMT pads remain rejected, explicit overrides and fallback rules are
preserved, and removing a real CPU ground trace adds its disconnection error.

An isolated install replayed the unchanged whole-board entry in 493.562 seconds,
without a timeout or changed source definitions. All 34 non-error record types
other than project metadata exactly match the preceding compiled board, including
all physical copper, placements, pads, fills and logical definitions. The build
still exits **1** for its three existing DDR bus-skew errors. The latest checker
independently reports exactly those same three errors on the preceding circuit;
all other native and strict manufacturing checks are zero.

The actual board installation was exercised with locked `npm ci
--legacy-peer-deps --ignore-scripts` followed by the reviewed patch. Typecheck,
shared Core identity, native DDR solver API checks, patched checker hash, frozen
board hashes and `bash scripts/verify-cloud.sh` pass. Native KiCad/pcbnew 10.0.6,
wx 4.2.5, frozen-board all-layer Gerber shorts and mechanical outline checks pass;
the latter explicitly does not establish original-shell fit. Package engine
warnings remain for dependencies declaring Node 24.x; the tested board runtime
continues to use Node 25.6.1.

Fresh Bun dependency resolution still encounters a 403 on the pinned linter's
GitHub API tarball. Installation uses npm and the existing Git proxy. Bun lock
records were reconstructed using exact npm versions and registry integrity
values, retaining the original Git commit and Git integrity record. Unresolved
peer dependencies omitted by npm's legacy peer mode are also omitted from Bun's
resolution records; authoritative npm metadata remains intact. Bun successfully
validated and normalized the frozen text lock. A fresh Bun dependency install is
not claimed. Initial isolated typecheck lacked copied historical routing inputs;
the complete checkout's actual typecheck passes.

Version assertions in the reviewed patch, phase runner, large-board KiCad exporter
and cloud verifier now require this tested cohort. Old reports and their checker
hashes remain historical evidence. Continue the separately checked DDR shortcut
entry described in `cloud/DDR_SHORTCUT_PROGRESS_2026-10-07.md`, keeping
`fabricationReady` false.
