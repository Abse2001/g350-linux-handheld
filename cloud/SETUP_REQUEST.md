# Requested G350 cloud setup

Name this reusable environment **G350 AM3352 handheld**. This is the continuation
of the existing G350 board, not a new design. Twelve repositories are attached:
Abse2001/g350-linux-handheld plus the eleven upstream repos in
`cloud/repositories.json`.

The authoritative board is on **codex/cloud-handoff**, initially verified remote
commit **a1c21f05b10e2d7951eb153cd972a6406d2a0535**. Fetch that branch and check it
out before inspecting the project. The repository default branch is older.
Read `AGENTS.md`, `docs/CLOUD_HANDOFF.md` and `design-status.json`. The complete
recorded user-visible chat is in `docs/CHAT_CONTEXT.md`.

Use Ubuntu Linux. Install/run `bash scripts/setup-cloud.sh` in the board repo.
It restores all 25,814 hash-indexed evidence files, installs pinned packages,
Node 25.6.1/Bun 1.3.14/KiCad 10, applies the reviewed native checks correction,
checks out all eleven pinned upstream source references, and verifies typecheck,
native DDR solvers, current Gerber shorts, mechanical checks and KiCad Python.
Source `cloud/env.sh` in each task shell. Keep the published runtime pins and
native check patch; don't upgrade dependencies or substitute upstream HEAD builds
silently. Record the actual Linux KiCad version and fresh verification outputs.

Use the package-manager network preset plus nodejs.org, jscdn.tscircuit.com and
registry.tscircuit.com. Board research also needs docs.tscircuit.com,
tscircuit.com, ti.com, micron.com, jlcpcb.com, lcsc.com and buydisplay.com. No
personal credentials are included or needed for public source installation.

Persist the tested setup as the environment Install script and the shell
initialization/verification instructions as its Start skill. Install setup must
fetch/check out codex/cloud-handoff if the initial checkout uses main. Verify
that newly started tasks have the correct source and restored evidence, rather
than only verifying one temporary setup shell.

This is setup work: do not route hardware or promote an experiment while preparing
the environment. Keep fabricationReady false. The current checked board is
280 parts, four layers, provisional 76 × 118 mm, and only 11/49 DDR connections.
The latest seeded-strobe replay reports 13/49 but independent checks are pending.
Whole-shell fit is unverified. Failed native byte1 outputs remain failed.

Finish environment setup, present the verified report and make it ready to
publish. The human has explicitly requested this transfer and project upload.
