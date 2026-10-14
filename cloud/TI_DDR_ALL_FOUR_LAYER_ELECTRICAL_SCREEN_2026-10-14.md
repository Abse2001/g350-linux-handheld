# G350 all-four-layer DDR continuation

The user permits DDR signals on all four copper layers and requires redesigned
references. This supersedes the earlier Top/Bottom-only routing instruction.
The current C placement is CPU `(0,20)`, RAM `(1.2,6.2)`, RAM rotation 270°.
The board is not ready to order; `fabricationReady=false`. No complete fresh
49-signal route has been accepted at this checkpoint.

The selected analysis defaults are a 400 MHz DDR clock and a nominal 1.6 mm
four-layer JLCPCB board. A named construction must be selected and verified;
the generic thickness choice does not specify electrical layer spacing.

## Verified official construction and limits

Official HTTPS sources were fetched with TLS verification and the session proxy.
The local, ignored research manifest is
`.cloud-tools/ddr-all4-impedance-research-sourceonly-next/SOURCE-manifest.json`,
SHA256 `c47bdd8d0a8003a8bacfc1782cae0adf7ecba2858dfc9220752ad4a4edffcbfb`.
Its `VERIFIED_SOURCE_REPORT.md` distinguishes official dimensions from analytical
estimates. No field solver, IBIS simulation, board extraction or factory
impedance result was produced by that research.

| JLC construction | Outer-to-inner prepreg | Inner core | Outer / inner copper |
| --- | ---: | ---: | ---: |
| JLC04161H-1080 | 0.0764 mm | 1.265 mm | 0.035 / 0.0152 mm |
| JLC04161H-3313 | 0.0994 mm | 1.265 mm | 0.035 / 0.0152 mm |
| JLC04161H-7628 | 0.2104 mm | 1.065 mm | 0.035 / 0.0152 mm |

The official calculator labels the 1080 construction 1.52 mm ±10% finished
thickness and 3313 1.56 mm ±10%. The generic no-requirement construction uses
7628. Material properties and the construction for an eventual order remain
unconfirmed. See [JLCPCB stackups](https://jlcpcb.com/impedance) and its
[calculator guide](https://jlcpcb.com/help/article/user-guide-to-the-jlcpcb-impedance-calculator).

For a 0.1016 mm inner trace, a conditional analytical screen gives approximately
47–51 Ω with nearby outer ground across 1080 prepreg. Referencing only across the
1.265 mm core instead gives approximately 122–132 Ω. These estimates omit finite
reference edges and holes, etch shape, dispersion, loss and neighboring traces.
They cannot establish controlled impedance. Inner-layer DDR routes therefore
need actual nearby continuous outer reference copper, owned stitches, and return
transfer checks. Layer names or an unfilled zone declaration are insufficient.

TI Table 7-62 allows a selected single-ended impedance from 50–75 Ω and requires
that selected value ±5 Ω for each trace segment. Tables 7-68/7-69 set differential
nominal impedance to twice the selected value. 50 Ω / 100 Ω is this project's
chosen target, not the only TI choice. No automatic BGA neckdown impedance
exception was found. JLC's stated ±10% standard impedance control is not proof
that the current trace widths meet TI's window.

## Timing and spacing

The 1080 copper-center heights give Top-to-Inner1 and Top-to-Inner2 spans of
0.1015 and 1.3817 mm. A simple homogeneous-dielectric screen gives a 16.9–18.3 ps
difference between two transitions to those carrier layers. This is not a
qualified via RLC delay, but shows why equal planar length and equal via count
do not prove equal timing in a mixed-layer cohort. Package models, unused barrel
stubs, reference changes and waveform setup/hold analysis remain required.

Normal TI spacing distinguishes CK, ADDR_CTRL, DQS0, DQ0, DQS1 and DQ1. A
length-matching cohort is not necessarily a spacing class. CK-to-address and
DQS-to-associated-data spacing use the appropriate 4w rule; address-to-address
and ordinary data within a byte use 3w. Differential pair spacing remains set
by its impedance requirement.

Table 7-68 footnote 10 and Table 7-69 footnote 8 permit reduced center spacing
over up to 1250 mils (31.75 mm) of routed length. Any new use must explicitly
classify and meter the affected sections, retain physical copper/drill clearance,
and preserve differential-pair rules. Existing solver defaults and historical
assertions remain unchanged. This is not an unmetered waiver or a manufacturing
clearance reduction. The local frozen official text is
`reference/am3352/am3352.txt`, around lines 8532 and 8593; see the
[TI datasheet, pages 175 and 187–188](https://www.ti.com/lit/ds/symlink/am3352.pdf).

## Package-model research and continuation

The official [AM3352 product page](https://www.ti.com/product/AM3352) links the
[ZCZ IBIS Rev. C package](https://www.ti.com/lit/zip/SPRM552). The verified archive
is 22,242,733 bytes, SHA256
`f99cb588a07b2d77d4c52a3189933c8175467d8829b94d118173943b286990aa`.
Its `am335x_zcz` component has a 175-pin coupled resistance/inductance/capacitance
package model and 1.5 V DDR selectors. These matrices are not scalar flight
times. The vendor archive remains ignored under `.cloud-tools`; this report
does not redistribute it. Matching memory-model and drive/ODT selection remain
open. TI's [SDAA087A simulation guide](https://www.ti.com/lit/pdf/SDAA087)
requires board/package extraction and corner waveform analysis.

Continue from source-bound route candidates, not a mixture of old placements.
Fresh editable Source, pinned Core, native numeric connectivity/manufacturing,
KiCad 10, actual filled references and full-cohort timing must independently
pass. The two-clock V11 geometry candidate has planar skew 0.086776625 mm, within
the 0.127 mm pair limit; that local result does not accept the complete bus or
electrical timing. All frozen hardware, earlier evidence, runtime pins and the
reviewed native patch are preserved. Environment installation readiness and
board fabrication readiness are separate outcomes.
