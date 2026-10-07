# Docker runtime follow-up, 2026-10-07

Tested on Debian 13 with Docker 28.4.0 and the retained official KiCad
10.0.6 image (pcbnew 10.0.6+dfsg-1). The original setup validation remains
historical; current package pins and the reviewed native checks patch pass
`node scripts/verify-cloud-state.mjs`.

`cloud-docker.sh` selects `/var/run/docker.sock` and clears stale remote
Docker selectors. Both setup and tool wrappers use it. The image installer
uses the default Docker bridge and a read-only mount of the current public
CA bundle for APT, rather than host networking or overriding proxy defaults.
The bundle is not retained in the exported tool image. The digest-pinned
Debian base, exact KiCad package, archive verification and board locks remain
unchanged.

Tests passed: shell syntax, official Debian APT update over the default
bridge, archive hash verification and loading with deliberately stale Docker
selectors, CLI version, headless pcbnew serializer/connectivity imports,
and the pinned cloud-state assertions. Logs and hashes are in
`DOCKER_RUNTIME_VALIDATION_2026-10-07.json` and the adjacent archive.

Fresh four-layer board exports and independent DRC also execute through these
wrappers. This validates the reusable tools; whole-board connectivity and DDR
timing remain separate unfinished hardware checks. Fabrication readiness is false.
