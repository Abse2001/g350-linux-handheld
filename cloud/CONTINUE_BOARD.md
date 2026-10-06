# Continue the G350 board in cloud

Read `AGENTS.md`, `docs/CLOUD_HANDOFF.md`, `design-status.json` and the original
user-visible conversation in `docs/CHAT_CONTEXT.md`. Continue the same bare-AM3352
Linux handheld toward fabrication readiness. Preserve all accepted requirements:
original G350 shell, maximum four copper layers, both assembly sides, eleven
front membrane buttons, FPC display, microSD, one USB-C for charging and data,
no analog sticks or rear buttons, individual JLCPCB components, tsci, native
bus_lanes DDR bootstrap phases and checked manual repairs.

Verify the environment and pinned native solver first. Complete pending byte1
independent checks and the generated KiCad ignore-rule audit without weakening
checks. Repair/restructure the native byte1 carrier phase, replay actual editable
source and qualify combined copper. Preserve checked byte0 and power planes,
complete full DDR/peripheral routing, Linux boot/USB provisioning and release
checks. Do not merge routes from incompatible historical placements. Preserve
failed runs and only push meaningful verified breakthroughs after this transfer.

Keep fabricationReady false until every electrical, mechanical and manufacturing
gate passes; the user wants an order-ready prototype, not a partial routing image.
Shell measurements remain missing, so continue independently useful electronics
work while clearly recording the remaining physical-fit evidence needed.

## Latest rotated-RAM DDR candidate

The user requested RAM rotated 90 degrees and four-layer routing with inner
layer priority. The new source-verified candidate connects all 49 DDR signals
with zero native physical errors and zero Gerber shorts. Read
`cloud/DDR49_ROTATED_RAM_2026-10-06.md` and its evidence before continuing.
Six native length/skew failures, power/reference copper and peripheral routing
remain unfinished. The default 11/49 layout is unchanged; preserve its evidence,
but continue the user-requested rotated candidate rather than mixing placements.
`fabricationReady` stays false.
