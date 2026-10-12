# Local stackup estimates for the selected DDR targets

The user selected a 400 MHz DDR clock and a nominal 1.6 mm four-layer board.
With the unchanged 0.1016 mm wire width and 0.12 mm differential gap, the
reviewed local quasi-static model estimates:

| JLCPCB template | Isolated single-ended | Differential pair |
| --- | ---: | ---: |
| JLC04161H-3313 | 60.39 Ω | 97.52 Ω |
| JLC04161H-1080 | 53.68 Ω | 90.97 Ω |

These are estimates using finite trapezoidal copper, documented dielectric
inputs and an assumed solder-mask profile. They are not JLCPCB calculator
results, a production guarantee or electrical timing acceptance. The pair
estimates are 15–19% below twice the isolated single-ended estimates; review
this with an independent field solver before choosing final widths, gaps or
impedance targets. TI's reference-plane and long-run spacing requirements
also need review on the eventual accepted routing.

All 24 mesh/domain/mask cases completed successfully in sequential jobs
limited to 60 seconds, 1 GiB and one BLAS thread. Parallel-plate, homogeneous
dielectric, differential normalization, interface and approximate microstrip
controls passed their stated checks. Mesh stair steps, material-interface
placement and mask assumptions limit accuracy; reported changes are not
rigorous error bounds. Package/via geometry, plane cuts, loss, dispersion and
manufacturing variation are outside this model.

The [research manifest](artifacts/g350-ddr-quasistatic-400mhz-research-2026-10-12.manifest.json)
indexes a 477,050-byte archive containing model source, guards, all raw cases,
controls, independent review, pinned runtime audit and exact historical input
snapshots. Its archive SHA256 is
`4d9c641d5c458c62aa5d9d755f90e3b4af0e4b54f5fc9c9ae0c18e411437cb1d`.
Restore into a **new ignored directory**, verify every indexed member, and
follow the included `REPRODUCE.md` after `source cloud/env.sh`. Preserve frozen
project sources and historical outputs. The archive records the older defaults
document as a historical input; the current updated document remains intact.

No hardware geometry, firmware, pins or checker assertions changed. Continue
the Top/Bottom routing work and the selected targets in
[DDR_ANALYSIS_DEFAULTS_2026-10-12.md](DDR_ANALYSIS_DEFAULTS_2026-10-12.md).
**fabricationReady=false; electrical timing remains unqualified.**
