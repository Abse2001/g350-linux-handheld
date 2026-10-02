import {AM3352BZCZ100} from "../imports/AM3352BZCZ100"
import {MT41K256M16TW_107_P} from "../imports/MT41K256M16TW_107_P"
import connections from "../lib/am3352/memory-connections.json"
import {DdrConstraints,ddrGroups} from "../lib/am3352/DdrConstraints"
import {manualEscapes} from "../lib/am3352/ManualEscapes"

// Authored from individual JLCPCB imports, using the public native DDR
// preset documented at https://docs.tscircuit.com/guides/routing-ddr.
// This first bootstrap is a signal-only feasibility fixture, not a powered
// handheld. No complete PCB/module or saved autorouter routes are imported.
// Proposed 8-layer resources: Top/local, L2/GND, L3/byte0, L4/GND,
// L5/CA+CK, L6/DDR1V5, L7/byte1, Bottom/general. Reference planes and
// decoupling must be integrated before final electrical qualification.
// 0.30/0.15mm dogbones follow the documented routing example and are an
// investigatory process. TI's 18–20mil land/10mil drill guideline differs;
// final fabrication geometry and stackup have not been qualified.
export default ()=> <board title="AM3352 + 512MB DDR3 — bus_lanes bootstrap"
  width={30} height={46} outlineOffsetY={-13} layers={8} thickness={1.6}
  minTraceWidth={.1016} nominalTraceWidth={.1016}
  minTraceToPadEdgeClearance={.127} minPadEdgeToPadEdgeClearance={.15}
  minViaHoleDiameter={.15} minViaPadDiameter={.3}
  minViaEdgeToPadEdgeClearance={.127} minTraceToHoleEdgeClearance={.2}
  minViaHoleEdgeToViaHoleEdgeClearance={.254} minBoardEdgeClearance={.3}
  isViaInPadAllowed={false} allowBlindAndBuriedVias={false}
  schAutoLayoutEnabled={false} routeRemaining={false}>
  {ddrGroups.map((g,i)=><autoroutingphase key={g.name} name={`${g.name}_BUS_LANES`} phaseIndex={i+1} autorouter="bus_lanes"/>)}
  <autoroutingphase name="DDR_RESET_BUS_LANES" phaseIndex={4} autorouter="bus_lanes"/>
  <DdrConstraints/>
  <breakout name="SOC_MANUAL_FANOUT" pcbX={0} pcbY={0} width={18} height={18} pcbTracePaths={manualEscapes("U_SOC")}>
    <AM3352BZCZ100 name="U_SOC" pcbX={0} pcbY={0} layer="top"
      schX={-12} schY={0} schWidth={8} schHeight={50}/>
  </breakout>
  <breakout name="RAM_MANUAL_FANOUT" pcbX={0} pcbY={-27} width={10} height={16} pcbTracePaths={manualEscapes("U_RAM")}>
    <MT41K256M16TW_107_P name="U_RAM" pcbX={0} pcbY={0} layer="top"
      schX={12} schY={0} schWidth={8} schHeight={28}/>
  </breakout>
  {connections.map(c=><trace key={c.name} name={c.name} from={`U_SOC.${c.socPin}`}
    to={`U_RAM.${c.ramPin}`} thickness={.1016}
    routingPhaseIndex={c.name==="DDR_RESETn"?4:ddrGroups.findIndex(g=>g.signals.includes(c.name))+1}/>)}
  <silkscreentext text="AM3352 DDR3 STUDY — DO NOT FAB" pcbX={0} pcbY={-35} fontSize={.8}/>
</board>
