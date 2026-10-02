import {AM3352BZCZ100} from "../imports/AM3352BZCZ100"
import {MT41K256M16TW_107_P} from "../imports/MT41K256M16TW_107_P"
import connections from "../lib/am3352/memory-byte1-swizzled-connections.json"
import {DdrConstraints,ddrGroups} from "../lib/am3352/DdrConstraints"
import {nativeEscapes} from "../lib/am3352/NativeEscapes"

// All 98 native dogbones are reserved together, then each timing group
// routes in its own bus_lanes phase. pcbTracePaths replays package-local
// geometry using the documented breakout interface. No ready PCB import.
// Signal-only experiment: full power/ground, stackup and DRC still required.
export default ()=> <board title="AM3352 + 512MB DDR3 — coordinated native escapes"
  width={30} height={46} outlineOffsetY={-13} layers={8} thickness={1.6}
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
  <breakout name="SOC_NATIVE_ESCAPES" pcbX={0} pcbY={0} width={18} height={18} pcbTracePaths={nativeEscapes("U_SOC")}>
    <AM3352BZCZ100 name="U_SOC" pcbX={0} pcbY={0} layer="top" schX={-12} schY={0} schWidth={8} schHeight={50}/>
  </breakout>
  <breakout name="RAM_NATIVE_ESCAPES" pcbX={0} pcbY={-27} width={10} height={16} pcbTracePaths={nativeEscapes("U_RAM")}>
    <MT41K256M16TW_107_P name="U_RAM" pcbX={0} pcbY={0} layer="top" schX={12} schY={0} schWidth={8} schHeight={28}/>
  </breakout>
  {connections.map(c=><trace key={c.name} name={c.name} from={`U_SOC.${c.socPin}`}
    to={`U_RAM.${c.ramPin}`} thickness={.1016}
    routingPhaseIndex={c.name==="DDR_RESETn"?4:ddrGroups.findIndex(g=>g.signals.includes(c.name))+1}/>)}
  <silkscreentext text="AM3352 DDR3 STUDY — DO NOT FAB" pcbX={0} pcbY={-35} fontSize={.8}/>
</board>
