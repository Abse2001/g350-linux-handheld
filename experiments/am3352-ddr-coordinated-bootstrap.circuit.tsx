import {AM3352BZCZ100} from "../imports/AM3352BZCZ100"
import {MT41K256M16TW_107_P} from "../imports/MT41K256M16TW_107_P"
import connections from "../lib/am3352/memory-connections.json"
import {DdrConstraints} from "../lib/am3352/DdrConstraints"

// Authored from individual JLCPCB imports, using the public native DDR
// preset documented at https://docs.tscircuit.com/guides/routing-ddr.
// Coordinate all package dogbones in one routing phase, while retaining
// separate byte, command/clock and reset timing buses.
// This bootstrap is a signal-only feasibility fixture, not a powered
// handheld. No complete PCB/module or saved autorouter routes are imported.
// Proposed 8-layer resources: Top/local, L2/GND, L3/byte0, L4/GND,
// L5/CA+CK, L6/DDR1V5, L7/byte1, Bottom/general. Reference planes and
// decoupling must be integrated before final electrical qualification.
// 0.35/0.15mm dogbones enlarge the documented land to reserve drill clearance; an
// investigatory process. TI's 18–20mil land/10mil drill guideline differs;
// final fabrication geometry and stackup have not been qualified.
export default ()=> <board title="AM3352 + 512MB DDR3 — coordinated dogbone bootstrap"
  width={30} height={46} outlineOffsetY={-13} layers={8} thickness={1.6}
  minTraceWidth={.1016} nominalTraceWidth={.1016}
  minTraceToPadEdgeClearance={.1016} minPadEdgeToPadEdgeClearance={.15}
  minViaHoleDiameter={.15} minViaPadDiameter={.35}
  minViaEdgeToPadEdgeClearance={.1016} minTraceToHoleEdgeClearance={.2}
  minViaHoleEdgeToViaHoleEdgeClearance={.254} minBoardEdgeClearance={.3}
  isViaInPadAllowed={false} allowBlindAndBuriedVias={false}
  schAutoLayoutEnabled={false} routeRemaining={false}>
  <autoroutingphase name="DDR_COORDINATED_BUS_LANES" phaseIndex={1} autorouter="bus_lanes"/>
  <DdrConstraints pairGap={.12}/>
  <AM3352BZCZ100 name="U_SOC" pcbX={0} pcbY={0} layer="top" schX={-12} schY={0} schWidth={8} schHeight={50}/>
  <MT41K256M16TW_107_P name="U_RAM" pcbX={0} pcbY={-27} layer="top" schX={12} schY={0} schWidth={8} schHeight={28}/>
  {connections.map(c=><trace key={c.name} name={c.name} from={`U_SOC.${c.socPin}`}
    to={`U_RAM.${c.ramPin}`} thickness={.1016}
    routingPhaseIndex={1}/>)}
  <silkscreentext text="AM3352 DDR3 STUDY — DO NOT FAB" pcbX={0} pcbY={-35} fontSize={.8}/>
</board>
