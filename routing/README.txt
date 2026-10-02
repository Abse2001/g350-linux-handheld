Revision B routing provenance

The local capacity-autorouter 0.0.951 Pipeline 9 generated all three phases using tscircuit 0.0.2715. The original complete run is in initial-autorouter-run.log. Its final geometry had clearance errors, subsequently corrected without lowering any clearance rule.

Manual corrections after that run:
- Moved the DOWN input via to (-0.9,-0.9), clear of adjacent pads, the reset path and the B-button route.
- Jogged the A-button inner2 bridge through y=-1.7 to clear that full-depth via.
- Jogged the CC1 route around the USB data via, with a vertical entry to its fine-pitch connector pad.
- The source reset path crosses the controller above these vias at y=0.
- The source I2S frame-clock path bends around the Pi mounting hole while clearing the FPC anchor.

rev-b-routes.json contains only each phase's own retained solver routes, including those manual corrections. Ground contacts are regenerated from current pads. SavedRouting.ts checks the SHA256 of every full phase input, including earlier copper, and the pinned versions before reuse. A mismatch runs the live solver. No draft-cache bypass exists in the released code. Final native, shorts and independent KiCad checks are in checks/, with the exported artifact hashes in fabrication/SHA256SUMS.
