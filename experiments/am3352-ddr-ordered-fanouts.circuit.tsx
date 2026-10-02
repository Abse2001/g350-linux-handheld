import {AM3352BZCZ100} from "../imports/AM3352BZCZ100"
import {MT41K256M16TW_107_P} from "../imports/MT41K256M16TW_107_P"
import connections from "../lib/am3352/memory-connections.json"
import {DdrConstraints,ddrGroups} from "../lib/am3352/DdrConstraints"

// Authored from individual JLCPCB imports, using the public native DDR
// preset documented at https://docs.tscircuit.com/guides/routing-ddr.
// Facing breakout boundaries reserve separate exit regions for each bus,
// following the documented three-region DDR routing flow.
// This bootstrap is a signal-only feasibility fixture, not a powered
// handheld. No complete PCB/module or saved autorouter routes are imported.
// Proposed 8-layer resources: Top/local, L2/GND, L3/byte0, L4/GND,
// L5/CA+CK, L6/DDR1V5, L7/byte1, Bottom/general. Reference planes and
// decoupling must be integrated before final electrical qualification.
// 0.35/0.15mm dogbones enlarge the documented land to reserve drill clearance; an
// investigatory process. TI's 18–20mil land/10mil drill guideline differs;
// final fabrication geometry and stackup have not been qualified.
export default ()=> <board title="AM3352 + 512MB DDR3 — opposing fanouts + bus_lanes bootstrap"
  width={36} height={56} outlineOffsetY={-17} layers={8} thickness={1.6}
  minTraceWidth={.1016} nominalTraceWidth={.1016}
  minTraceToPadEdgeClearance={.1016} minPadEdgeToPadEdgeClearance={.15}
  minViaHoleDiameter={.15} minViaPadDiameter={.35}
  minViaEdgeToPadEdgeClearance={.1016} minTraceToHoleEdgeClearance={.2}
  minViaHoleEdgeToViaHoleEdgeClearance={.254} minBoardEdgeClearance={.3}
  isViaInPadAllowed={false} allowBlindAndBuriedVias={false}
  schAutoLayoutEnabled={false} routeRemaining={false}>
  {ddrGroups.map((g,i)=><autoroutingphase key={g.name} name={`${g.name}_BUS_LANES`} phaseIndex={i+1} autorouter="bus_lanes"/>)}
  <autoroutingphase name="DDR_RESET_BUS_LANES" phaseIndex={4} autorouter="bus_lanes"/>
  <DdrConstraints pairGap={.12}/>
  <breakout name="SOC_ORDERED_FANOUT" pcbX={0} pcbY={0} width={28} height={24}
    autorouter="fanout" fanoutRoutingLayers={["inner2","inner4","inner6"]}
    busFanoutDirections={{DDR_BYTE0:"bottomside_right",DDR_BYTE1:"bottomside_center",DDR_COMMAND_CLOCK:"bottomside_left",DDR_RESET:"bottomside_left"}}>
    <AM3352BZCZ100 name="U_SOC" pcbX={0} pcbY={0} layer="top" schX={-12} schY={0} schWidth={8} schHeight={50}/>
  </breakout>
  <breakout name="RAM_ORDERED_FANOUT" pcbX={0} pcbY={-34} width={28} height={20}
    autorouter="fanout" fanoutRoutingLayers={["inner2","inner4","inner6"]}
    busFanoutDirections={{DDR_BYTE0:"topside_right",DDR_BYTE1:"topside_center",DDR_COMMAND_CLOCK:"topside_left",DDR_RESET:"topside_left"}}>
    <MT41K256M16TW_107_P name="U_RAM" pcbX={0} pcbY={0} layer="top" schX={12} schY={0} schWidth={8} schHeight={28}/>
  </breakout>
  {connections.map(c=><trace key={c.name} name={c.name} from={`U_SOC.${c.socPin}`}
    to={`U_RAM.${c.ramPin}`} thickness={.1016}
    routingPhaseIndex={c.name==="DDR_RESETn"?4:ddrGroups.findIndex(g=>g.signals.includes(c.name))+1}/>)}
  <silkscreentext text="AM3352 DDR3 STUDY — DO NOT FAB" pcbX={0} pcbY={-43} fontSize={.8}/>
</board>
