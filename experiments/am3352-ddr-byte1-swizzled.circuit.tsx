import {AM3352BZCZ100} from "../imports/AM3352BZCZ100"
import {MT41K256M16TW_107_P} from "../imports/MT41K256M16TW_107_P"
import connections from "../lib/am3352/memory-byte1-swizzled-connections.json"
import {DdrConstraints,ddrGroups} from "../lib/am3352/DdrConstraints"

// Authored from individual JLCPCB imports, using the public native DDR
// preset documented at https://docs.tscircuit.com/guides/routing-ddr.
// Apply the permitted byte1 DQ permutation; keep byte0 and DQS/DM fixed.
// Route the nearer byte1 lane first to reserve its package escape sites.
// This bootstrap is a signal-only feasibility fixture, not a powered
// handheld. No complete PCB/module or saved autorouter routes are imported.
// Proposed 8-layer resources: Top/local, L2/GND, L3/byte0, L4/GND,
// L5/CA+CK, L6/DDR1V5, L7/byte1, Bottom/general. Reference planes and
// decoupling must be integrated before final electrical qualification.
// 0.35/0.15mm dogbones enlarge the documented land to reserve drill clearance; an
// investigatory process. TI's 18–20mil land/10mil drill guideline differs;
// final fabrication geometry and stackup have not been qualified.
const phaseGroups=[ddrGroups[1],ddrGroups[0],ddrGroups[2]]

export default ()=> <board title="AM3352 + 512MB DDR3 — byte1-swizzled bus_lanes bootstrap"
  width={30} height={46} outlineOffsetY={-13} layers={8} thickness={1.6}
  minTraceWidth={.1016} nominalTraceWidth={.1016}
  minTraceToPadEdgeClearance={.1016} minPadEdgeToPadEdgeClearance={.15}
  minViaHoleDiameter={.15} minViaPadDiameter={.35}
  minViaEdgeToPadEdgeClearance={.1016} minTraceToHoleEdgeClearance={.2}
  minViaHoleEdgeToViaHoleEdgeClearance={.254} minBoardEdgeClearance={.3}
  isViaInPadAllowed={false} allowBlindAndBuriedVias={false}
  schAutoLayoutEnabled={false} routeRemaining={false}>
  {phaseGroups.map((g,i)=><autoroutingphase key={g.name} name={`${g.name}_BUS_LANES`} phaseIndex={i+1} autorouter="bus_lanes"/>)}
  <autoroutingphase name="DDR_RESET_BUS_LANES" phaseIndex={4} autorouter="bus_lanes"/>
  <DdrConstraints pairGap={.12}/>
  <AM3352BZCZ100 name="U_SOC" pcbX={0} pcbY={0} layer="top" schX={-12} schY={0} schWidth={8} schHeight={50}/>
  <MT41K256M16TW_107_P name="U_RAM" pcbX={0} pcbY={-27} layer="top" schX={12} schY={0} schWidth={8} schHeight={28}/>
  {connections.map(c=><trace key={c.name} name={c.name} from={`U_SOC.${c.socPin}`}
    to={`U_RAM.${c.ramPin}`} thickness={.1016}
    routingPhaseIndex={c.name==="DDR_RESETn"?4:phaseGroups.findIndex(g=>g.signals.includes(c.name))+1}/>)}
  <silkscreentext text="AM3352 DDR3 STUDY — DO NOT FAB" pcbX={0} pcbY={-35} fontSize={.8}/>
</board>
