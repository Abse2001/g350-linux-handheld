# Actual fresh clock KiCad DATA extension

KiCad10.0.6 loaded the original pinned CLI export and confirmed all96 local signal
pad/Topstub/barrel approaches plus both complete clock connections. Each clock
retains its original numeric Source owner, three physical paths and two real
through-barrels: CPU22→RAM57 and CPU4→RAM58. This is a narrow zone-free copper
connectivity result. Forty-seven other DDR channels, whole-board all-rule DRC,
reference planes and electrical timing remain unfinished; fabricationReady=false.

The raw export declares net0 on96 signal barrels. Actual pcbnew observations
after LoadBoard followed by BuildConnectivity give every barrel the same nonzero
net as its authentic numeric pad and Topstub. The run did not isolate which call
assigned the nets. Raw7793 and export540b remain byte-exact. No ownership-metadata
adapter, Source change, SDK patch, net repair, SaveBoard or refill was used.

Actual94957 has CAD child exit0 and a passing narrow report. Its original outer
wrapper required a negative net0 result, so that wrapper exited2. The collection
and postaudit retain that rejected outcome. The independent stdlib comparison
records the actual positive observations separately; it does not rewrite the
outer result. The pre-assertion observation file's initial passed=false is not
a failed finding: its actual mismatch count is zero, and the final report passes.

This archive stores26 selected regular source and DATA files, with exact hashes
and modes, including the original worker/offline container wrapper, peer review,
Root runner/authority/process records, original and zone-free boards, actual
collection/reports, authenticated Source/Native inputs and independent raw/native
net comparisons. The225 Source-via placeholders plus280 real parts account for
505 footprints; they are not505 assembly parts. All225 physical vias and461
segments remain. The zone-free copy removes only the four zones lexically and
holds every footprint/via/segment byte. Frozen KiCad10.0.5 evidence and the earlier
314-file Source/DATA bundle are unchanged.

The standalone stdlib restorer verifies the pinned index/archive and every file
before creating anything. It walks held directory descriptors without following
symlinks, refuses differing bytes or modes, and publishes absent files through
exclusive atomic links. It never overwrites a file. Historical Root authorities
are archived evidence and do not authorize new workers. This DATA extension does
not reconstruct the SDK, Node/Bun, Docker image, execution environment or all
Source imports; use the tested environment setup and earlier Source/DATA archive
for those prerequisites. Do not invoke archived Root authorities for new tasks.

The tracked verification command is:

```bash
cd /workspace/g350-linux-handheld
source cloud/env.sh
python3 -B scripts/restore-g350-clock-v11-cad-data.py \
  --manifest cloud/artifacts/g350-ti-ddr-clock-v11-cad-data-2026-10-14.manifest.json \
  --manifest-sha256 3499dc5662513e6eed13001017455cdc8a2785464debf0f9ef7ed6a826716a5d \
  --archive cloud/artifacts/g350-ti-ddr-clock-v11-cad-data-2026-10-14.tar.gz \
  --workspace /workspace
```

Add `--restore` to create absent selected evidence. Root independently repeated
all temporary tests and ran the tracked command with `--restore`: 26 existing
exact files and zero created. See `TI_DDR_CLOCK_V11_CAD_DATA_RESTORE_VALIDATION_2026-10-14.json`.
Ten temporary-root restore/refusal controls and
seven unsafe-path controls passed, including repeat zero writes, no-write
verification, last-leaf conflicts, wrong modes, symlink parents/leaves, corrupted
archive and caller-forged manifest. All26 restored hashes/modes were independently
checked. These tests import no application or CAD code.

The26-file successor adds the independent actual-result peer and negative-control
records. Its first temporary restore exposed an inherited USTAR size bound512B
short for this layout. That failed attempt is preserved separately. This restorer
uses the exact record ceiling of member headers/padded payloads plus two512-byte
terminators, rounded to10,240 bytes. Archive/index/payload bytes remain identical
to the failed26 proposal; only the new restorer bound changes. The earlier24
proposal and314 bundle remain exact. All ten temporary controls then passed.
