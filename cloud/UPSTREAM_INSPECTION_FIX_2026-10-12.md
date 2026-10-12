# Pinned upstream inspection and solver development

The original inspection link for Bus Lanes pointed to the attached checkout.
Its required inspection commit is `2417031d063f208050c966ee9d997fc8d6e26a59`.
Starting on the newer `codex/fix-g350-ddr-routing` branch therefore failed the
old pin assertion; recreating the link could also detach a clean developer
checkout. Neither behavior should replace the developer's source or edits.

`scripts/checkout-cloud-upstreams.mjs` now reuses clean, detached, exact-pin
attachments. Other attached checkouts receive an independent inspection clone
under ignored `.cloud-tools/upstream-inspection-cache/NAME-PIN`. Local Git objects
are cloned without sharing the worktree/index or borrowing collectible objects;
the clone's origin is set to the manifest URL and it is detached at the exact pin.
The clone passes origin, HEAD and clean-status checks before the known attached
inspection link is rechecked and atomically redirected. Reused caches must own
real working/Git/object directories with no borrowed alternates; unknown cache
entries and links changed during cloning are preserved. Missing caches reconstruct.
Edited caches, real inspection directories and unknown links are preserved and
must satisfy the original pin and clean-status assertions. Failed reconstruction
does not replace the existing attached link. No attachment is reset or cleaned.

All eleven entries in `cloud/repositories.json` and all board lockfile/runtime
pins remain unchanged. These clones are inspection sources; they do not replace
the installed board runtime or the reviewed native checks patch.

Thirteen offline fixture checks passed with Node 25.6.1 and Git 2.52.0: developer
branch/dirty-file preservation, an unchanged developer branch at the pin,
dirty detached checkout, clean detached reuse, repeated startup, cache
reconstruction, invalid pin, edited cache, unknown link/real directory, missing
attachment, all eleven exact-pin assertions, link changes during cloning,
symlinked/borrowed caches, and a cache entry appearing during cloning. Fixtures
used local filesystem Git origins only.

Applied Linux validation passed on Debian 13: all eleven unchanged inspection
pins and clean statuses passed twice. The saved
`cloud/START_OUTER_DDR_RUNTIME_2026-10-11.sh` completed with exit 0, including
KiCad 10.0.6 CLI/Python checks, archive hashes, restored evidence and isolated
Python/C++ routing-tool checks. A source startup prefix fetched and verified the
pushed solver commit and retained its development branch. All 72 other
pre-existing hashed files, including four dirty tracked files, local hardware
work, lockfiles and the reviewed native-check patch, remained byte-for-byte
unchanged. The exact report is
[`artifacts/upstream-inspection-validation-2026-10-12.json`](artifacts/upstream-inspection-validation-2026-10-12.json).
The changed upstream-checkout step used by Install was retested; a full fresh
Install was not repeated while the solver/regression workers were running.
The original full Linux setup validation is in `cloud/LINUX_VALIDATION.md`.

For Bus Lanes development, retain the legacy Start commands and historical board
notes. Prefix them with `source cloud/env.sh`, fetch the fork source, switch to
`codex/fix-g350-ddr-routing` only through normal Git safety checks, and fast-forward
only. The verified pushed source is currently
`73ef0433d20081b9176cf100c4e82095fe1d6cfa`; verify the final tested commit when
saving the Start skill. The unchanged legacy inspection step then checks its
independent pinned clone while the attached checkout retains the fix branch.
Do not reset/clean a conflicting or newer local checkout.

This is an environment/source preservation change. Strict 49-signal Top/Bottom
solver acceptance is pending; the saved board Start restores the historical
22/49 checkpoint, while newer local 26/49 hardware work remains preserved. It does not establish full-board routing, electrical
timing, shell fit or fabrication readiness. `fabricationReady` stays false.
